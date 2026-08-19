import { TripSummaryDto, TripSummaryOrderDto } from '../dto/trip-summary.dto';

function markdownCell(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function finiteNumber(value: number): string {
  return Number.isFinite(value) ? String(value) : '0';
}

function describePlaces(order: TripSummaryOrderDto): string {
  const count =
    order.boxesCount === null
      ? 'количество не указано'
      : `${order.boxesCount} мест`;
  return order.boxNote ? `${count}; ${markdownCell(order.boxNote)}` : count;
}

function describePlacement(
  order: TripSummaryOrderDto,
  lastDropIndex: number,
): string {
  if (order.dropIndex === 1) {
    return `выгружается первым, в ${markdownCell(order.toName)} — ставить у дверей`;
  }
  if (order.dropIndex === lastDropIndex) {
    return `выгружается последним, в ${markdownCell(order.toName)} — ставить в глубине прицепа`;
  }

  return `выгружается ${order.dropIndex}-м, в ${markdownCell(order.toName)} — ставить между дальним грузом и дверями`;
}

function buildSpecialNotes(orders: TripSummaryOrderDto[]): string[] {
  const cargoDescriptions = orders.map(({ cargoName, boxNote }) =>
    `${cargoName} ${boxNote ?? ''}`.toLowerCase(),
  );
  const notes: string[] = [];

  if (
    cargoDescriptions.some((description) =>
      /продукт|пищ|еда/.test(description),
    ) &&
    cargoDescriptions.some((description) =>
      /строй|цемент|краск|хими/.test(description),
    )
  ) {
    notes.push(
      'Продукты и строительные материалы необходимо физически разделить и защитить от пыли и запахов.',
    );
  }
  if (
    cargoDescriptions.some((description) =>
      /хруп|стекл|посуд/.test(description),
    )
  ) {
    notes.push('Хрупкий груз размещать сверху и закрепить от смещения.');
  }
  if (
    cargoDescriptions.some((description) =>
      /скоропорт|охлажд|заморож/.test(description),
    )
  ) {
    notes.push(
      'Скоропортящийся груз держать ближе к выходу и не нарушать температурный режим.',
    );
  }

  return notes.length > 0
    ? notes
    : ['Дополнительных ограничений по совместимости грузов не выявлено.'];
}

export function buildFallbackReport(summary: TripSummaryDto): string {
  const orders = Array.isArray(summary.orders) ? summary.orders : [];
  const stopOrder = Array.isArray(summary.stopOrder) ? summary.stopOrder : [];
  const distanceByStop = new Map(
    orders.map(({ toName, legDistanceKm }) => [toName, legDistanceKm]),
  );
  const lastDropIndex = Math.max(
    0,
    ...orders.map(({ dropIndex }) => dropIndex),
  );
  const loadingRows = [...orders]
    .sort((left, right) => right.loadPosition - left.loadPosition)
    .map(
      (order) =>
        `| ${order.loadPosition} | ${markdownCell(order.code)} | ${markdownCell(order.toName)} | ${markdownCell(order.cargoName)} | ${finiteNumber(order.weightKg)} кг | ${describePlaces(order)} | ${describePlacement(order, lastDropIndex)} |`,
    );
  const priceRows = orders.map(
    (order) =>
      `| ${markdownCell(order.code)} | ${markdownCell(order.shipperName)} | ${markdownCell(order.toName)} | ${finiteNumber(order.weightKg)} кг | ${finiteNumber(order.legDistanceKm)} км | ${finiteNumber(order.priceKzt)} ₸ |`,
  );
  const totalPriceKzt = orders.reduce(
    (total, { priceKzt }) => total + (Number.isFinite(priceKzt) ? priceKzt : 0),
    0,
  );
  const routeRows = stopOrder.map((stop, index) => {
    const radialDistance = distanceByStop.get(stop);
    const detail =
      index === 0
        ? 'старт, хаб'
        : index === stopOrder.length - 1 && stop === summary.hubName
          ? 'возврат в хаб'
          : radialDistance === undefined
            ? 'остановка'
            : `${finiteNumber(radialDistance)} км от хаба`;
    return `${index + 1}. ${markdownCell(stop)} — ${detail}`;
  });
  const generatedDate = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Aqtau',
  }).format(new Date());

  return [
    `# План рейса ${markdownCell(summary.tripCode)}`,
    '',
    `_Сформирован: ${generatedDate}_`,
    '',
    '## Маршрут следования',
    '',
    ...(routeRows.length > 0 ? routeRows : ['1. Маршрут не указан']),
    '',
    `**Общая длина маршрута:** ${finiteNumber(summary.totalDistanceKm)} км`,
    '',
    '## План погрузки',
    '',
    '| Очерёдность загрузки | Заявка | Посёлок | Груз | Вес | Места | Размещение |',
    '|---:|---|---|---|---:|---|---|',
    ...(loadingRows.length > 0
      ? loadingRows
      : ['| — | — | — | — | 0 кг | — | Нет груза для погрузки |']),
    '',
    '## Стоимость по заявкам',
    '',
    '| Заявка | Отправитель | Посёлок | Вес | Расстояние от хаба | Цена |',
    '|---|---|---|---:|---:|---:|',
    ...(priceRows.length > 0
      ? priceRows
      : ['| — | — | — | 0 кг | 0 км | 0 ₸ |']),
    `| **Итого** |  |  | **${finiteNumber(summary.totalWeightKg)} кг** |  | **${finiteNumber(totalPriceKzt)} ₸** |`,
    '',
    '## Экономический эффект',
    '',
    `- Было при отдельных рейсах: **${finiteNumber(summary.soloDistanceKm)} км**`,
    `- Стало в сводном рейсе: **${finiteNumber(summary.totalDistanceKm)} км**`,
    `- Сэкономлено: **${finiteNumber(summary.savedDistanceKm)} км**`,
    `- Экономия: **${finiteNumber(summary.savedCostKzt)} ₸**`,
    `- Расчётная себестоимость: **${finiteNumber(summary.costPerKmKzt)} ₸/км**`,
    '',
    '## Особые замечания',
    '',
    ...buildSpecialNotes(orders).map((note) => `- ${note}`),
  ].join('\n');
}
