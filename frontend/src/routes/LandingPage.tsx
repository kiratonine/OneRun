import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Map,
  PackageCheck,
  Route as RouteIcon,
  Scale,
  Truck,
} from "lucide-react"
import { Link } from "react-router-dom"

import "./landing.css"

const processSteps = [
  {
    number: "01",
    title: "Заявки попадают в общий пул",
    text: "Отправители указывают маршрут и параметры груза. Логист видит все заявки вместе.",
  },
  {
    number: "02",
    title: "Пул набирает загрузку",
    text: "Система считает общий вес. Когда машина набрана, рейс можно сформировать.",
  },
  {
    number: "03",
    title: "Один маршрут вместо нескольких",
    text: "OneRun определяет порядок объезда и строит маршрут по дорогам через точки назначения.",
  },
  {
    number: "04",
    title: "Готовый план для логиста",
    text: "Система показывает стоимость по заявкам, порядок погрузки и формирует отчёт.",
  },
] as const

const mvpFeatures = [
  {
    icon: Map,
    title: "Живая карта",
    text: "Реальные населённые пункты Мангистау и заявки на карте.",
  },
  {
    icon: Boxes,
    title: "Общий пул",
    text: "Суммарный вес и понятный момент готовности к рейсу.",
  },
  {
    icon: RouteIcon,
    title: "Маршрут по дорогам",
    text: "Один сводный рейс через точки назначения.",
  },
  {
    icon: Scale,
    title: "Распределение стоимости",
    text: "Доля заявки зависит от веса и расстояния.",
  },
  {
    icon: PackageCheck,
    title: "План погрузки",
    text: "Очерёдность по принципу LIFO для удобной выгрузки.",
  },
  {
    icon: ClipboardList,
    title: "Отчёт для логиста",
    text: "Маршрут, стоимость, порядок погрузки и экономический эффект.",
  },
] as const

const heroFacts = [
  "Несколько заявок → 1 рейс",
  "Реальный маршрут по дорогам",
  "Стоимость делится между отправителями",
] as const

function AppLink({ className = "" }: { className?: string }) {
  return (
    <Link className={`landing-cta ${className}`} to="/">
      Перейти в приложение
      <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
    </Link>
  )
}

