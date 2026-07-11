import { expect, test } from "@playwright/test";
import { STORAGE_KEYS } from "../src/lib/brand";

test("pre-paint theme resolution persists light/dark/system without touching workspace storage", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEYS.themePreference);
  await page.reload({ waitUntil: "domcontentloaded" });

  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-theme-preference", "system");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0d0d0e");

  await page.evaluate((key) => localStorage.setItem(key, "light"), STORAGE_KEYS.themePreference);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(root).toHaveAttribute("data-theme-preference", "light");
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#f3eee3");

  const storage = await page.evaluate(({ themeKey, workspaceKey }) => ({
    theme: localStorage.getItem(themeKey),
    workspace: localStorage.getItem(workspaceKey),
    scopedWorkspace: Object.keys(localStorage).some((key) => key.startsWith(`${workspaceKey}:user:`)),
  }), { themeKey: STORAGE_KEYS.themePreference, workspaceKey: STORAGE_KEYS.persistedState });
  expect(storage).toEqual({ theme: "light", workspace: null, scopedWorkspace: false });

  await page.evaluate((key) => localStorage.setItem(key, "sepia"), STORAGE_KEYS.themePreference);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(root).toHaveAttribute("data-theme-preference", "system");
  await expect(root).toHaveAttribute("data-theme", "dark");
});
