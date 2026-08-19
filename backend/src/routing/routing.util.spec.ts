import { haversineDistanceKm, orderByOptimalRoundTrip } from './routing.util';
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

  it('finds the shortest round trip instead of a nearest-neighbour route', () => {
    const destinations: RoutingPoint[] = [
      { code: 'AKSHUKUR', nameRu: 'Акшукур', lat: 43.7831766, lon: 51.0605022 },
      { code: 'SHETPE', nameRu: 'Шетпе', lat: 44.1413139, lon: 52.1556413 },
      { code: 'BEINEU', nameRu: 'Бейнеу', lat: 45.321377, lon: 55.186226 },
      {
        code: 'ZHANAOZEN',
        nameRu: 'Жанаозен',
        lat: 43.3381034,
        lon: 52.8556219,
      },
      { code: 'KURYK', nameRu: 'Курык', lat: 43.176664, lon: 51.6796799 },
      { code: 'ZHETYBAI', nameRu: 'Жетыбай', lat: 43.5883652, lon: 52.1014626 },
    ];
    const roadDistancesKm = [
      [0, 23.7849, 162.8498, 469.4915, 150.6796, 71.0197, 93.3621],
      [23.6307, 0, 142.2331, 481.9469, 163.135, 91.2267, 105.8175],
      [162.7613, 138.9124, 0, 311.7871, 146.0157, 142.5839, 68.4636],
      [469.5325, 449.7754, 311.6871, 0, 452.7869, 449.3551, 375.2348],
      [150.2069, 162.8164, 145.35, 451.9917, 0, 130.0417, 75.8623],
      [70.7961, 91.2511, 142.6008, 449.2424, 130.437, 0, 73.1131],
      [93.2907, 105.9002, 68.4807, 375.1224, 76.5451, 73.1133, 0],
    ];

    expect(
      orderByOptimalRoundTrip(hub, destinations, roadDistancesKm).map(
        ({ code }) => code,
      ),
    ).toEqual([
      'KURYK',
      'ZHANAOZEN',
      'ZHETYBAI',
      'BEINEU',
      'SHETPE',
      'AKSHUKUR',
    ]);
  });
});
