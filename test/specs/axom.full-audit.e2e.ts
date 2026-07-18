import { browser, $, $$, expect } from '@wdio/globals'
import fs from 'node:fs'
import path from 'node:path'

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

type Finding = {
    severity: Severity
    category: string
    message: string
    page: string
    details?: unknown
}

type PageAudit = {
    name: string
    url: string
    title: string
    bodyLength: number
    buttons: number
    links: number
    fields: number
    dialogs: number
    duplicateIds: string[]
    unnamedButtons: string[]
    unlabeledFields: string[]
    horizontalOverflow: number
    consoleErrors: string[]
    runtimeErrors: string[]
    screenshotDesktop?: string
    screenshotMobile?: string
    status: 'passed' | 'failed'
    error?: string
}

type InteractionAudit = {
    page: string
    control: string
    beforeUrl: string
    afterUrl: string
    status: 'passed' | 'failed' | 'skipped'
    error?: string
}

const ROOT = path.resolve(process.cwd(), 'artifacts/site-audit-v2')
const SHOTS = path.join(ROOT, 'screenshots')
const REPORT_JSON = path.join(ROOT, 'report.json')
const REPORT_MD = path.join(ROOT, 'report.md')
const BASE_URL = 'https://www.axom.info/'

const findings: Finding[] = []
const pages: PageAudit[] = []
const interactions: InteractionAudit[] = []
const discoveredModules = new Map<string, string>()

const destructivePattern =
    /\b(delete|remove|reset|erase|destroy|clear all|sign out|log out|logout|disconnect|revoke|purchase|buy|pay|send email|submit payment)\b/i

const ignoredControlPattern =
    /\b(refresh|clock|time|profile|avatar|notification|notifications)\b/i

function ensureOutput(): void {
    fs.rmSync(ROOT, { recursive: true, force: true })
    fs.mkdirSync(SHOTS, { recursive: true })
}

function slug(value: string): string {
    return (
        value
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 100) || 'page'
    )
}

function addFinding(
    severity: Severity,
    category: string,
    message: string,
    page: string,
    details?: unknown,
): void {
    findings.push({
        severity,
        category,
        message,
        page,
        details,
    })
}

async function settle(ms = 700): Promise<void> {
    await browser.pause(ms)

    await browser
        .waitUntil(
            async () => {
                const state = await browser.execute(() => document.readyState)
                return state === 'interactive' || state === 'complete'
            },
            {
                timeout: 10_000,
                interval: 200,
                timeoutMsg: 'Page never became interactive',
            },
        )
        .catch(() => undefined)
}

async function installCollectors(): Promise<void> {
    await browser.execute(() => {
        type AuditWindow = Window & {
            __AXOM_AUDIT_V2__?: {
                consoleErrors: string[]
                runtimeErrors: string[]
            }
        }

        const auditWindow = window as AuditWindow

        if (auditWindow.__AXOM_AUDIT_V2__) return

        auditWindow.__AXOM_AUDIT_V2__ = {
            consoleErrors: [],
            runtimeErrors: [],
        }

        const originalError = console.error.bind(console)

        console.error = (...args: unknown[]) => {
            const message = args
                .map((item) => {
                    if (typeof item === 'string') return item

                    try {
                        return JSON.stringify(item)
                    } catch {
                        return String(item)
                    }
                })
                .join(' ')

            auditWindow.__AXOM_AUDIT_V2__?.consoleErrors.push(message)
            originalError(...args)
        }

        window.addEventListener('error', (event) => {
            auditWindow.__AXOM_AUDIT_V2__?.runtimeErrors.push(
                `${event.message || 'Unknown error'} at ${event.filename || 'unknown'}:${event.lineno || 0}`,
            )
        })

        window.addEventListener('unhandledrejection', (event) => {
            let message = 'Unhandled promise rejection'

            try {
                message =
                    typeof event.reason === 'string'
                        ? event.reason
                        : JSON.stringify(event.reason)
            } catch {
                message = String(event.reason)
            }

            auditWindow.__AXOM_AUDIT_V2__?.runtimeErrors.push(message)
        })
    })
}

