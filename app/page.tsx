"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MotionConfig, motion } from "motion/react";
import LearningGame, {
  subjects,
  type Subject,
} from "@/components/LearningGame";

const Sculpture = dynamic(() => import("@/components/Sculpture"), {
  ssr: false,
  loading: () => (
    <div className="planet-canvas planet-fallback">
      Подреждаме нашата вселена…
    </div>
  ),
});
const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.5 },
};

function ArrowUpRight() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 12 12 4M4 4h8v8" />
    </svg>
  );
}

function Flower({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 5c7-9 17 1 12 8 11-1 14 13 4 17 7 9-5 18-12 11-4 10-18 6-17-4C0 39-3 24 8 21 0 12 12 2 19 10c0-3 2-5 5-5Z"
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="7" fill="#fffaf1" />
    </svg>
  );
}

export default function Home() {
  const [subject, setSubject] = useState<Subject>("letters");
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#practice">
        Към упражненията
      </a>
      <header className="site-header container">
        <a className="brand" href="#home" aria-label="Малки стъпки — начало">
          <Flower />
          <span>
            малки
            <span className="brand-second">
              стъпки<span className="brand-dot">.</span>
            </span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Основна навигация">
          <a href="#subjects">Какво учим</a>
          <a href="#practice">Да поиграем</a>
          <a href="#parents">За родителите</a>
        </nav>
        <a href="#practice" className="button button-small">
          Хайде да учим <ArrowUpRight />
        </a>
      </header>
      <main id="home">
        <section className="hero container" aria-labelledby="hero-title">
          <motion.div className="hero-copy" {...reveal}>
            <p className="eyebrow">
              <span className="little-spark" aria-hidden="true">
                ✳
              </span>{" "}
              ЗА ЛЮБОПИТНИ ПЪРВОКЛАСНИЦИ
            </p>
            <h1 id="hero-title">
              Големи открития.
              <br />
              <span>Малки стъпки.</span>
            </h1>
            <p className="hero-description">
              Първите букви. Първите задачи. Първото „Аз мога!“. Откриваме
              радостта от ученето — с игра, спокойствие и малко въображение.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#practice">
                Да опитаме заедно <span aria-hidden="true">→</span>
              </a>
              <a className="text-link" href="#subjects">
                Разгледай игрите <ArrowUpRight />
              </a>
            </div>
            <div className="hero-benefits">
              <span>
                <i aria-hidden="true">✓</i> Без регистрация
              </span>
              <span>
                <i aria-hidden="true">✓</i> В твоето темпо
              </span>
              <span>
                <i aria-hidden="true">✓</i> За 1. клас
              </span>
            </div>
          </motion.div>
          <div className="hero-art">
            <div className="planet-halo" />
            <span className="orbit-label label-letter" aria-hidden="true">
              А<span>а</span>
            </span>
            <span className="orbit-label label-number" aria-hidden="true">
              1<span>2</span>3
            </span>
            <span className="orbit-star" aria-hidden="true">
              ✧
            </span>
            <Sculpture />
            <span className="planet-caption">
              <span aria-hidden="true">↔</span> Движи мишката или плъзни с
              пръст
            </span>
            <span className="art-note">
              Всяко „защо?“
              <br />е ново начало.
            </span>
          </div>
        </section>
        <div className="promise-strip">
          <div className="container">
            <span>МЯСТО ЗА МАЛКИ ОТКРИВАТЕЛИ</span>
            <span>
              <Flower /> Ученето може да е приключение.
            </span>
            <span className="strip-last">ПО ЕДНА СТЪПКА НА ДЕН</span>
          </div>
        </div>
        <section
          id="subjects"
          className="section container"
          aria-labelledby="subjects-title"
        >
          <motion.div {...reveal} className="section-heading">
            <div>
              <p className="eyebrow">ТРИ ПОСОКИ. БЕЗБРОЙ ОТКРИТИЯ.</p>
              <h2 id="subjects-title">
                Накъде ще поемем <span>днес?</span>
              </h2>
            </div>
            <p>
              От първата буква до света навън.
              <br />
              Всяка игра е една малка крачка напред.
            </p>
          </motion.div>
          <div className="subject-cards">
            {subjects.map((subject, index) => (
              <motion.a
                {...reveal}
                key={subject.id}
                className={`subject-card ${subject.color}`}
                href="#practice"
                onClick={() => setSubject(subject.id)}
              >
                <div className="card-top">
                  <span className="card-symbol" aria-hidden="true">
                    {subject.symbol}
                  </span>
                  <span className="card-index">0{index + 1}</span>
                </div>
                <h3>{subject.title}</h3>
                <p>{subject.description}</p>
                <span className="card-link">
                  Открий играта <ArrowUpRight />
                </span>
              </motion.a>
            ))}
          </div>
        </section>
        <section
          id="practice"
          className="practice-section"
          aria-labelledby="practice-title"
        >
          <div className="container practice-layout">
            <motion.div {...reveal} className="practice-copy">
              <p className="eyebrow">МАЛКО ИГРА. МНОГО „АЗ МОГА!“.</p>
              <h2 id="practice-title">
                Да започнем
                <br />с нещо <span>малко.</span>
              </h2>
              <p>
                Избери тема и направи първото си откритие. Ако не стане от
                първия път, опитай пак — точно така се учим.
              </p>
              <div className="encouragement">
                <Flower />
                <p>
                  Тук няма „не мога“.
                  <br />
                  <strong>Има „още се уча“.</strong>
                </p>
              </div>
              <span className="handwritten">Готови ли сме? Хайде!</span>
            </motion.div>
            <LearningGame
              key={subject}
              subject={subject}
              onSubjectChange={setSubject}
            />
          </div>
        </section>
        <section
          id="parents"
          className="section container parents-section"
          aria-labelledby="parents-title"
        >
          <motion.div {...reveal} className="parent-card">
            <div className="parent-art" aria-hidden="true">
              <div className="paper paper-one">
                <span>А Б В</span>
                <i />
                <i />
                <i />
                <span className="paper-flower">✿</span>
              </div>
              <div className="paper paper-two">
                <span>2 + 1</span>
                <b>= 3</b>
                <span className="paper-check">✓</span>
              </div>
              <span className="parent-spark">✧</span>
            </div>
            <div>
              <p className="eyebrow">ЗА ГОЛЕМИТЕ ДО МАЛКИТЕ</p>
              <h2 id="parents-title">
                Най-важният урок?
                <br />
                <span>„До теб съм.“</span>
              </h2>
              <p>
                Не е нужно всичко да стане от първия път. Отделете няколко
                спокойни минути, прочетете условието заедно и празнувайте
                старанието.
              </p>
              <ul className="parent-tips">
                <li>
                  <span>01</span> Оставете детето да опита само.
                </li>
                <li>
                  <span>02</span> Попитайте „Как стигна до този отговор?“.
                </li>
                <li>
                  <span>03</span> Завършете с усмивка и време за почивка.
                </li>
              </ul>
              <p className="parent-note">
                Игрите са за допълнително упражнение и не заменят работата с
                учител.
              </p>
            </div>
          </motion.div>
        </section>
        <section className="closing container">
          <Flower />
          <h2>
            Днес — малка стъпка.
            <br />
            <span>Утре — „Аз мога!“.</span>
          </h2>
          <a className="button button-primary" href="#practice">
            Хайде да откриваме <span aria-hidden="true">→</span>
          </a>
        </section>
      </main>
      <footer className="site-footer container">
        <a className="brand footer-brand" href="#home">
          <Flower />
          <span>
            малки стъпки<span className="brand-dot">.</span>
          </span>
        </a>
        <p>С любопитство, смелост и по малко всеки ден.</p>
        <span>За деца в 1. клас · {new Date().getFullYear()}</span>
      </footer>
    </MotionConfig>
  );
}
