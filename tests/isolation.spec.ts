import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/demo/index.html");
});

test("scripts execute inside the shit but cannot touch the parent", async ({ page }) => {
  await page.click("#poop-evil");
  const frame = page.frameLocator("litter-box iframe").first();
  // proof the inner script ran
  await expect(frame.locator("body")).toHaveAttribute("data-ran", "1");
  // proof the parent was NOT mutated
  await expect(page.locator("body")).not.toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("inner styles do not leak out to the host page", async ({ page }) => {
  await page.click("#poop");
  const hostBg = await page
    .locator("h1")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(hostBg).toBe("rgba(0, 0, 0, 0)");
});

test("scoop removes the iframe", async ({ page }) => {
  await page.click("#poop");
  await expect(page.locator("litter-box iframe")).toHaveCount(1);
  await page.click("litter-box .scoop");
  await expect(page.locator("litter-box iframe")).toHaveCount(0);
});

test("caps at 4 shits", async ({ page }) => {
  page.on("dialog", (d) => d.dismiss()); // dismiss the 'box full' alert
  for (let i = 0; i < 5; i++) await page.click("#poop");
  await expect(page.locator("litter-box iframe")).toHaveCount(4);
});
