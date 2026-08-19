import { mapTrip } from './trip.mapper';

describe('mapTrip', () => {
  it('maps persisted records to the public Trip contract', () => {
    const result = mapTrip(
      {
        id: 'trip-id',
        code: 'TRIP-001',
        stop_order: ['AKTAU', 'SHETPE', 'AKTAU'],
        route_geometry: {
          type: 'LineString',
          coordinates: [
            [51.16, 43.63],
            [52.15, 44.14],
          ],
        },
        total_distance_km: 220,
        solo_distance_km: 240,
        saved_distance_km: 20,
        saved_cost_kzt: 3570,
        total_weight_kg: 120,
      },
      [
        {
          price_kzt: 39270,
          load_position: 1,
          drop_index: 1,
          leg_distance_km: 100,
          order: { code: 'ORD-001' },
        },
      ],
      { content_md: '## Отчёт', source: 'mock' },
    );

    expect(result.code).toBe('TRIP-001');
    expect(result.routeGeometry.coordinates[0]).toEqual([51.16, 43.63]);
    expect(result.orders[0]).toEqual({
      orderCode: 'ORD-001',
      dropIndex: 1,
      loadPosition: 1,
      priceKzt: 39270,
      legDistanceKm: 100,
    });
    expect(result.reportSource).toBe('mock');
  });
});
