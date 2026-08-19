import { ReportService } from './report.service';

describe('ReportService stub', () => {
  it('returns a stable mock report for the Backend-2 seam', async () => {
    const result = await new ReportService().generate({
      tripCode: 'TRIP-001',
      hubName: 'Актау',
      stopOrder: ['Актау', 'Шетпе', 'Актау'],
      totalDistanceKm: 220,
      soloDistanceKm: 240,
      savedDistanceKm: 20,
      savedCostKzt: 3570,
      totalWeightKg: 520,
      costPerKmKzt: 178.5,
      orders: [],
    });

    expect(result.source).toBe('mock');
    expect(result.raw).toBeNull();
    expect(result.contentMd).toContain('TRIP-001');
  });
});
