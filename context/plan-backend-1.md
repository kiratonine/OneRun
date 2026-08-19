# План разработки — БЭКЕНД 1 (ядро)

**Проект:** «Сводный рейс» — консолидация грузов в отдалённые посёлки Мангистау
**Роль:** ядро бэкенда — БД, заявки, пул, маршрутизация, расчёты, рейсы
**Бюджет времени:** полный день, ~10 часов кода
**Ветка:** `feat/backend-core` (от `base`)

Ты на критическом пути. Фронтенд ждёт твои ручки, бэкенд-2 ждёт твой скелет. Всё, что блокирует других, делается первым.

---

## 1. Зона ответственности

Ты владеешь:

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/constants.ts
│   ├── supabase/           # клиент, модуль
│   ├── settlements/
│   ├── orders/
│   ├── pool/
│   ├── demo/
│   ├── routing/            # ORS, порядок объезда
│   ├── pricing/            # стоимость, экономия
│   └── trips/              # сборка рейса
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── .env.example
```

Ты **не трогаешь** после часа H+1:

```
backend/src/report/        # это зона бэкенда-2
frontend/                  # это зона фронтендера
```

---

## 2. Первый час решает всё

Порядок задач в первом часе не обсуждается — он снимает блокировку с двух других людей:

1. **Репозиторий и скелет Nest** (15 мин)
2. **Заглушка `report`-модуля** (10 мин) — чтобы бэкенд-2 мог соткнуться и работать автономно
3. **Пуш ветки `base`** — с этого момента остальные стартуют
4. **Деплой пустого бэкенда с `/api/health`** (20 мин)
5. Проект Supabase, миграции, `.env.example` (15 мин)

Заглушка отчёта, которую ты пишешь и больше никогда не трогаешь:

```ts
// src/report/report.service.ts  ← ВЛАДЕЛЕЦ: БЭКЕНД-2, не редактировать после H+1
import { Injectable } from '@nestjs/common';
import { TripSummaryDto, ReportResult } from './dto/trip-summary.dto';

@Injectable()
export class ReportService {
  async generate(summary: TripSummaryDto): Promise<ReportResult> {
    return {
      contentMd: `## Отчёт по рейсу ${summary.tripCode}\n\n_Заглушка. Заменяется бэкендом-2._`,
      raw: null,
      source: 'mock',
    };
  }
}
```

```ts
// src/report/report.module.ts ← ВЛАДЕЛЕЦ: БЭКЕНД-2
import { Module } from '@nestjs/common';
import { ReportService } from './report.service';

@Module({ providers: [ReportService], exports: [ReportService] })
export class ReportModule {}
```

DTO из раздела 5 создаёшь ты, в первом часе, и после этого правит их только бэкенд-2. Это единственная точка стыка между вами — дальше вы работаете в непересекающихся файлах, и merge пройдёт без конфликтов.

**Деплой в первый час, а не в последний.** Отложенный деплой — самый частый способ потерять хакатон: сборка ломается на переменных окружения, и разбираться приходится в три часа ночи.

---

## 3. Стек

NestJS + TypeScript, `@supabase/supabase-js` для доступа к Postgres, `axios` для ORS. Никаких ORM, миграционных фреймворков и валидационных пайплайнов — SQL пишется руками в миграции, тела запросов принимаются как есть.

Валидация входных данных не нужна: данные демо фиксированы, а безопасность прямо вынесена за рамки MVP.

---

## 4. Схема БД

```sql
create table settlements (
  id serial primary key,
  code text unique not null,
  name_ru text not null,
  name_kz text,
  district text,
  lat double precision not null,
  lon double precision not null
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  from_id int references settlements(id) not null,
  to_id int references settlements(id) not null,
  shipper_name text not null,
  cargo_name text not null,
  weight_kg numeric not null,
  boxes_count int,
  box_note text,
  color text not null,
  status text not null default 'new',
  created_at timestamptz default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'planned',
  stop_order jsonb not null,
  route_geometry jsonb not null,
  total_distance_km numeric not null,
  solo_distance_km numeric not null,
  saved_distance_km numeric not null,
  saved_cost_kzt numeric not null,
  total_weight_kg numeric not null,
  created_at timestamptz default now()
);