async function clearAppState(): Promise<void> {
    await browser.url(BASE_URL)
    await settle()

    await browser.execute(() => {
        localStorage.clear()
        sessionStorage.clear()
    })

    await browser.refresh()
    await settle(900)
}

async function getVisibleControlLabels(): Promise<
    Array<{
        label: string
        tag: string
        href: string | null
        role: string | null
    }>
> {
    return browser.execute(() => {
        const visible = (element: HTMLElement): boolean => {
            const style = getComputedStyle(element)
            const rect = element.getBoundingClientRect()

            return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                Number(style.opacity || 1) > 0 &&
                rect.width > 0 &&
                rect.height > 0
            )
        }

        const controls = Array.from(
            document.querySelectorAll<HTMLElement>(
                'button, a[href], [role="button"], [role="menuitem"], [role="tab"]',
            ),
        )

        return controls
            .filter(visible)
            .map((element) => {
                const label = (
                    element.getAttribute('aria-label') ||
                    element.getAttribute('title') ||
                    element.textContent ||
                    ''
                )
                    .replace(/\s+/g, ' ')
                    .trim()

                return {
                    label,
                    tag: element.tagName.toLowerCase(),
                    href:
                        element instanceof HTMLAnchorElement
                            ? element.href
                            : null,
                    role: element.getAttribute('role'),
                }
            })
            .filter((item) => item.label)
    })
}

async function clickByExactText(label: string): Promise<boolean> {
    return browser.execute((wanted) => {
        const visible = (element: HTMLElement): boolean => {
            const style = getComputedStyle(element)
            const rect = element.getBoundingClientRect()

            return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0
            )
        }

        const elements = Array.from(
            document.querySelectorAll<HTMLElement>(
                'button, a[href], [role="button"], [role="menuitem"], [role="tab"], label',
            ),
        )

        const match = elements.find((element) => {
            if (!visible(element)) return false

            const text = (
                element.getAttribute('aria-label') ||
                element.getAttribute('title') ||
                element.textContent ||
                ''
            )
                .replace(/\s+/g, ' ')
                .trim()

            return text === wanted
        })

        if (!match) return false

        match.click()
        return true
    }, label)
}

async function clickByContainsText(label: string): Promise<boolean> {
    return browser.execute((wanted) => {
        const visible = (element: HTMLElement): boolean => {
            const style = getComputedStyle(element)
            const rect = element.getBoundingClientRect()

            return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0
            )
        }

        const normalizedWanted = wanted.toLowerCase()

        const elements = Array.from(
            document.querySelectorAll<HTMLElement>(
                'button, a[href], [role="button"], [role="menuitem"], [role="tab"]',
            ),
        )

        const match = elements.find((element) => {
            if (!visible(element)) return false

            const text = (
                element.getAttribute('aria-label') ||
                element.getAttribute('title') ||
                element.textContent ||
                ''
            )
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase()

            return text.includes(normalizedWanted)
        })

        if (!match) return false

        match.click()
        return true
    }, label)
}

async function screenshot(name: string, suffix: string): Promise<string> {
    const file = path.join(SHOTS, `${slug(name)}-${suffix}.png`)
    await browser.saveScreenshot(file)
    return file
}

