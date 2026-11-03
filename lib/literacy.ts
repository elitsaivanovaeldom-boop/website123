export type LiteracyMode = "letters" | "sounds" | "syllables";

export interface Question {
  visual: string;
  prompt: string;
  choices: string[];
  correct: number;
  hint: string;
  explanation: string;
  kind?: "sound-model" | "syllables";
  syllables?: string[];
}

// These words have a straightforward one-letter/one-sound correspondence.
// Models describe sounds, not an automatic classification of Bulgarian spelling.
export const literacyQuestions: Record<"sounds" | "syllables", Question[]> = {
  sounds: [
    {
      kind: "sound-model",
      visual: "МАК",
      prompt: "Кой е звуковият модел на думата МАК?",
      choices: ["ГСС", "СГС", "ССГ"],
      correct: 1,
      hint: "Кажи М-А-К. М и К са съгласни, а А е гласен звук.",
      explanation:
        "МАК има 3 звука: съгласен, гласен, съгласен. Чудесно откритие!",
    },
    {
      kind: "sound-model",
      visual: "МАМА",
      prompt: "Кой модел показва звуковете в МАМА?",
      choices: ["СГСГ", "ГСГС", "ССГГ"],
      correct: 0,
      hint: "В М-А-М-А съгласният М се редува с гласния А.",
      explanation: "М-А-М-А: два съгласни и два гласни звука се редуват.",
    },
    {
      kind: "sound-model",
      visual: "РИБА",
      prompt: "Избери звуковия модел на думата РИБА.",
      choices: ["ССГГ", "СГСГ", "ГСГС"],
      correct: 1,
      hint: "Изговори Р-И-Б-А. И и А са гласни звукове.",
      explanation:
        "Р и Б са съгласни, И и А са гласни. Всяко квадратче е един звук.",
    },
    {
      kind: "sound-model",
      visual: "ЛИМОН",
      prompt: "Кой е звуковият модел на думата ЛИМОН?",
      choices: ["ГСГСС", "ССГСГ", "СГСГС"],
      correct: 2,
      hint: "Кажи Л-И-М-О-Н. Гласните звукове И и О са на второ и четвърто място.",
      explanation: "ЛИМОН има 5 звука: С-Г-С-Г-С. Браво за старанието!",
    },
  ],
  syllables: [
    {
      kind: "syllables",
      visual: "МАК",
      prompt: "Колко срички има в думата МАК?",
      choices: ["1", "2", "3"],
      correct: 0,
      hint: "МАК се казва наведнъж. Чуваш само един гласен звук - А.",
      explanation: "МАК има 1 сричка и 1 гласен звук. Едно пляскане!",
      syllables: ["МАК"],
    },
    {
      kind: "syllables",
      visual: "МАМА",
      prompt: "Колко срички има в думата МАМА?",
      choices: ["1", "2", "3"],
      correct: 1,
      hint: "Кажи МА-МА и плясни при всяка част. Колко пляскания направи?",
      explanation: "МА-МА: 2 срички, 2 гласни звука, 2 пляскания!",
      syllables: ["МА", "МА"],
    },
    {
      kind: "syllables",
      visual: "МАЛИНА",
      prompt: "На колко срички разделяме МАЛИНА?",
      choices: ["2", "3", "4"],
      correct: 1,
      hint: "Кажи бавно МА-ЛИ-НА. Пляскай с ръце при всяка сричка.",
      explanation: "МА-ЛИ-НА има 3 срички. Във всяка има по един гласен звук.",
      syllables: ["МА", "ЛИ", "НА"],
    },
    {
      kind: "syllables",
      visual: "ПЕПЕРУДА",
      prompt: "Колко срички има в думата ПЕПЕРУДА?",
      choices: ["2", "3", "4"],
      correct: 2,
      hint: "Раздели думата: ПЕ-ПЕ-РУ-ДА. Отброи всяка част с пляскане.",
      explanation:
        "ПЕ-ПЕ-РУ-ДА: 4 срички и 4 гласни звука. Четири малки пляскания!",
      syllables: ["ПЕ", "ПЕ", "РУ", "ДА"],
    },
  ],
};

export function describeSoundModel(pattern: string) {
  return [...pattern]
    .map((sound) => (sound === "Г" ? "гласен" : "съгласен"))
    .join(", ");
}
