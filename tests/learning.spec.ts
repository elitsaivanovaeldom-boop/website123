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
    await expect(page.locator(".exercise").getByRole("status")).toContainText(
      "Опитай отново",
    );
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

test("sound models teach vowel/consonant patterns and restart in the same mode", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Звукови модели", exact: true })
    .click();
  await expect(page.getByText("гласен звук", { exact: true })).toBeVisible();
  await expect(page.getByText("съгласен звук", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Модел 1:/ }).click();
  await expect(page.locator(".exercise").getByRole("status")).toContainText(
    "Опитай отново",
  );
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  for (const [index, [word, model, vowels, consonants]] of (
    [
      ["МАК", 2, 1, 2],
      ["МАМА", 1, 2, 2],
      ["РИБА", 2, 2, 2],
      ["ЛИМОН", 3, 2, 3],
    ] as const
  ).entries()) {
    await expect(page.locator(".question-visual")).toHaveText(word);
    await page
      .getByRole("button", { name: new RegExp(`^Модел ${model}:`) })
      .click();
    await expect(page.locator(".sound-breakdown .vowel")).toHaveCount(vowels);
    await expect(page.locator(".sound-breakdown .consonant")).toHaveCount(
      consonants,
    );
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(index + 1),
    );
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
  await expect(
    page.getByRole("button", { name: "Звукови модели", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".question-visual")).toHaveText("МАК");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
});

test("syllables count one to four parts and mode changes reset feedback", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Срички", exact: true }).click();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.locator(".exercise").getByRole("status")).toContainText(
    "Опитай отново",
  );
  await expect(page.locator(".syllable-breakdown")).toHaveCount(0);
  for (const [index, [answer, syllables]] of (
    [
      ["1", ["МАК"]],
      ["2", ["МА", "МА"]],
      ["3", ["МА", "ЛИ", "НА"]],
      ["4", ["ПЕ", "ПЕ", "РУ", "ДА"]],
    ] as const
  ).entries()) {
    await page.getByRole("button", { name: answer, exact: true }).click();
    await expect(page.locator(".syllable-breakdown > span")).toHaveCount(
      syllables.length,
    );
    for (const [position, syllable] of syllables.entries())
      await expect(
        page.locator(".syllable-breakdown > span").nth(position),
      ).toContainText(syllable);
    await page
      .getByRole("button", {
        name: index === 3 ? "Виж как се справи" : "Следващо откритие",
      })
      .click();
  }
  await page.getByRole("button", { name: "Да опитаме пак" }).click();
  await expect(
    page.getByRole("button", { name: "Срички", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Звукови модели", exact: true })
    .click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(page.locator(".exercise").getByRole("status")).not.toContainText(
    "Опитай отново",
  );
  await page
    .getByRole("button", { name: "Числа и смятане", exact: true })
    .click();
  await expect(page.locator(".literacy-picker")).toHaveCount(0);
  await page.getByRole("button", { name: "Букви и думи", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Букви", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("alphabet book responds to mouse movement and mobile page swipes", async ({
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
  await page.waitForTimeout(900);
  const still = await canvas.screenshot();
  await page.waitForTimeout(300);
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
        touchPoints: [{ x: point.x - step * 12, y: point.y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(page.locator(".book-page-label strong")).toHaveText("Вв · Гг");
    const beforeScroll = await page.evaluate(() => scrollY);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    for (let step = 1; step <= 8; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: point.x, y: point.y - step * 15 }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(beforeScroll);
    await expect(page.locator(".book-page-label strong")).toHaveText("Вв · Гг");
  } else {
    await page.mouse.move(point.x - 70, point.y - 20);
    const before = await canvas.screenshot();
    await page.mouse.move(point.x + 70, point.y + 20, { steps: 8 });
    const after = await canvas.screenshot();
    expect(after.equals(before)).toBe(false);
    await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(after)).toBe(true);
    await page.getByRole("button", { name: "Следващи букви" }).click();
  }
  await expect(page.locator(".book-page-label strong")).toHaveText("Вв · Гг");
  expect((await canvas.screenshot()).equals(still)).toBe(false);
  expect(errors).toEqual([]);
});

test("book covers all Bulgarian letters, respects boundaries and supports keyboard", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Предишни букви" }),
  ).toBeDisabled();
  for (let spread = 2; spread <= 15; spread++) {
    await page.getByRole("button", { name: "Следващи букви" }).click();
    await expect(page.locator(".book-page-label span")).toHaveText(
      `${spread} / 15`,
    );
  }
  await expect(page.locator(".book-page-label strong")).toHaveText("Юю · Яя");
  await expect(
    page.getByRole("button", { name: "Следващи букви" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Предишни букви" }).click();
  await expect(page.locator(".book-page-label strong")).toHaveText("Ъъ · Ьь");
  await expect(
    page.getByRole("img", { name: /Отворена книга/ }),
  ).toHaveAttribute("aria-label", /знак за мекост/);
  await page.locator(".book-widget").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".book-page-label strong")).toHaveText("Шш · Щщ");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".book-page-label strong")).toHaveText("Ъъ · Ьь");
});

test("animated book page turns finish and previous page returns to the original spread", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForLoadState("networkidle");
  const book = page.locator(".book-canvas");
  await expect(page.locator("canvas")).toBeVisible();
  const bounds = (await book.boundingBox())!;
  await book.click({
    position: { x: bounds.width * 0.75, y: bounds.height / 2 },
  });
  await expect(page.locator(".book-page-label strong")).toHaveText("Вв · Гг");
  await expect(
    page.getByRole("button", { name: "Следващи букви" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Предишни букви" }).click();
  await expect(page.locator(".book-page-label strong")).toHaveText("Аа · Бб");
  await expect(
    page.getByRole("button", { name: "Предишни букви" }),
  ).toBeDisabled();
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
