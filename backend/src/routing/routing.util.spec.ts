import { haversineDistanceKm, orderByNearestNeighbour } from './routing.util';
import { RoutingPoint } from './routing.types';

const hub: RoutingPoint = {
  code: 'AKTAU',
  nameRu: 'Актау',
  lat: 43.6353364,
  lon: 51.168222,
};

describe('routing utilities', () => {
  it('calculates a plausible straight-line distance', () => {
    const distance = haversineDistanceKm(hub, {
      lat: 44.1413139,
      lon: 52.1556413,
    });

    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });

  it('orders destinations from the nearest current point', () => {
    const destinations: RoutingPoint[] = [
      { code: 'FAR', nameRu: 'Дальняя', lat: 45, lon: 53 },
      { code: 'NEAR', nameRu: 'Ближняя', lat: 43.7, lon: 51.2 },
      { code: 'MIDDLE', nameRu: 'Средняя', lat: 44, lon: 52 },
    ];

    expect(
      orderByNearestNeighbour(hub, destinations).map(({ code }) => code),
    ).toEqual(['NEAR', 'MIDDLE', 'FAR']);
  });
});