async function inspectCurrentPage(
    name: string,
    mode: 'desktop' | 'mobile',
): Promise<PageAudit> {
    await installCollectors()
    await settle()

    const url = await browser.getUrl()
    const title = await browser.getTitle()

    const data = await browser.execute(() => {
        type AuditWindow = Window & {
            __AXOM_AUDIT_V2__?: {
                consoleErrors: string[]
                runtimeErrors: string[]
            }
        }

        const visible = (element: HTMLElement): boolean => {
            const style = getComputedStyle(element)
            const rect = element.getBoundingClientRect()

            return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                Number(style.opacity || 1) > 0 &&
                rect.width > 0 &&
                rect.height > 0
            )
        }

        const labelOf = (element: HTMLElement): string =>
            (
                element.getAttribute('aria-label') ||
                element.getAttribute('title') ||
                element.textContent ||
                ''
            )
                .replace(/\s+/g, ' ')
                .trim()

        const bodyText = document.body?.innerText?.trim() || ''

        const buttons = Array.from(
            document.querySelectorAll<HTMLElement>(
                'button, [role="button"]',
            ),
        ).filter(visible)

        const links = Array.from(
            document.querySelectorAll<HTMLAnchorElement>('a[href]'),
        ).filter(visible)

        const fields = Array.from(
            document.querySelectorAll<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >('input:not([type="hidden"]), textarea, select'),
        ).filter(visible)

        const dialogs = Array.from(
            document.querySelectorAll<HTMLElement>(
                '[role="dialog"], dialog, [aria-modal="true"]',
            ),
        ).filter(visible)

        const ids = Array.from(
            document.querySelectorAll<HTMLElement>('[id]'),
        )
            .map((element) => element.id)
            .filter(Boolean)

        const duplicateIds = ids
            .filter((id, index) => ids.indexOf(id) !== index)
            .filter((id, index, values) => values.indexOf(id) === index)

        const unnamedButtons = buttons
            .filter((button) => !labelOf(button))
            .map((button) => button.outerHTML.slice(0, 250))

        const unlabeledFields = fields
            .filter((field) => {
                const id = field.id

                const explicitLabel =
                    id &&
                    Boolean(
                        document.querySelector(
                            `label[for="${CSS.escape(id)}"]`,
                        ),
                    )

                const wrappingLabel = Boolean(field.closest('label'))

                const accessibleName = Boolean(
                    field.getAttribute('aria-label') ||
                        field.getAttribute('aria-labelledby') ||
                        field.getAttribute('title') ||
                        field.getAttribute('placeholder'),
                )

                return !explicitLabel && !wrappingLabel && !accessibleName
            })
            .map((field) => field.outerHTML.slice(0, 250))

        const root = document.documentElement

        const auditData = (window as AuditWindow).__AXOM_AUDIT_V2__

        return {
            bodyLength: bodyText.length,
            buttons: buttons.length,
            links: links.length,
            fields: fields.length,
            dialogs: dialogs.length,
            duplicateIds,
            unnamedButtons,
            unlabeledFields,
            horizontalOverflow: Math.max(
                0,
                root.scrollWidth - root.clientWidth,
            ),
            consoleErrors: auditData?.consoleErrors || [],
            runtimeErrors: auditData?.runtimeErrors || [],
            hasMain: Boolean(document.querySelector('main, [role="main"]')),
            h1Count: Array.from(document.querySelectorAll('h1')).filter(
                visible,
            ).length,
        }
    })

    const page: PageAudit = {
        name,
        url,
        title,
        bodyLength: data.bodyLength,
        buttons: data.buttons,
        links: data.links,
        fields: data.fields,
        dialogs: data.dialogs,
        duplicateIds: data.duplicateIds,
        unnamedButtons: data.unnamedButtons,
        unlabeledFields: data.unlabeledFields,
        horizontalOverflow: data.horizontalOverflow,
        consoleErrors: data.consoleErrors,
        runtimeErrors: data.runtimeErrors,
        status: 'passed',
    }

    if (mode === 'desktop') {
        page.screenshotDesktop = await screenshot(name, 'desktop')
    } else {
        page.screenshotMobile = await screenshot(name, 'mobile')
    }

    if (data.bodyLength < 20) {
        page.status = 'failed'
        addFinding(
            'critical',
            'Rendering',
            `Page contains only ${data.bodyLength} visible characters`,
            name,
        )
    }

    if (data.horizontalOverflow > 4) {
        addFinding(
            'high',
            'Responsive layout',
            `${mode} page overflows horizontally by ${data.horizontalOverflow}px`,
            name,
        )
    }

    if (data.duplicateIds.length > 0) {
        addFinding(
            'high',
            'DOM integrity',
            `${data.duplicateIds.length} duplicate IDs found`,
            name,
            data.duplicateIds,
        )
    }

    if (data.unnamedButtons.length > 0) {
        addFinding(
            'high',
            'Accessibility',
            `${data.unnamedButtons.length} visible buttons have no accessible name`,
            name,
            data.unnamedButtons,
        )
    }

    if (data.unlabeledFields.length > 0) {
        addFinding(
            'high',
            'Accessibility',
            `${data.unlabeledFields.length} visible fields appear unlabeled`,
            name,
            data.unlabeledFields,
        )
    }

    if (!data.hasMain) {
        addFinding(
            'medium',
            'Accessibility',
            'No main landmark found',
            name,
        )
    }

    if (data.h1Count === 0) {
        addFinding(
            'low',
            'Accessibility',
            'No visible H1 found',
            name,
        )
    }

    for (const error of data.consoleErrors) {
        addFinding(
            'high',
            'Console',
            error.slice(0, 500),
            name,
        )
    }

    for (const error of data.runtimeErrors) {
        addFinding(
            'critical',
            'Runtime',
            error.slice(0, 500),
            name,
        )
    }

    pages.push(page)
    return page
}

