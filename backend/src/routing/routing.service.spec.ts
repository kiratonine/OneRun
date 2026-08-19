import axios from 'axios';
import { RoutingService } from './routing.service';
import { RoutingDestination, RoutingPoint } from './routing.types';

const hub: RoutingPoint = {
  code: 'AKTAU',
  nameRu: 'Актау',
  lat: 43.6353364,
  lon: 51.168222,
};

describe('RoutingService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns deterministic straight-line geometry when ORS is unavailable', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('ORS unavailable'));
    const service = new RoutingService();

    const result = await service.buildRoute(hub, [
      {
        code: 'SHETPE',
        nameRu: 'Шетпе',
        lat: 44.1413139,
        lon: 52.1556413,
        deliveryWeightKg: 520,
        deliveryOrderCount: 1,
      },
    ]);

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

  it('uses the ORS distance matrix to choose the lowest-cost round trip', async () => {
    const post = jest.spyOn(axios, 'post').mockImplementation((url, body) => {
      if (String(url).includes('/matrix/')) {
        return Promise.resolve({
          data: {
            distances: [
              [0, 1, 2, 50],
              [1, 0, 100, 1],
              [2, 1, 0, 1],
              [50, 1, 1, 0],
            ],
          },
        });
      }

      const coordinates = (body as { coordinates: [number, number][] })
        .coordinates;
      return Promise.resolve({
        data: {
          features: [
            {
              geometry: { type: 'LineString', coordinates },
              properties: { summary: { distance: 1000 } },
            },
          ],
        },
      });
    });
    const service = new RoutingService();
    const destinations: RoutingDestination[] = [
      {
        code: 'A',
        nameRu: 'A',
        lat: 43.7,
        lon: 51.2,
        deliveryWeightKg: 0,
        deliveryOrderCount: 1,
      },
      {
        code: 'B',
        nameRu: 'B',
        lat: 43.8,
        lon: 51.3,
        deliveryWeightKg: 0,
        deliveryOrderCount: 1,
      },
      {
        code: 'C',
        nameRu: 'C',
        lat: 43.9,
        lon: 51.4,
        deliveryWeightKg: 0,
        deliveryOrderCount: 1,
      },
    ];

    const result = await service.buildRoute(hub, destinations);

    expect(result.stopOrder).toEqual(['AKTAU', 'A', 'C', 'B', 'AKTAU']);
    expect(post.mock.calls[0][0]).toContain('/matrix/driving-hgv');
    expect(post.mock.calls[0][1]).toEqual({
      locations: [
        [51.168222, 43.6353364],
        [51.2, 43.7],
        [51.3, 43.8],
        [51.4, 43.9],
      ],
      metrics: ['distance'],
      units: 'km',
    });
  });
});
