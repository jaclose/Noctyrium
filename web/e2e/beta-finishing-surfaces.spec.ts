import { expect, test, type Page } from "@playwright/test";

test("Application Checker consumes sourced records and remains usable on mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/application-schools.json", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: 1,
      generatedAt: "2026-08-09T12:00:00Z",
      schools: [{
        id: "synthetic-med",
        name: "Synthetic School of Medicine",
        location: "Test City",
        degree: "MD",
        applicationPlatform: "Unknown",
        verificationStatus: "verified",
        sources: [{ url: "https://example.edu/admissions", retrievedAt: "2026-08-08T12:00:00Z" }],
      }],
    }),
  }));
  await page.goto("/", { waitUntil: "networkidle" });
  await onboard(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { window.location.hash = "appchecker"; });
  await expect(page.getByText("Synthetic School of Medicine")).toBeVisible();
  await expect(page.getByRole("article").getByText("Verified", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Source" })).toHaveAttribute("href", "https://example.edu/admissions");
  await page.getByPlaceholder(/Search school/).fill("no match");
  await expect(page.getByText("No matching schools")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test("install affordance appears only after browser support and is single use", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await onboard(page);
  await page.evaluate(() => { window.location.hash = "about"; });
  await expect(page.getByRole("button", { name: "Install AXOM" })).toHaveCount(0);
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted"; platform: string }>;
    };
    event.prompt = async () => undefined;
    event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "Install AXOM" }).click();
  await expect(page.getByRole("button", { name: "Install AXOM" })).toHaveCount(0);
});

async function onboard(page: Page) {
  const name = page.getByLabel("Display name (optional)");
  if (!(await name.isVisible().catch(() => false))) return;
  await name.fill("Beta Finishing Test");
  for (let step = 0; step < 3; step += 1) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Finish setup", exact: true }).click();
  const later = page.getByRole("button", { name: "Review later" });
  if (await later.count()) await later.click();
}