async function auditOnboarding(): Promise<void> {
    await clearAppState()
    await browser.setWindowSize(1440, 1000)

    await inspectCurrentPage('Onboarding - Identity', 'desktop')

    const displayName = await $('input[placeholder*="name" i]')

    if (await displayName.isExisting()) {
        await displayName.setValue('AXOM Audit User')
    }

    const sequence = [
        'Continue',
        'Continue',
        'Continue',
    ]

    let step = 2

    for (const label of sequence) {
        const beforeUrl = await browser.getUrl()
        const clicked = await clickByExactText(label)

        if (!clicked) {
            interactions.push({
                page: `Onboarding step ${step - 1}`,
                control: label,
                beforeUrl,
                afterUrl: await browser.getUrl(),
                status: 'skipped',
                error: 'Continue button not found',
            })
            break
        }

        await settle(900)

        interactions.push({
            page: `Onboarding step ${step - 1}`,
            control: label,
            beforeUrl,
            afterUrl: await browser.getUrl(),
            status: 'passed',
        })

        await inspectCurrentPage(
            `Onboarding - Step ${step}`,
            'desktop',
        )

        step += 1
    }

    const finishLabels = [
        'Finish setup',
        'Complete setup',
        'Enter AXOM',
        'Go to dashboard',
        'Continue',
    ]

    for (const label of finishLabels) {
        const clicked = await clickByExactText(label)

        if (clicked) {
            await settle(1000)
            break
        }
    }
}

async function reachDashboard(): Promise<void> {
    await browser.url(BASE_URL)
    await settle(900)

    const bodyText = await $('body').getText()

    if (/skip setup/i.test(bodyText)) {
        await clickByContainsText('Skip setup')
        await settle(1000)
    }

    const finalText = await $('body').getText()

    if (!/dashboard/i.test(finalText)) {
        await browser.url(`${BASE_URL}#dashboard`)
        await settle(1000)
    }

    await expect($('body')).toBeDisplayed()
}

async function openMobileMenuIfNeeded(): Promise<void> {
    const menuButton = await $(
        'button[aria-label*="menu" i], button[title*="menu" i]',
    )

    if (await menuButton.isExisting()) {
        if (await menuButton.isDisplayed()) {
            await menuButton.click()
            await settle(400)
            return
        }
    }

    const clicked = await browser.execute(() => {
        const visible = (element: HTMLElement): boolean => {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)

            return (
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden'
            )
        }

        const buttons = Array.from(
            document.querySelectorAll<HTMLElement>('button'),
        ).filter(visible)

        const candidate = buttons.find((button) => {
            const rect = button.getBoundingClientRect()
            const text = (
                button.getAttribute('aria-label') ||
                button.textContent ||
                ''
            ).trim()

            return (
                rect.left < 140 &&
                rect.top < 150 &&
                (text === '' ||
                    /menu|navigation|sidebar/i.test(text))
            )
        })

        if (!candidate) return false
        candidate.click()
        return true
    })

    if (clicked) await settle(400)
}

