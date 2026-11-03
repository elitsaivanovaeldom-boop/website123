"use client";

import { useRef, useState } from "react";
import {
  literacyQuestions,
  describeSoundModel,
  type LiteracyMode,
} from "@/lib/literacy";

import { questions, subjects, type Subject } from "@/lib/learning-content";
export { subjects, type Subject } from "@/lib/learning-content";

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
  const [mode, setMode] = useState<LiteracyMode>("letters");
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const current = subjects.find((item) => item.id === subject)!;
  const activeQuestions =
    subject === "letters" && mode !== "letters"
      ? literacyQuestions[mode]
      : questions[subject];
  const total = activeQuestions.length;
  const question = activeQuestions[index];
  const correct = selected === question.correct;
  const progress = finished ? total : index + (correct ? 1 : 0);

  function chooseSubject(next: Subject) {
    onSubjectChange(next);
    setIndex(0);
    setSelected(null);
    setFinished(false);
    setMode("letters");
  }
  function chooseMode(next: LiteracyMode) {
    setMode(next);
    setIndex(0);
    setSelected(null);
    setFinished(false);
  }
  function nextQuestion() {
    if (index === total - 1) setFinished(true);
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
      {subject === "letters" && (
        <div
          className="literacy-picker"
          role="group"
          aria-label="Упражнения по български език"
        >
          {(
            [
              ["letters", "Букви"],
              ["sounds", "Звукови модели"],
              ["syllables", "Срички"],
            ] as const
          ).map(([id, title]) => (
            <button
              key={id}
              className={mode === id ? "is-active" : ""}
              aria-pressed={mode === id}
              onClick={() => chooseMode(id)}
            >
              {title}
            </button>
          ))}
        </div>
      )}
      <div className={`exercise ${current.color}`}>
        <div className="exercise-top">
          <span>МАЛКА СТЪПКА, ГОЛЯМО БРАВО</span>
          <span>
            {progress} / {total}
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Завършени задачи"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={progress}
        >
          <span style={{ width: `${(progress / total) * 100}%` }} />
        </div>
        {finished ? (
          <div className="completion">
            <span className="completion-flower" aria-hidden="true">
              ✿
            </span>
            <h3 ref={questionHeading} tabIndex={-1}>
              Браво! {total} малки победи!
            </h3>
            <p>
              Браво за любопитството и старанието. Почини си или избери друга
              игра.
            </p>
            <button
              className="button button-primary"
              onClick={() => chooseMode(mode)}
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
              {question.kind === "sound-model"
                ? "Произнеси думата бавно. Всяко квадратче показва един звук."
                : question.kind === "syllables"
                  ? "Кажи думата на части и пляскай при всяка сричка. Преброй плясканията."
                  : "Избери своя отговор. Тук можеш спокойно да опитваш."}
            </p>
            {question.kind === "sound-model" && (
              <div className="sound-legend">
                <span>
                  <i className="sound-tile vowel" aria-hidden="true">
                    Г
                  </i>{" "}
                  <span>гласен звук</span>
                </span>
                <span>
                  <i className="sound-tile consonant" aria-hidden="true">
                    С
                  </i>{" "}
                  <span>съгласен звук</span>
                </span>
              </div>
            )}
            <div
              className={`answers ${question.kind === "sound-model" ? "sound-answers" : ""}`}
              role="group"
              aria-label="Възможни отговори"
            >
              {question.choices.map((choice, answer) => (
                <button
                  key={choice}
                  disabled={correct}
                  aria-label={
                    question.kind === "sound-model"
                      ? `Модел ${answer + 1}: ${describeSoundModel(choice)}`
                      : undefined
                  }
                  aria-pressed={selected === answer}
                  className={`answer ${selected === answer ? (correct ? "answer-correct" : "answer-retry") : ""}`}
                  onClick={() => setSelected(answer)}
                >
                  {question.kind === "sound-model" ? (
                    <>
                      <span className="model-name" aria-hidden="true">
                        Модел {answer + 1}
                      </span>
                      <span className="sound-pattern" aria-hidden="true">
                        {[...choice].map((sound, position) => (
                          <span
                            key={position}
                            className={`sound-tile ${sound === "Г" ? "vowel" : "consonant"}`}
                          >
                            {sound}
                          </span>
                        ))}
                      </span>
                    </>
                  ) : (
                    choice
                  )}
                  {selected === answer && (
                    <span aria-hidden="true">{correct ? " ✓" : " ↻"}</span>
                  )}
                </button>
              ))}
            </div>
            {correct && question.kind === "sound-model" && (
              <div
                className="sound-breakdown"
                role="group"
                aria-label="Думата и нейните звукове"
              >
                {[...question.visual].map((letter, position) => (
                  <span key={position}>
                    <span
                      className={`sound-tile ${question.choices[question.correct][position] === "Г" ? "vowel" : "consonant"}`}
                      aria-label={`${letter}: ${question.choices[question.correct][position] === "Г" ? "гласен" : "съгласен"} звук`}
                    >
                      {letter}
                    </span>
                  </span>
                ))}
              </div>
            )}
            {correct && question.syllables && (
              <div
                className="syllable-breakdown"
                role="group"
                aria-label="Думата, разделена на срички"
              >
                {question.syllables.map((syllable, position) => (
                  <span key={position}>
                    {syllable}
                    <small>{position + 1}</small>
                  </span>
                ))}
              </div>
            )}
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
                {index === total - 1
                  ? "Виж как се справи"
                  : "Следващо откритие"}{" "}
                <span aria-hidden="true">→</span>
              </button>
            )}
          </>
        )}
      </div>
      <p className="game-note">
        {total} задачи. Без оценки и без бързане. Напредъкът е само за тази
        игра.
      </p>
    </div>
  );
}
