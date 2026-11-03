import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // The learning games and procedural model must work without a third-party CDN.
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://127.0.0.1:3100")
      ? route.continue()
      : route.abort(),
  );
  await page.goto("/");
});

test("all three subjects support retry, completion and restarting", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("link", { name: "Да опитаме заедно" }).click();
  for (const [title, answers] of [
    ["Букви и думи", [1, 0, 1, 2]],
    ["Числа и смятане", [1, 0, 2, 1]],
    ["Светът около нас", [1, 0, 1, 2]],
  ] as const) {
    await page.getByRole("button", { name: title, exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    await page.locator(".answer").nth(0).click();
    await expect(page.getByRole("status")).toContainText("Опитай отново");
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    for (const [index, answer] of answers.entries()) {
      await page.locator(".answer").nth(answer).click();
      await expect(page.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        String(index + 1),
      );
      await expect(page.locator(".answer").first()).toBeDisabled();
      await page
        .getByRole("button", {
          name: index === 3 ? "Виж как се справи" : "Следващо откритие",
        })
        .click();
    }
    await expect(
      page.getByRole("heading", { name: "Четири малки победи!" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Да опитаме пак" }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    await expect(page.locator(".answer").first()).toBeEnabled();
  }
  expect(errors).toEqual([]);
});

test("subject cards select the corresponding game and reset progress on subject change", async ({
  page,
}) => {
  await page
    .locator(".subject-card")
    .filter({ hasText: "Числа и смятане" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Колко са зелените топчета?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await page
    .getByRole("button", { name: "Светът около нас", exact: true })
    .click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(
    page.getByRole("heading", { name: "През кой сезон най-често вали сняг?" }),
  ).toBeVisible();
});

test("keyboard users can skip to exercises and answer a question", async ({
  page,
}) => {
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Към упражненията" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  const answer = page.getByRole("button", { name: "М", exact: true });
  await answer.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Следващо откритие" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Коя дума получаваме?" }),
  ).toBeFocused();
});

test("fine-line planet renders, respects reduced motion and supports drag", async ({
  page,
  context,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.waitForLoadState("networkidle");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const still = await canvas.screenshot();
  await page.waitForTimeout(500);
  expect((await canvas.screenshot()).equals(still)).toBe(true);
  const box = (await canvas.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (isMobile) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    for (let step = 1; step <= 6; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: point.x + step * 10, y: point.y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    // Reduced motion stops idle animation, so only mouse movement can change this image.
    await page.mouse.move(point.x - 70, point.y - 20);
    await page.waitForTimeout(200);
    const beforeHover = await canvas.screenshot();
    await page.mouse.move(point.x + 70, point.y + 20, { steps: 8 });
    await page.waitForTimeout(200);
    const afterHover = await canvas.screenshot();
    expect(afterHover.equals(beforeHover)).toBe(false);
    await page.waitForTimeout(400);
    expect((await canvas.screenshot()).equals(afterHover)).toBe(true);
    await page.mouse.move(point.x, point.y);
    const beforeDrag = await canvas.screenshot();
    await page.mouse.down();
    await page.mouse.move(point.x + 90, point.y + 20, { steps: 8 });
    await page.mouse.up();
    expect((await canvas.screenshot()).equals(beforeDrag)).toBe(false);
  }
  await page.waitForTimeout(900);
  expect((await canvas.screenshot()).equals(still)).toBe(false);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const animated = await canvas.screenshot();
  await page.waitForTimeout(500);
  expect((await canvas.screenshot()).equals(animated)).toBe(false);
  expect(errors).toEqual([]);
});

test("layout fits small phones, tablets and desktop screens", async ({
  page,
}) => {
  await expect(page).toHaveTitle("Малки стъпки - Големи открития за 1. клас");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
  }
});