async function discoverSidebarModules(): Promise<string[]> {
    await reachDashboard()
    await browser.setWindowSize(1440, 1000)
    await settle()

    const labels = await browser.execute(() => {
        const visible = (element: HTMLElement): boolean => {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)

            return (
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden'
            )
        }

        const excluded =
            /^(customize|about|help|axom discord channel|axom|control surface|academic prep|tools)$/i

        return Array.from(
            document.querySelectorAll<HTMLElement>(
                'aside button, aside a, nav button, nav a, [role="navigation"] button, [role="navigation"] a',
            ),
        )
            .filter(visible)
            .map((element) =>
                (
                    element.getAttribute('aria-label') ||
                    element.getAttribute('title') ||
                    element.textContent ||
                    ''
                )
                    .replace(/\b(NEW|WIP|BUILDING)\b/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim(),
            )
            .filter(
                (label) =>
                    label &&
                    !excluded.test(label) &&
                    label.length < 80,
            )
            .filter(
                (label, index, values) =>
                    values.indexOf(label) === index,
            )
    })

    const fallback = [
        'Dashboard',
        'Course Tracker',
        'Question Bank',
        'Anki Lab',
        'Productivity',
        'Journal',
        'Reports',
        'USMLE / Shelf',
        'Applications',
        'Tasks',
        'Study Methods',
        'Resources',
        'Leaderboard',
    ]

    return Array.from(new Set([...labels, ...fallback]))
}

async function auditModuleDesktop(label: string): Promise<void> {
    await reachDashboard()
    await browser.setWindowSize(1440, 1000)
    await settle()

    const beforeUrl = await browser.getUrl()
    const clicked =
        (await clickByExactText(label)) ||
        (await clickByContainsText(label))

    if (!clicked) {
        interactions.push({
            page: 'Sidebar',
            control: label,
            beforeUrl,
            afterUrl: await browser.getUrl(),
            status: 'skipped',
            error: 'Navigation control not found',
        })
        return
    }

    await settle(900)

    const afterUrl = await browser.getUrl()
    const bodyText = await $('body').getText()

    interactions.push({
        page: 'Sidebar',
        control: label,
        beforeUrl,
        afterUrl,
        status: 'passed',
    })

    discoveredModules.set(label, afterUrl)

    if (
        /application error|internal server error|unexpected error|chunkloaderror/i.test(
            bodyText,
        )
    ) {
        addFinding(
            'critical',
            'Navigation',
            'Application error appeared after opening module',
            label,
            bodyText.slice(0, 1200),
        )
    }

    await inspectCurrentPage(label, 'desktop')
    await auditSafeControlsOnCurrentPage(label)
}

async function auditSafeControlsOnCurrentPage(
    pageName: string,
): Promise<void> {
    const controls = await getVisibleControlLabels()

    const candidates = controls
        .filter((control) => !destructivePattern.test(control.label))
        .filter((control) => !ignoredControlPattern.test(control.label))
        .filter(
            (control) =>
                /^(add|create|new|open|close|cancel|edit|start|continue|next|back|previous|view|show|hide|customize|settings|filter|search|practice|study|launch|begin)\b/i.test(
                    control.label,
                ),
        )
        .slice(0, 8)

    for (const control of candidates) {
        const beforeUrl = await browser.getUrl()

        try {
            const clicked = await clickByExactText(control.label)

            if (!clicked) {
                interactions.push({
                    page: pageName,
                    control: control.label,
                    beforeUrl,
                    afterUrl: await browser.getUrl(),
                    status: 'skipped',
                })
                continue
            }

            await settle(500)

            const afterUrl = await browser.getUrl()
            const text = await $('body').getText()

            if (
                /application error|internal server error|unexpected error|chunkloaderror/i.test(
                    text,
                )
            ) {
                throw new Error(
                    'Application error appeared after clicking control',
                )
            }

            interactions.push({
                page: pageName,
                control: control.label,
                beforeUrl,
                afterUrl,
                status: 'passed',
            })

            if (afterUrl !== beforeUrl) {
                await browser.back()
                await settle(500)
            } else {
                await clickByExactText('Close')
                await clickByExactText('Cancel')
                await settle(300)
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)

            interactions.push({
                page: pageName,
                control: control.label,
                beforeUrl,
                afterUrl: await browser.getUrl(),
                status: 'failed',
                error: message,
            })

            addFinding(
                'high',
                'Interaction',
                `Control failed: ${control.label}`,
                pageName,
                message,
            )

            await reachDashboard()
        }
    }
}

