import { TripSummaryDto } from '../dto/trip-summary.dto';
import { buildFallbackReport } from './fallback-report';

describe('buildFallbackReport', () => {
  it('builds the complete report and loads cargo in descending load position', () => {
    const summary: TripSummaryDto = {
      tripCode: 'TRIP-007',
      hubName: 'Актау',
      stopOrder: ['Актау', 'Шетпе', 'Бейнеу', 'Актау'],
      totalDistanceKm: 812,
      soloDistanceKm: 1940,
      savedDistanceKm: 1128,
      savedCostKzt: 201_348,
      totalWeightKg: 520,
      costPerKmKzt: 178.5,
      orders: [
        {
          code: 'ORD-001',
          shipperName: 'Магазин',
          toName: 'Шетпе',
          cargoName: 'Продукты питания',
          weightKg: 200,
          boxesCount: 10,
          boxNote: '10 коробок',
          dropIndex: 1,
          loadPosition: 1,
          priceKzt: 18_400,
          legDistanceKm: 110,
        },
        {
          code: 'ORD-002',
          shipperName: 'Стройка',
          toName: 'Бейнеу',
          cargoName: 'Стройматериалы',
          weightKg: 320,
          boxesCount: null,
          boxNote: null,
          dropIndex: 2,
          loadPosition: 2,
          priceKzt: 42_000,
          legDistanceKm: 470,
        },
      ],
    };

    const report = buildFallbackReport(summary);

    expect(report).toContain('# План рейса TRIP-007');
    expect(report).toContain('2. Шетпе — 110 км от хаба');
    expect(report).toContain('**Общая длина маршрута:** 812 км');
    expect(report.indexOf('| 2 | ORD-002 |')).toBeLessThan(
      report.indexOf('| 1 | ORD-001 |'),
    );
    expect(report).toContain('выгружается первым, в Шетпе — ставить у дверей');
    expect(report).toContain(
      '| **Итого** |  |  | **520 кг** |  | **60400 ₸** |',
    );
    expect(report).toContain('Сэкономлено: **1128 км**');
    expect(report).toContain(
      'Продукты и строительные материалы необходимо физически разделить',
    );
  });

  it('escapes table delimiters from input data', () => {
    const summary: TripSummaryDto = {
      tripCode: 'TRIP-PIPE',
      hubName: 'Актау',
      stopOrder: ['Актау'],
      totalDistanceKm: 0,
      soloDistanceKm: 0,
      savedDistanceKm: 0,
      savedCostKzt: 0,
      totalWeightKg: 1,
      costPerKmKzt: 178.5,
      orders: [
        {
          code: 'ORD|001',
          shipperName: 'ИП',
          toName: 'Актау',
          cargoName: 'Груз',
          weightKg: 1,
          boxesCount: null,
          boxNote: null,
          dropIndex: 1,
          loadPosition: 1,
          priceKzt: 1,
          legDistanceKm: 0,
        },
      ],
    };

    expect(buildFallbackReport(summary)).toContain('ORD\\|001');
  });
});
