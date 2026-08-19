import axios from 'axios';
import { RoutingService } from './routing.service';

describe('RoutingService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns deterministic straight-line geometry when ORS is unavailable', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('ORS unavailable'));
    const service = new RoutingService();

    const result = await service.buildRoute(
      { code: 'AKTAU', nameRu: 'Актау', lat: 43.6353364, lon: 51.168222 },
      [
        {
          code: 'SHETPE',
          nameRu: 'Шетпе',
          lat: 44.1413139,
          lon: 52.1556413,
        },
      ],
    );

    expect(result.source).toBe('fallback');
    expect(result.stopOrder).toEqual(['AKTAU', 'SHETPE', 'AKTAU']);
    expect(result.routeGeometry).toEqual({
      type: 'LineString',
      coordinates: [
        [51.168222, 43.6353364],
        [52.1556413, 44.1413139],
        [51.168222, 43.6353364],
      ],
    });
    expect(result.totalDistanceKm).toBeGreaterThan(200);
    expect(result.distanceFromHubKm.SHETPE).toBeGreaterThan(100);
  });
});
