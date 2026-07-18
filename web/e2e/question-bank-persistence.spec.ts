import { expect, test, type Page } from "@playwright/test";
import { STORAGE_KEYS } from "../src/lib/brand";

const PPD_FIXTURE = [
  "1. A 36-year-old man with tuberculosis exposure has a positive PPD skin test. Which cell type primarily mediates this reaction?",
  "A. B lymphocytes",
  "B. CD4+ T lymphocytes",
  "C. Mast cells",
  "D. Eosinophils",
  "E. Neutrophils",
  "Answer: B. CD4+ T lymphocytes",
  "Explanation: The PPD test is a type IV hypersensitivity reaction mediated by Th1 CD4+ T cells and macrophages.",
  "Learning Objective: Recognize delayed-type hypersensitivity.",
].join("\n");

test("onboarding → import → block → repair → reload retains the full question journey", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/#questions", { waitUntil: "networkidle" });
  await completeOnboarding(page);
  await page.evaluate(() => { window.location.hash = "questions"; });
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Question Bank" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import Questions" })).toBeVisible();

  await page.getByRole("tab", { name: "Import" }).click();
  await page.getByLabel("Choose a question file to import").setInputFiles({
    name: "ppd-regression.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(PPD_FIXTURE),
  });
  await expect(page.getByText("Review 1 parsed question", { exact: false })).toBeVisible();

  const draft = page.locator(".import-draft").first();
  await draft.locator("button.card-row-main").click();
  await expect(draft.getByLabel("Correct answer")).toHaveValue("B");
  await expect(draft.getByRole("textbox", { name: "Option E" })).toHaveValue("Neutrophils");
  await expect(draft.getByLabel("Explanation")).toHaveValue(
    "The PPD test is a type IV hypersensitivity reaction mediated by Th1 CD4+ T cells and macrophages.",
  );

  await page.getByLabel("Set title").fill("AXOM persisted journey");
  await page.getByRole("button", { name: /^Save$/ }).click();
  await page.getByRole("tab", { name: /Question Sets \(1\)/ }).click();
  const setCard = page.locator("article.qset-card").filter({ hasText: "AXOM persisted journey" });
  await expect(setCard).toBeVisible();

  await setCard.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("dialog", { name: "Set up a tutor block" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept("AXOM persisted block"));
  await page.getByRole("button", { name: "Save as block" }).click();
  await page.getByRole("button", { name: /Start tutor block/ }).click();

  await page.keyboard.press("A");
  await expect(page.getByRole("button", { name: "A. B lymphocytes" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(page.locator(".result-banner[role='status']")).toContainText("Incorrect — you picked A, answer is B");
  await expect(page.locator(".feedback-explanation p")).toHaveText(
    "The PPD test is a type IV hypersensitivity reaction mediated by Th1 CD4+ T cells and macrophages.",
  );

  await page.getByRole("button", { name: "Repair card" }).click();
  await page.getByLabel("Why did this go wrong?").selectOption("knowledge-gap");
  await page.getByRole("button", { name: "Confidence 4 of 5" }).click();
  await page.getByRole("button", { name: "Finish block" }).click();
  await expect(page.getByRole("dialog", { name: "Block results" })).toContainText("0/1 correct (0%)");
  await page.getByRole("button", { name: "Done" }).click();

  await expect.poll(async () => (await readPersistedWorkspace(page)).questions?.[0]?.attempts?.length ?? 0).toBe(1);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Question Sets/ }).click();
  const reloadedCard = page.locator("article.qset-card").filter({ hasText: "AXOM persisted journey" });
  await expect(reloadedCard).toBeVisible();
  await expect(reloadedCard.getByLabel("0% current mastery")).toHaveClass(/red/);
  await expect(reloadedCard.getByText("Attempt accuracy 0% · 1 total attempt")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["light", "dark"] as const) {
    await page.locator("html").evaluate((root, resolvedTheme) => root.setAttribute("data-theme", resolvedTheme), theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(reloadedCard).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.locator(".surface-scroll").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);

  const persisted = await readPersistedWorkspace(page);
  expect(persisted.schemaVersion).toBe(33);
  expect(persisted.questions).toHaveLength(1);
  expect(persisted.questions[0]).toMatchObject({
    correctKey: "B",
    correctAnswerText: "CD4+ T lymphocytes",
  });
  expect(persisted.questions[0].attempts[0]).toMatchObject({
    answerKey: "A",
    status: "incorrect",
    confidence: 4,
    errorType: "knowledge-gap",
  });
  expect(persisted.documents[0].linkedQuestionSetIds).toEqual([persisted.questionSets[0].id]);
  expect(persisted.questionSets[0].sourceDocumentIds).toEqual([persisted.documents[0].id]);
  expect(persisted.quizBlocks[0]).toMatchObject({ title: "AXOM persisted block" });
  expect(persisted.quizBlocks[0].lastRunAt).toBeTruthy();
  expect(persisted.ankiCards).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: "error-repair", questionId: persisted.questions[0].id }),
  ]));

  const storageEvidence = await page.evaluate(async ({ dbName, stateKey }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const stores = [...db.objectStoreNames];
    db.close();
    return {
      stores,
      workspaceInLocalStorage: localStorage.getItem(stateKey),
      scopedWorkspaceInLocalStorage: Object.keys(localStorage).some((key) => key.startsWith(`${stateKey}:user:`)),
    };
  }, { dbName: STORAGE_KEYS.vaultDb, stateKey: STORAGE_KEYS.persistedState });
  expect(storageEvidence.stores.sort()).toEqual(["backups", "questionAttachmentBlobs", "state"]);
  expect(storageEvidence.workspaceInLocalStorage).toBeNull();
  expect(storageEvidence.scopedWorkspaceInLocalStorage).toBe(false);
  expect(browserErrors).toEqual([]);
});

async function completeOnboarding(page: Page): Promise<void> {
  await page.getByLabel("Display name (optional)").fill("AXOM E2E");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Finish setup", exact: true }).click();
  const reviewLater = page.getByRole("button", { name: "Review later" });
  if (await reviewLater.count()) await reviewLater.click();
}

async function readPersistedWorkspace(page: Page) {
  return page.evaluate(async ({ dbName, stateKey }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const raw = await new Promise<string>((resolve, reject) => {
      const request = db.transaction("state", "readonly").objectStore("state").get(stateKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return JSON.parse(raw).state;
  }, { dbName: STORAGE_KEYS.vaultDb, stateKey: STORAGE_KEYS.persistedState });
}