function RouteVisual() {
  return (
    <div className="landing-visual" aria-hidden="true">
      <div className="landing-visual__glow" />
      <svg viewBox="0 0 720 600" role="presentation">
        <defs>
          <linearGradient id="road" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#26343e" stopOpacity="0" />
            <stop offset="0.45" stopColor="#6f8793" stopOpacity="0.46" />
            <stop offset="1" stopColor="#20303a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="route" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0" stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
          <filter id="routeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <path
          d="M38 584C178 460 221 393 280 258C323 158 389 78 548 16"
          fill="none"
          stroke="url(#road)"
          strokeWidth="104"
        />
        <path
          d="M38 584C178 460 221 393 280 258C323 158 389 78 548 16"
          fill="none"
          stroke="#d6e4e8"
          strokeDasharray="18 28"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
        <path
          className="landing-route-glow"
          d="M96 532C160 450 220 442 258 350C296 258 309 194 369 143C469 80 450 80 520 30"
          fill="none"
          filter="url(#routeGlow)"
          stroke="#22d3ee"
          strokeOpacity="0.42"
          strokeWidth="9"
        />
        <path
          className="landing-route-line"
          d="M96 532C160 450 220 442 258 350C296 258 309 194 369 143C469 80 450 80 520 30"
          fill="none"
          stroke="url(#route)"
          strokeDasharray="7 11"
          strokeLinecap="round"
          strokeWidth="3"
        />
        {[
          [96, 532],
          [258, 350],
          [369, 143],
          [520, 33],
        ].map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <circle
              cx={cx}
              cy={cy}
              fill="#071014"
              r="11"
              stroke="#22d3ee"
              strokeWidth="2"
            />
            <text
              x={cx}
              y={cy + 4}
              fill="#edfafa"
              fontFamily="Inter, sans-serif"
              fontSize="10"
              textAnchor="middle"
            >
              {index + 1}
            </text>
          </g>
        ))}
        <g transform="translate(65 480) rotate(-51)">
          <path d="M0 28h118l27 30v38H12C5 96 0 91 0 84V28Z" fill="#dbe5e8" />
          <path d="m118 28 34 9 27 34v25h-34V58l-27-30Z" fill="#81929a" />
          <path d="m139 43 12 3 16 22h-28V43Z" fill="#0a161c" />
          <circle
            cx="37"
            cy="96"
            r="15"
            fill="#071014"
            stroke="#70828a"
            strokeWidth="5"
          />
          <circle
            cx="142"
            cy="96"
            r="15"
            fill="#071014"
            stroke="#70828a"
            strokeWidth="5"
          />
          <path d="M12 38h92" stroke="#ffffff" strokeOpacity="0.4" />
        </g>
      </svg>
      <div className="landing-visual__caption">
        <span className="landing-pulse" />
        Актау · Мангистауская область
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header__inner">
          <Link
            className="landing-brand"
            to="/landing"
            aria-label="OneRun — главная лендинга"
          >
            <span>OneRun</span>
            <small>Сводный рейс · Мангистау</small>
          </Link>
          <AppLink className="landing-cta--header" />
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-container landing-hero__grid">
            <div className="landing-hero__copy landing-reveal">
              <p className="landing-eyebrow">Грузоперевозки по Мангистау</p>
              <h1 id="landing-title">OneRun — Сводный рейс</h1>
              <p className="landing-hero__lead">
                Объединяем небольшие заявки в один общий рейс, чтобы перевозчик
                загружал машину эффективнее, а отправители платили только свою
                долю вместо стоимости отдельного рейса.
              </p>
              <AppLink />
            </div>

            <RouteVisual />

            <ul
              className="landing-hero__facts"
              aria-label="Ключевые возможности"
            >
              {heroFacts.map((fact, index) => (
                <li key={fact}>
                  <span>0{index + 1}</span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="landing-section landing-problem"
          aria-labelledby="problem-title"
        >
          <div className="landing-container landing-problem__grid">
            <div>
              <p className="landing-kicker">Проблема</p>
              <h2 id="problem-title">
                Маленький груз не должен оплачивать целую машину
              </h2>
            </div>
            <div className="landing-problem__body">
              <p>
                Магазину, стройке или фермеру может потребоваться перевезти
                всего 80–200 кг. Отдельный рейс ради такой партии экономически
                невыгоден.
              </p>
              <ul>
                <li>Заявки сводят вручную через звонки и WhatsApp.</li>
                <li>Логисту сложно увидеть общую загрузку машины.</li>
                <li>OneRun делает консолидацию видимой и системной.</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-process"
          aria-labelledby="process-title"
        >
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-kicker">Как работает OneRun</p>
              <h2 id="process-title">От заявки до готового плана рейса</h2>
            </div>
            <ol className="landing-process__list">
              {processSteps.map((step) => (
                <li key={step.number}>
                  <span className="landing-process__number">{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="landing-section landing-mvp"
          aria-labelledby="mvp-title"
        >
          <div className="landing-container">
            <div className="landing-section-heading landing-section-heading--split">
              <div>
                <p className="landing-kicker">Возможности</p>
                <h2 id="mvp-title">Не концепт. Рабочий MVP.</h2>
              </div>
              <p>
                Всё, что нужно логисту для демонстрационного сводного рейса, уже
                работает.
              </p>
            </div>
            <ul className="landing-mvp__grid">
              {mvpFeatures.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <Icon aria-hidden="true" size={22} strokeWidth={1.6} />
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="landing-section landing-economics"
          aria-labelledby="economics-title"
        >
          <div className="landing-container">
            <div className="landing-economics__intro">
              <p className="landing-kicker">Демонстрационный сценарий OneRun</p>
              <h2 id="economics-title">
                Один сводный рейс сокращает лишний пробег
              </h2>
              <p>
                Стоимость распределяется между отправителями пропорционально
                тонна-километрам.
              </p>
            </div>
            <dl className="landing-economics__numbers">
              <div>
                <dt>Отдельными рейсами</dt>
                <dd>
                  1940 <small>км</small>
                </dd>
              </div>
              <div className="landing-economics__primary">
                <dt>Один сводный рейс</dt>
                <dd>
                  812 <small>км</small>
                </dd>
              </div>
              <div>
                <dt>Сохранённый пробег</dt>
                <dd>
                  1128 <small>км</small>
                </dd>
              </div>
              <div>
                <dt>Расчётная экономия</dt>
                <dd>
                  ≈201 <small>тыс. ₸</small>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          className="landing-section landing-audience"
          aria-labelledby="audience-title"
        >
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-kicker">Для кого</p>
              <h2 id="audience-title">Две стороны одного рейса</h2>
            </div>
            <div className="landing-audience__grid">
              <article>
                <Truck aria-hidden="true" size={26} strokeWidth={1.5} />
                <h3>Логист / перевозчик</h3>
                <p>
                  Видит заявки в одном месте, понимает готовность машины и
                  получает маршрут, план загрузки и расчёт рейса.
                </p>
              </article>
              <article>
                <Boxes aria-hidden="true" size={26} strokeWidth={1.5} />
                <h3>Грузоотправитель</h3>
                <p>
                  Отправляет небольшую партию, участвует в общем рейсе и платит
                  свою долю, а не стоимость отдельной машины.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-closing" aria-labelledby="closing-title">
          <div className="landing-container landing-closing__inner">
            <p className="landing-kicker">Работающий MVP</p>
            <h2 id="closing-title">
              Один маршрут вместо нескольких отдельных рейсов.
            </h2>
            <p>
              Посмотрите карту, пул заявок, построение рейса и отчёт OneRun.
            </p>
            <AppLink />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <span>OneRun</span>
          <span>Mangystau Hackathon 2026 · Мангистауская область</span>
        </div>
      </footer>
    </div>
  )
}
