# Interactive 3D Website

Начална страница с Next.js, TypeScript, Tailwind CSS, Three.js, React Three Fiber и Motion.

## Локално стартиране

Използвай Node.js 24.x и npm. В основната папка на проекта:

```sh
npm ci
npm run dev
```

Отвори http://localhost:3000. Не са необходими environment variables или външни услуги.

## Проверки и production

```sh
npm run typecheck
npm run build
npm run start
```

TypeScript проверката първо генерира Next.js типовете, за да работи и след чисто изтегляне. Build компилира и предварително генерира началната страница. `start` изисква завършен build.

## Публикуване във Vercel

1. Импортирай GitHub хранилището във Vercel: Add New → Project → Import Git Repository.
2. Framework Preset: **Next.js**; Root Directory: основната папка на хранилището (`.`).
3. Node.js: **24.x**; Install Command: `npm ci`; Build Command: `npm run build`. Остави Output Directory по подразбиране за Next.js.
4. Не са необходими secrets или environment variables. Публикувай с Deploy.
5. В Preview Deployment провери скулптурата, drag с мишка и touch, всички секции, мобилния изглед и системната настройка за намалено движение.

Lockfile фиксира зависимостите. PostCSS override прилага поправките за известните уязвимости, включително към вложеното копие в Next.js 15. HDR осветлението се сервира от `public/environments`, без външна CDN заявка.

## Дизайн и съдържание

Скулптурата използва оригинална процедурна геометрия от torus knots. Поддържа мишка и drag на touch устройства; вертикалното скролиране е запазено. При предпочитание за намалено движение автоматичното въртене и плаване спират, а ръчното завъртане остава достъпно.

Преди публично използване замени демонстрационното име, контактния текст и примерните проекти с реално съдържание.