async function auditModuleMobile(
    label: string,
    targetUrl: string,
): Promise<void> {
    await browser.setWindowSize(390, 844)

    if (targetUrl && targetUrl !== BASE_URL) {
        await browser.url(targetUrl)
        await settle(900)
    } else {
        await reachDashboard()
        await openMobileMenuIfNeeded()

        const clicked =
            (await clickByExactText(label)) ||
            (await clickByContainsText(label))

        if (!clicked) return
        await settle(900)
    }

    await inspectCurrentPage(`${label} - Mobile`, 'mobile')
}

async function testPersistence(): Promise<void> {
    await reachDashboard()

    const key = `axom-audit-${Date.now()}`
    const value = `value-${Math.random().toString(36).slice(2)}`

    await browser.execute(
        (storageKey, storageValue) => {
            localStorage.setItem(storageKey, storageValue)
        },
        key,
        value,
    )

    await browser.refresh()
    await settle(700)

    const restored = await browser.execute(
        (storageKey) => localStorage.getItem(storageKey),
        key,
    )

    await browser.execute(
        (storageKey) => localStorage.removeItem(storageKey),
        key,
    )

    if (restored !== value) {
        addFinding(
            'critical',
            'Persistence',
            'localStorage did not survive refresh',
            'Dashboard',
            {
                expected: value,
                received: restored,
            },
        )
    }
}

