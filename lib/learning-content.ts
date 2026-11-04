import type { Question } from "./literacy";
import { moreExamples } from "./more-examples";

export type Subject = "letters" | "numbers" | "world";
export const subjects: {
  id: Subject;
  symbol: string;
  title: string;
  description: string;
  color: string;
}[] = [
  {
    id: "letters",
    symbol: "Аа",
    title: "Букви и думи",
    description:
      "Познаваме букви, правим звукови модели и броим сричките в думите.",
    color: "lavender",
  },
  {
    id: "numbers",
    symbol: "123",
    title: "Числа и смятане",
    description: "Броим, сравняваме и превръщаме малките задачи в голяма игра.",
    color: "mint",
  },
  {
    id: "world",
    symbol: "☀",
    title: "Светът около нас",
    description: "Опознаваме сезоните, природата и добрите навици всеки ден.",
    color: "peach",
  },
];
const baseQuestions: Record<Subject, Question[]> = {
  letters: [
    {
      visual: "МАЛИНА",
      prompt: "С коя буква започва думата МАЛИНА?",
      choices: ["А", "М", "Л"],
      correct: 1,
      hint: "Кажи думата бавно: М-м-малина. Кой звук чуваш първо?",
      explanation: "М като малина! Ти откри първата буква.",
    },
    {
      visual: "МА + МА",
      prompt: "Коя дума получаваме?",
      choices: ["МАМА", "МЕЧЕ", "МОРЕ"],
      correct: 0,
      hint: "Събери двете срички: МА и МА.",
      explanation: "МА и МА правят МАМА. Прочете цяла дума!",
    },
    {
      visual: "КОТКА",
      prompt: "Колко букви има в думата КОТКА?",
      choices: ["4", "5", "6"],
      correct: 1,
      hint: "Посочи всяка буква: К, О, Т, К, А.",
      explanation: "Пет букви! Всяка от тях има своето място.",
    },
    {
      visual: "С _ Н",
      prompt: "Коя буква липсва в думата СЪН?",
      choices: ["О", "А", "Ъ"],
      correct: 2,
      hint: "Изговори СЪН. Какъв звук чуваш между С и Н?",
      explanation: "Точно така: С, Ъ, Н. Браво за старанието!",
    },
  ],
  numbers: [
    {
      visual: "● ● ●",
      prompt: "Колко са зелените топчета?",
      choices: ["2", "3", "4"],
      correct: 1,
      hint: "Посочи топчетата едно по едно: едно, две…",
      explanation: "Три топчета. Преброи ги чудесно!",
    },
    {
      visual: "2 + 1 = ?",
      prompt: "Две моливчета и още едно. Колко са общо?",
      choices: ["3", "2", "4"],
      correct: 0,
      hint: "Покажи два пръста, после добави още един.",
      explanation: "2 + 1 = 3. Всяка малка стъпка е напредък!",
    },
    {
      visual: "5 − 2 = ?",
      prompt: "Имаш 5 ябълки. Подаряваш 2. Колко остават?",
      choices: ["2", "4", "3"],
      correct: 2,
      hint: "От пет пръста свий два. Колко остават?",
      explanation: "Остават 3 ябълки. Справи се с изваждането!",
    },
    {
      visual: "4  ·  7  ·  2",
      prompt: "Кое число е най-голямо?",
      choices: ["4", "7", "2"],
      correct: 1,
      hint: "Когато броиш от 1 нагоре, кое от тези числа казваш последно?",
      explanation: "7 е по-голямо от 4 и от 2. Отлично сравняване!",
    },
  ],
  world: [
    {
      visual: "❄",
      prompt: "През кой сезон най-често вали сняг?",
      choices: ["Лято", "Зима", "Есен"],
      correct: 1,
      hint: "Кога обличаме дебело яке, шапка и ръкавици?",
      explanation: "През зимата! Тогава можем да направим снежен човек.",
    },
    {
      visual: "♧",
      prompt: "От какво се нуждае растението, за да расте?",
      choices: ["Вода и светлина", "Бонбони", "Играчки"],
      correct: 0,
      hint: "Помисли с какво поливаме цветята и какво им дава слънцето.",
      explanation: "Водата и светлината помагат на растенията да растат.",
    },
    {
      visual: "☀",
      prompt: "Какво е добре да направим преди хранене?",
      choices: [
        "Да скрием чинията",
        "Да си измием ръцете",
        "Да си обуем ботушите",
      ],
      correct: 1,
      hint: "Кое действие прави ръцете ни чисти?",
      explanation: "Чистите ръце са добър навик. Браво!",
    },
    {
      visual: "♡",
      prompt: "Приятел се затруднява със задача. Как да помогнеш?",
      choices: [
        "Да му се присмея",
        "Да му взема тетрадката",
        "Да я обсъдим заедно",
      ],
      correct: 2,
      hint: "Кой отговор би те накарал да се почувстваш подкрепен?",
      explanation: "Заедно е по-лесно. Добротата също се учи!",
    },
  ],
};

export const questions: Record<Subject, Question[]> = {
  letters: [...baseQuestions.letters, ...moreExamples.letters],
  numbers: [...baseQuestions.numbers, ...moreExamples.numbers],
  world: [...baseQuestions.world, ...moreExamples.world],
};
