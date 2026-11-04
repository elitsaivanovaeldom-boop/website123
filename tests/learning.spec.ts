import { expect, test } from "@playwright/test";
import { globeLabels, globePoint } from "../lib/earth-globe";
import { questions } from "../lib/learning-content";
import { literacyQuestions } from "../lib/literacy";

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
    ["Букви и думи", [1, 0, 1, 2, 0, 1, 2, 1, 0, 2, 2, 0]],
    ["Числа и смятане", [1, 0, 2, 1, 1, 2, 0, 2, 1, 0, 2, 0]],
    ["Светът около нас", [1, 0, 1, 2, 1, 2, 0, 2, 1, 0, 2, 0]],
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
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(page.viewportSize()!.width);
      await page.locator(".answer").nth(answer).click();
      await expect(page.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        String(index + 1),
      );
      await expect(page.locator(".answer").first()).toBeDisabled();
      await page
        .getByRole("button", {
          name: index === 11 ? "Виж как се справи" : "Следващо откритие",
        })
        .click();
    }
    await expect(
      page.getByRole("heading", { name: "Браво! 12 малки победи!" }),
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
      ["СОМ", 1, 1, 2],
      ["ОКО", 3, 2, 1],
      ["СТОЛ", 2, 1, 3],
      ["КОТКА", 1, 2, 3],
      ["ИГЛА", 3, 2, 2],
      ["КОЛЕЛО", 2, 3, 3],
      ["КРАК", 1, 1, 3],
      ["ТРЕВА", 3, 2, 3],
    ] as const
  ).entries()) {
    await expect(page.locator(".question-visual")).toHaveText(word);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(page.viewportSize()!.width);
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
        name: index === 11 ? "Виж как се справи" : "Следващо откритие",
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Браво! 12 малки победи!" }),
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
      ["1", ["КОН"]],
      ["2", ["РИ", "БА"]],
      ["3", ["КО", "ЛЕ", "ЛО"]],
      ["2", ["БА", "НАН"]],
      ["3", ["РА", "КЕ", "ТА"]],
      ["2", ["МО", "РЕ"]],
      ["3", ["СА", "МО", "ЛЕТ"]],
      ["4", ["ТЕ", "МЕ", "НУ", "ГА"]],
    ] as const
  ).entries()) {
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(page.viewportSize()!.width);
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
        name: index === 11 ? "Виж как се справи" : "Следващо откритие",
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

test("all 60 examples have valid answers, sound models and syllable divisions", () => {
  const banks = [
    ...Object.values(questions),
    ...Object.values(literacyQuestions),
  ];
  expect(banks.map((bank) => bank.length)).toEqual([12, 12, 12, 12, 12]);
  for (const bank of banks) {
    expect(new Set(bank.map((question) => question.prompt)).size).toBe(
      bank.length,
    );
    for (const question of bank) {
      expect(question.choices).toHaveLength(3);
      expect(new Set(question.choices).size).toBe(3);
      expect(question.correct).toBeGreaterThanOrEqual(0);
      expect(question.correct).toBeLessThan(3);
      expect(question.hint.length).toBeGreaterThan(10);
      expect(question.explanation.length).toBeGreaterThan(10);
    }
  }
  for (const question of literacyQuestions.sounds) {
    expect(question.visual).not.toMatch(/[ЩЬЮЯ]/);
    const model = [...question.visual]
      .map((letter) => (/[АЪОУЕИ]/.test(letter) ? "Г" : "С"))
      .join("");
    expect(question.choices[question.correct]).toBe(model);
    for (const choice of question.choices)
      expect(choice).toMatch(new RegExp(`^[ГС]{${question.visual.length}}$`));
  }
  for (const question of literacyQuestions.syllables) {
    expect(question.syllables!.join("")).toBe(question.visual);
    expect(question.choices[question.correct]).toBe(
      String(question.syllables!.length),
    );
    for (const syllable of question.syllables!)
      expect(syllable.match(/[АЪОУЕИ]/g)).toHaveLength(1);
  }
  for (const question of questions.numbers) {
    const equation = question.visual.match(/^(\d+) ([+−-]) (\d+) = \?$/);
    if (!equation) continue;
    const result =
      equation[2] === "+"
        ? Number(equation[1]) + Number(equation[3])
        : Number(equation[1]) - Number(equation[3]);
    expect(question.choices[question.correct]).toBe(String(result));
  }
});

test("Earth globe separates numbers and Bulgarian letters at the equator", async ({
  page,
}) => {
  const numbers = globeLabels.filter((label) => label.hemisphere === "north");
  const letters = globeLabels.filter((label) => label.hemisphere === "south");
  expect(
    numbers
      .map((label) => label.text)
      .sort()
      .join(""),
  ).toBe("0123456789");
  expect(
    letters
      .map((label) => label.text)
      .sort()
      .join(""),
  ).toBe("АБВГДЕЖЗИЙ");
  for (const label of numbers)
    expect(globePoint(label.longitude, label.latitude)[1]).toBeGreaterThan(0);
  for (const label of letters)
    expect(globePoint(label.longitude, label.latitude)[1]).toBeLessThan(0);
  await expect(
    page.getByRole("img", { name: /Земно кълбо с фини меридиани/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Числа над екватора", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Букви под екватора", { exact: false }),
  ).toBeVisible();
});

test("figure follows mouse movement without clicking and remains still with reduced motion", async ({
  page,
  isMobile,
}) => {
  const widget = page.locator(".figure-widget");
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-renderer", "3d");
  await expect(widget).toHaveAttribute("data-animation", "paused");
  await page.waitForLoadState("networkidle");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
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

test("figure rotates with mouse drag and touch while preserving mobile scrolling", async ({
  page,
  context,
  isMobile,
}) => {
  const widget = page.locator(".figure-widget");
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-renderer", "3d");
  await page.waitForLoadState("networkidle");
  const canvas = page.locator("canvas");
  const box = (await canvas.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (isMobile) {
    const before = await canvas.screenshot();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    for (let step = 1; step <= 8; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: point.x + step * 10, y: point.y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    const scrollBefore = await page.evaluate(() => scrollY);
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
      .toBeGreaterThan(scrollBefore);
  } else {
    await page.mouse.move(point.x, point.y);
    const before = await canvas.screenshot();
    await page.mouse.down();
    await page.mouse.move(point.x + 90, point.y + 20, { steps: 8 });
    await page.mouse.up();
    expect((await canvas.screenshot()).equals(before)).toBe(false);
  }
});

test("figure supports keyboard rotation and resetting to its initial pose", async ({
  page,
}) => {
  const widget = page.locator(".figure-widget");
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-renderer", "3d");
  await page.waitForLoadState("networkidle");
  await widget.focus();
  await page.keyboard.press("Home");
  const original = await page.locator("canvas").screenshot();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  expect((await page.locator("canvas").screenshot()).equals(original)).toBe(
    false,
  );
  await page.keyboard.press("Home");
  expect((await page.locator("canvas").screenshot()).equals(original)).toBe(
    true,
  );
});

test("automatic figure movement can pause and stops offscreen", async ({
  page,
}) => {
  const widget = page.locator(".figure-widget");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-animation", "playing");
  const before = await page.locator("canvas").screenshot();
  await page.waitForTimeout(600);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(
    false,
  );
  await page.getByRole("button", { name: "Спри движението" }).click();
  await expect(widget).toHaveAttribute("data-animation", "paused");
  await page.waitForTimeout(300);
  const paused = await page.locator("canvas").screenshot();
  await page.waitForTimeout(600);
  expect((await page.locator("canvas").screenshot()).equals(paused)).toBe(true);
  await page.getByRole("button", { name: "Продължи движението" }).click();
  await expect(widget).toHaveAttribute("data-animation", "playing");
  await page.locator("#parents").scrollIntoViewIfNeeded();
  await expect(widget).toHaveAttribute("data-animation", "paused");
});

test("SVG figure remains interactive when WebGL is unavailable", async ({
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
  const widget = page.locator(".figure-widget");
  await expect(widget).toHaveAttribute("data-renderer", "svg");
  await expect(page.locator(".figure-fallback")).toBeVisible();
  await widget.focus();
  const before = await page.locator(".figure-fallback").screenshot();
  await page.keyboard.press("ArrowRight");
  expect(
    (await page.locator(".figure-fallback").screenshot()).equals(before),
  ).toBe(false);
  await expect(page.locator("canvas")).toHaveCount(0);
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