function writeReport(): void {
    const order: Severity[] = [
        'critical',
        'high',
        'medium',
        'low',
        'info',
    ]

    const counts = Object.fromEntries(
        order.map((severity) => [
            severity,
            findings.filter(
                (finding) => finding.severity === severity,
            ).length,
        ]),
    )

    const report = {
        startedAt,
        completedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        pages,
        interactions,
        discoveredModules: Array.from(discoveredModules.entries()).map(
            ([name, url]) => ({ name, url }),
        ),
        findings,
        summary: {
            ...counts,
            pagesAudited: pages.length,
            pagesPassed: pages.filter(
                (page) => page.status === 'passed',
            ).length,
            pagesFailed: pages.filter(
                (page) => page.status === 'failed',
            ).length,
            modulesDiscovered: discoveredModules.size,
            interactionsAttempted: interactions.length,
            interactionsPassed: interactions.filter(
                (item) => item.status === 'passed',
            ).length,
            interactionsFailed: interactions.filter(
                (item) => item.status === 'failed',
            ).length,
            interactionsSkipped: interactions.filter(
                (item) => item.status === 'skipped',
            ).length,
        },
    }

    fs.writeFileSync(
        REPORT_JSON,
        JSON.stringify(report, null, 2),
    )

    const md: string[] = [
        '# AXOM Full Feature Audit',
        '',
        `- Started: ${report.startedAt}`,
        `- Completed: ${report.completedAt}`,
        `- Pages audited: ${report.summary.pagesAudited}`,
        `- Modules discovered: ${report.summary.modulesDiscovered}`,
        `- Interactions attempted: ${report.summary.interactionsAttempted}`,
        `- Interactions passed: ${report.summary.interactionsPassed}`,
        `- Interactions failed: ${report.summary.interactionsFailed}`,
        '',
        '## Severity Summary',
        '',
        `- Critical: ${report.summary.critical}`,
        `- High: ${report.summary.high}`,
        `- Medium: ${report.summary.medium}`,
        `- Low: ${report.summary.low}`,
        `- Info: ${report.summary.info}`,
        '',
        '## Findings',
        '',
    ]

    if (findings.length === 0) {
        md.push('No automated findings were recorded.', '')
    }

    for (const severity of order) {
        const group = findings.filter(
            (finding) => finding.severity === severity,
        )

        if (group.length === 0) continue

        md.push(`### ${severity.toUpperCase()}`, '')

        for (const finding of group) {
            md.push(
                `- **${finding.category} · ${finding.page}:** ${finding.message}`,
            )

            if (finding.details !== undefined) {
                const detail = JSON.stringify(
                    finding.details,
                    null,
                    2,
                ).slice(0, 4000)

                md.push(
                    '',
                    '  ```json',
                    ...detail
                        .split('\n')
                        .map((line) => `  ${line}`),
                    '  ```',
                    '',
                )
            }
        }
    }

    md.push(
        '',
        '## Pages Audited',
        '',
        '| Status | Page | URL | Text | Buttons | Fields | Overflow |',
        '|---|---|---|---:|---:|---:|---:|',
    )

    for (const page of pages) {
        md.push(
            `| ${page.status} | ${page.name.replace(/\|/g, '\\|')} | ${page.url} | ${page.bodyLength} | ${page.buttons} | ${page.fields} | ${page.horizontalOverflow}px |`,
        )
    }

    md.push(
        '',
        '## Interactions',
        '',
        '| Status | Page | Control | Before | After |',
        '|---|---|---|---|---|',
    )

    for (const item of interactions) {
        md.push(
            `| ${item.status} | ${item.page.replace(/\|/g, '\\|')} | ${item.control.replace(/\|/g, '\\|')} | ${item.beforeUrl} | ${item.afterUrl} |`,
        )
    }

    md.push(
        '',
        '## Discovered Modules',
        '',
        '| Module | URL |',
        '|---|---|',
    )

    for (const [name, url] of discoveredModules.entries()) {
        md.push(`| ${name.replace(/\|/g, '\\|')} | ${url} |`)
    }

    fs.writeFileSync(REPORT_MD, md.join('\n'))

    console.log('')
    console.log('========================================')
    console.log('AXOM FULL AUDIT COMPLETE')
    console.log('========================================')
    console.log(`Pages audited: ${report.summary.pagesAudited}`)
    console.log(`Modules discovered: ${report.summary.modulesDiscovered}`)
    console.log(`Interactions: ${report.summary.interactionsAttempted}`)
    console.log(`Critical: ${report.summary.critical}`)
    console.log(`High: ${report.summary.high}`)
    console.log(`Medium: ${report.summary.medium}`)
    console.log(`Report: ${REPORT_MD}`)
    console.log(`Screenshots: ${SHOTS}`)
    console.log('========================================')
}

const startedAt = new Date().toISOString()

describe('AXOM full application audit', () => {
    before(() => {
        ensureOutput()
    })

    it('audits the full onboarding flow', async function () {
        this.timeout(90_000)
        await auditOnboarding()
    })

    it('discovers and audits every sidebar module', async function () {
        this.timeout(300_000)

        await reachDashboard()
        await inspectCurrentPage('Dashboard', 'desktop')

        const modules = await discoverSidebarModules()

        console.log(
            `[AUDIT] Candidate modules: ${modules.join(', ')}`,
        )

        for (const moduleName of modules) {
            console.log(`[AUDIT] Opening module: ${moduleName}`)
            await auditModuleDesktop(moduleName)
        }
    })

    it('audits discovered modules at mobile size', async function () {
        this.timeout(240_000)

        for (const [moduleName, url] of discoveredModules.entries()) {
            console.log(
                `[AUDIT] Mobile module: ${moduleName}`,
            )

            await auditModuleMobile(moduleName, url)
        }
    })

    it('checks browser persistence', async () => {
        await testPersistence()
    })

    after(() => {
        writeReport()
    })
})
