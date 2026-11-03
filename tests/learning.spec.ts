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

test("pencil shows finished handwriting with reduced motion and follows the mouse", async ({
  page,
  isMobile,
}) => {
  const widget = page.locator(".pencil-widget");
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-phase", "complete");
  await expect(widget).toHaveAttribute("data-animation", "paused");
  await expect(page.getByRole("img", { name: /^3D молив/ })).toBeVisible();
  await expect(page.locator(".pencil-label strong")).toHaveText(
    "А като автобус",
  );
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await expect(page.locator(".pencil-fallback")).toHaveCount(0);
  if (!isMobile) {
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + 40);
    const before = await canvas.screenshot();
    await page.mouse.move(box.x + box.width - 40, box.y + box.height - 40, {
      steps: 8,
    });
    const after = await canvas.screenshot();
    expect(after.equals(before)).toBe(false);
    await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(after)).toBe(true);
  }
});

test("pencil writes a letter, draws a picture and changes lessons without clicks", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const widget = page.locator(".pencil-widget");
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-animation", "playing");
  await expect(widget).toHaveAttribute("data-phase", "writing");
  const early = await page.locator("canvas").screenshot();
  await expect(widget).toHaveAttribute("data-phase", "picture", {
    timeout: 10000,
  });
  expect((await page.locator("canvas").screenshot()).equals(early)).toBe(false);
  await expect(widget).toHaveAttribute("data-phase", "complete", {
    timeout: 8000,
  });
  await expect(widget).toHaveAttribute("data-lesson", "Б", { timeout: 8000 });
  await expect(page.locator(".pencil-label strong")).toHaveText("Б като балон");
  await expect(widget).toHaveAttribute("data-phase", "picture", {
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Спри рисуването" }).click();
  await expect(widget).toHaveAttribute("data-animation", "paused");
  await page.waitForTimeout(300);
  const paused = await page.locator("canvas").screenshot();
  await page.waitForTimeout(4200);
  expect((await page.locator("canvas").screenshot()).equals(paused)).toBe(true);
  await page.getByRole("button", { name: "Продължи рисуването" }).click();
  await expect(widget).toHaveAttribute("data-phase", "complete", {
    timeout: 12000,
  });
  await expect(widget).toHaveAttribute("data-lesson", "А", { timeout: 8000 });
});

test("pencil keeps a readable SVG alternative when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (
        kind === "webgl2" ||
        kind === "webgl" ||
        kind === "experimental-webgl"
      )
        return null;
      return original.apply(this, [kind, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.reload();
  await expect(page.locator(".pencil-widget")).toHaveAttribute(
    "data-renderer",
    "svg",
  );
  await expect(page.locator(".pencil-fallback")).toBeVisible();
  await expect(page.locator(".pencil-fallback")).toContainText(
    "А като автобус",
  );
  await expect(page.locator(".pencil-fallback")).toContainText("Аа");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("pencil stops offscreen and allows vertical mobile scrolling", async ({
  page,
  context,
  isMobile,
}) => {
  const widget = page.locator(".pencil-widget");
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-phase", "complete");
  if (isMobile) {
    const box = (await page.locator("canvas").boundingBox())!;
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const before = await page.evaluate(() => scrollY);
    const cdp = await context.newCDPSession(page);
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
      .toBeGreaterThan(before);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-animation", "playing");
  await page.locator("#parents").scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-animation", "paused");
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