create table trip_orders (
  trip_id uuid references trips(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade,
  price_kzt numeric not null,
  load_position int not null,
  drop_index int not null,
  leg_distance_km numeric not null,
  primary key (trip_id, order_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  content_md text not null,
  raw_response jsonb,
  source text not null default 'mock',
  created_at timestamptz default now()
);

-- Realtime для фронтенда
alter publication supabase_realtime add table orders;
```

**Не забудь включить Realtime на таблице `orders`** — без последней строки фронтенд не увидит входящие заявки, и полтора часа его работы уйдут впустую. Это делается в первый час вместе с миграцией.

---

## 5. DTO для стыка с бэкендом-2

```ts
// src/report/dto/trip-summary.dto.ts — создаёшь ты в H+1, дальше владеет бэкенд-2

export interface TripSummaryOrderDto {
  code: string;
  shipperName: string;
  toName: string;
  cargoName: string;
  weightKg: number;
  boxesCount: number | null;
  boxNote: string | null;
  dropIndex: number;
  loadPosition: number;
  priceKzt: number;
  legDistanceKm: number;
}

export interface TripSummaryDto {
  tripCode: string;
  hubName: string;
  stopOrder: string[];        // названия по-русски, не коды
  totalDistanceKm: number;
  soloDistanceKm: number;
  savedDistanceKm: number;
  savedCostKzt: number;
  totalWeightKg: number;
  costPerKmKzt: number;
  orders: TripSummaryOrderDto[];
}

export interface ReportResult {
  contentMd: string;
  raw: unknown | null;
  source: 'gemini' | 'mock';
}
```

Твоя обязанность — заполнить `TripSummaryDto` корректно и целиком. Все числа считаешь ты, модель их не пересчитывает.

---

## 6. Константы

```ts
// src/config/constants.ts

export const POOL_WEIGHT_THRESHOLD_KG = 500;
export const HUB_SETTLEMENT_CODE = 'AKTAU';

export const FUEL_CONSUMPTION_L_PER_100KM = 25;
export const DIESEL_PRICE_KZT_PER_L = 340;
export const OVERHEAD_MULTIPLIER = 2.1;
export const COST_PER_KM_KZT =
  (FUEL_CONSUMPTION_L_PER_100KM / 100) * DIESEL_PRICE_KZT_PER_L * OVERHEAD_MULTIPLIER;

export const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';
export const ORS_PROFILE = 'driving-hgv';
export const ORS_TIMEOUT_MS = 10_000;

export const STRAIGHT_LINE_DETOUR_FACTOR = 1.3;  // фолбэк, если ORS не построил маршрут
export const EARTH_RADIUS_KM = 6371;

export const ORDER_LINE_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899',
] as const;
```

Всё, что известно до рантайма и не меняется, — сюда, в `UPPER_SNAKE_CASE`. Конфиг-объекты, которые спредятся в запросы, остаются в `camelCase`:

```ts
export const orsRequestConfig = {
  headers: { Authorization: process.env.ORS_API_KEY ?? '' },
  timeout: ORS_TIMEOUT_MS,
} as const;
```

---

## 7. Контракт API — согласован, не меняем в одностороннем порядке

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| GET | `/api/health` | — | `{ status: 'ok' }` |
| GET | `/api/settlements` | — | `Settlement[]` |
| GET | `/api/orders` | — | `Order[]` |
| GET | `/api/pool` | — | `PoolStatus` |
| POST | `/api/orders` | `{ fromCode, toCode, shipperName, cargoName, weightKg, boxesCount?, boxNote? }` | `Order` |
| POST | `/api/demo/seed` | — | `Order` или `204` |
| POST | `/api/demo/reset` | — | `{ ok: true }` |
| POST | `/api/trips` | — | `Trip` |
| GET | `/api/trips/:id` | — | `Trip` |

Формы ответов:

```ts
interface Settlement {
  id: number; code: string; nameRu: string; nameKz: string | null;
  district: string | null; lat: number; lon: number;
}

interface Order {
  id: string; code: string;
  from: Settlement; to: Settlement;          // вложенные объекты, не id
  shipperName: string; cargoName: string;
  weightKg: number; boxesCount: number | null; boxNote: string | null;
  color: string; status: 'new' | 'pooled' | 'routed'; createdAt: string;
}

interface PoolStatus {
  totalWeightKg: number; ordersCount: number;
  thresholdKg: number; isReady: boolean;
}

interface Trip {
  id: string; code: string;
  stopOrder: string[];
  routeGeometry: { type: 'LineString'; coordinates: [number, number][] };  // [lon, lat]
  totalDistanceKm: number; soloDistanceKm: number;
  savedDistanceKm: number; savedCostKzt: number; totalWeightKg: number;
  orders: Array<{
    orderCode: string; dropIndex: number; loadPosition: number;
    priceKzt: number; legDistanceKm: number;
  }>;
  report: string;
  reportSource: 'gemini' | 'mock';
}
```

Ключевые договорённости, нарушение которых сломает фронт:
- Ответ отдаётся в `camelCase`, а не в `snake_case` из БД. Маппинг делаешь ты.
- `routeGeometry.coordinates` — в порядке `[lon, lat]` (стандарт GeoJSON).
- `Order.from` и `Order.to` — вложенные объекты `Settlement`, не идентификаторы.
- `color` присваивается на бэкенде из `ORDER_LINE_COLORS` по порядковому номеру заявки в пуле.

---

## 8. Этапы

### H+0 — H+1 · Разблокировка команды

Порядок из раздела 2. Итог часа:

- ветка `base` в репозитории
- `/api/health` отвечает по публичному URL
- миграции применены, Realtime включён на `orders`
- `.env.example` заполнен

**Готово, когда:** двое других начали работать, не спрашивая тебя ни о чём.

---

### H+1 — H+2 · Справочник посёлков

- `seed.sql` с 10–12 населёнными пунктами: Актау, Акшукур, Шетпе, Бейнеу, Жанаозен, Курык, Жетыбай, Мунайшы, Сенек, Устюрт, Форт-Шевченко
- Координаты через Nominatim: `https://nominatim.openstreetmap.org/search?q=Шетпе,+Mangystau&format=json` — прогоняешь скриптом один раз, результат вписываешь в сид
- `GET /api/settlements`

**Координаты не выдумывать.** На питче отдельным пунктом требуется показать, какие реальные населённые пункты использованы — придуманная точка посреди степи убивает этот аргумент.

**Готово, когда:** фронт получает справочник и рисует маркеры.

---

### H+2 — H+3 · Заявки и пул

- `POST /api/orders`, `GET /api/orders` с джойном на `settlements`
- Генерация `code` вида `ORD-001` — счётчиком от количества строк
- Присвоение `color` из `ORDER_LINE_COLORS`
- `GET /api/pool` — сумма весов, число заявок, флаг готовности

**Готово, когда:** заявка, созданная через API, видна на карте фронтенда.

---

### H+3 — H+4 · Демо-модуль

- Фиксированный набор из шести заявок в коде: реальные посёлки, реальные грузы, веса подобраны так, чтобы порог `POOL_WEIGHT_THRESHOLD_KG` перешагивался **строго на шестой заявке**
- `POST /api/demo/seed` — создаёт следующую по счёту, `204` когда набор кончился
- `POST /api/demo/reset` — чистит `trip_orders`, `reports`, `trips`, `orders` в этом порядке

Пример набора (веса подгони так, чтобы сумма первых пяти была меньше 500, а шестая переваливала):

| # | Откуда | Куда | Груз | Вес |
|---|---|---|---|---|
| 1 | Актау | Акшукур | Продукты питания | 80 |
| 2 | Актау | Шетпе | Стройматериалы | 120 |
| 3 | Актау | Жетыбай | Запчасти | 60 |
| 4 | Актау | Курык | Бытовая техника | 95 |
| 5 | Актау | Жанаозен | Продукты питания | 110 |
| 6 | Актау | Бейнеу | Стройматериалы | 140 |

**Готово, когда:** одна кнопка на фронте наливает шесть заявок и кнопка «Построить рейс» появляется ровно на последней.

---

### H+4 — H+5:30 · Маршрутизация

- Порядок объезда: nearest-neighbour от `HUB_SETTLEMENT_CODE` по прямому расстоянию (гаверсинус), затем возврат в хаб. На шести точках этого достаточно и считается мгновенно.
- `POST ${ORS_BASE_URL}/directions/${ORS_PROFILE}/geojson` с массивом координат в порядке объезда — геометрия и суммарный километраж
- Плечи «хаб — каждый пункт назначения» отдельными запросами для расчёта `soloDistanceKm` и `legDistanceKm`

**Фолбэк, который надо написать сразу, а не когда сломается:** если ORS вернул ошибку или не нашёл маршрут — считаешь расстояние по гаверсинусу и умножаешь на `STRAIGHT_LINE_DETOUR_FACTOR`, геометрию отдаёшь прямыми отрезками между точками. До Устюрта и Сайотеса дорог в OpenStreetMap может не быть, и это выяснится в самый неподходящий момент.

**Проверь доступность маршрутов до всех посёлков сида в первые 15 минут этапа.** Если до половины точек маршрут не строится — либо убираешь их из демо-набора, либо сразу живёшь на фолбэке.

**Готово, когда:** на вход список точек — на выход GeoJSON и километраж, с работающим фолбэком.

---

### H+5:30 — H+6:15 · Расчёты

```
tkm_i     = weightKg_i / 1000 × legDistanceKm_i
share_i   = tkm_i / Σ tkm
price_i   = totalDistanceKm × COST_PER_KM_KZT × share_i

soloDistanceKm  = Σ (legDistanceKm_i × 2)
savedDistanceKm = soloDistanceKm − totalDistanceKm
savedCostKzt    = savedDistanceKm × COST_PER_KM_KZT
```

Порядок погрузки по правилу LIFO: `loadPosition = dropIndex`, где `dropIndex = 1` у первой точки выгрузки. Смысл: то, что выгружается первым, грузится последним и стоит у дверей.

**Проверь сходимость:** сумма всех `priceKzt` должна равняться `totalDistanceKm × COST_PER_KM_KZT` с точностью до округления. Если не сходится — ошибка в долях, и её увидит жюри, когда сложит колонку.

**Готово, когда:** цифры сходятся и выглядят правдоподобно для грузоперевозки.

---

### H+6:15 — H+8 · Сборка рейса

`POST /api/trips`:

1. Набрать заявки со статусом `new`
2. Определить порядок объезда
3. Получить геометрию и километраж
4. Посчитать цены и экономию
5. Собрать `TripSummaryDto`
6. Взвать `reportService.generate(summary)` — к этому моменту бэкенд-2 либо влил свою реализацию, либо там ещё заглушка, и это нормально
7. Записать `trips`, `trip_orders`, `reports`; перевести заявки в `routed`
8. Вернуть собранный `Trip`

`GET /api/trips/:id` читает всё из БД — **никаких повторных вызовов ORS и Gemini.** На демо маршрут обязан быть побайтово одинаковым при каждом показе, и это достигается кэшированием результата, а не хардкодом координат.

**Готово, когда:** одно нажатие на фронте отдаёт полный рейс с отчётом.

---

### H+8 — H+9 · Стыковка

- Пройти весь флоу вместе с фронтендером
- Починить расхождения `camelCase`/`snake_case` (они будут)
- Проверить `demo/reset` — трижды подряд

---

### H+9 — H+10 · Merge и финальный деплой

- Влить `feat/backend-report` от бэкенда-2
- Проверить переключение `LLM_PROVIDER` в обе стороны
- Задеплоить, проверить публичный URL с чужого устройства
- README: как запустить, какие переменные нужны

---

## 9. Чек-лист готовности

- [ ] `/api/health` отвечает по публичному URL
- [ ] Справочник содержит реальные посёлки с проверенными координатами
- [ ] Realtime включён на таблице `orders`
- [ ] Заявка создаётся и сразу видна на фронте
- [ ] Порог срабатывает ровно на шестой заявке
- [ ] Маршрут строится по дорогам; фолбэк проверен принудительным отключением ORS
- [ ] Сумма цен по заявкам сходится с полной стоимостью рейса
- [ ] `GET /api/trips/:id` не ходит наружу
- [ ] `demo/reset` отрабатывает трижды подряд
- [ ] Ответы в `camelCase`, координаты в `[lon, lat]`
- [ ] Ветка бэкенда-2 влита, оба режима `LLM_PROVIDER` проверены

---

## 10. Если отстаёшь — режу в этом порядке

1. `POST /api/orders` (ручное создание) — демо работает через `demo/seed`
2. Отдельные запросы плеч в ORS — считать плечи гаверсинусом с коэффициентом, полную геометрию брать из одного запроса
3. `name_kz` и `district` в справочнике
4. Статус `pooled` — хватит `new` и `routed`

**Никогда не режу:** сид посёлков, `demo/seed`, `demo/reset`, `POST /api/trips`, кэширование рейса в БД.
