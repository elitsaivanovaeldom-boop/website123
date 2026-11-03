"use client";

import { useRef, useState } from "react";

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
    description: "Откриваме звуци, познаваме букви и четем първите си думи.",
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
const questions = {
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

export default function LearningGame({
  subject,
  onSubjectChange,
}: {
  subject: Subject;
  onSubjectChange: (subject: Subject) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const current = subjects.find((item) => item.id === subject)!;
  const question = questions[subject][index];
  const correct = selected === question.correct;
  const progress = finished ? 4 : index + (correct ? 1 : 0);

  function chooseSubject(next: Subject) {
    onSubjectChange(next);
    setIndex(0);
    setSelected(null);
    setFinished(false);
  }
  function nextQuestion() {
    if (index === questions[subject].length - 1) setFinished(true);
    else setIndex((value) => value + 1);
    setSelected(null);
    requestAnimationFrame(() => questionHeading.current?.focus());
  }

  return (
    <div className="game-shell">
      <div
        className="subject-picker"
        role="group"
        aria-label="Избери какво да упражняваш"
      >
        {subjects.map((item) => (
          <button
            key={item.id}
            className={`subject-tab ${subject === item.id ? "is-active" : ""}`}
            aria-pressed={subject === item.id}
            onClick={() => chooseSubject(item.id)}
          >
            <span aria-hidden="true">{item.symbol}</span>
            {item.title}
          </button>
        ))}
      </div>
      <div className={`exercise ${current.color}`}>
        <div className="exercise-top">
          <span>МАЛКА СТЪПКА, ГОЛЯМО БРАВО</span>
          <span>{progress} / 4</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Завършени задачи"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress * 25}%` }} />
        </div>
        {finished ? (
          <div className="completion">
            <span className="completion-flower" aria-hidden="true">
              ✿
            </span>
            <h3 ref={questionHeading} tabIndex={-1}>
              Четири малки победи!
            </h3>
            <p>
              Браво за любопитството и старанието. Почини си или избери друга
              игра.
            </p>
            <button
              className="button button-primary"
              onClick={() => chooseSubject(subject)}
            >
              Да опитаме пак ↻
            </button>
          </div>
        ) : (
          <>
            <div className="question-visual">{question.visual}</div>
            <h3 ref={questionHeading} tabIndex={-1}>
              {question.prompt}
            </h3>
            <p className="exercise-instruction">
              Избери своя отговор. Тук можеш спокойно да опитваш.
            </p>
            <div
              className="answers"
              role="group"
              aria-label="Възможни отговори"
            >
              {question.choices.map((choice, answer) => (
                <button
                  key={choice}
                  disabled={correct}
                  aria-pressed={selected === answer}
                  className={`answer ${selected === answer ? (correct ? "answer-correct" : "answer-retry") : ""}`}
                  onClick={() => setSelected(answer)}
                >
                  {choice}
                  {selected === answer && (
                    <span aria-hidden="true">{correct ? " ✓" : " ↻"}</span>
                  )}
                </button>
              ))}
            </div>
            <div
              className={`feedback ${correct ? "feedback-correct" : ""}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {selected === null
                ? "Всяко откритие започва с един опит."
                : correct
                  ? question.explanation
                  : `Опитай отново. ${question.hint}`}
            </div>
            {correct && (
              <button
                className="button button-primary next-question"
                onClick={nextQuestion}
              >
                {index === 3 ? "Виж как се справи" : "Следващо откритие"}{" "}
                <span aria-hidden="true">→</span>
              </button>
            )}
          </>
        )}
      </div>
      <p className="game-note">
        Без оценки и без бързане. Напредъкът е само за тази игра.
      </p>
    </div>
  );
}
