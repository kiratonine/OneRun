import {
  haversineDistanceKm,
  orderByLowestOperatingCost,
} from './routing.util';
import { RoutingDestination, RoutingPoint } from './routing.types';

const hub: RoutingPoint = {
  code: 'AKTAU',
  nameRu: 'Aktau',
  lat: 43.6353364,
  lon: 51.168222,
};

const destinations: RoutingDestination[] = [
  {
    code: 'AKSHUKUR',
    nameRu: 'Akshukur',
    lat: 43.7831766,
    lon: 51.0605022,
    deliveryWeightKg: 80,
  },
  {
    code: 'SHETPE',
    nameRu: 'Shetpe',
    lat: 44.1413139,
    lon: 52.1556413,
    deliveryWeightKg: 120,
  },
  {
    code: 'BEINEU',
    nameRu: 'Beineu',
    lat: 45.321377,
    lon: 55.186226,
    deliveryWeightKg: 140,
  },
  {
    code: 'ZHANAOZEN',
    nameRu: 'Zhanaozen',
    lat: 43.3381034,
    lon: 52.8556219,
    deliveryWeightKg: 110,
  },
  {
    code: 'KURYK',
    nameRu: 'Kuryk',
    lat: 43.176664,
    lon: 51.6796799,
    deliveryWeightKg: 95,
  },
  {
    code: 'ZHETYBAI',
    nameRu: 'Zhetybai',
    lat: 43.5883652,
    lon: 52.1014626,
    deliveryWeightKg: 60,
  },
];

const roadDistancesKm = [
  [0, 23.77, 163.03, 469.2, 150.7, 70.98, 93.53],
  [23.44, 0, 175.12, 481.3, 162.79, 91.18, 105.62],
  [162.93, 175.19, 0, 311.32, 145.88, 142.56, 68.47],
  [469.35, 481.6, 311.33, 0, 452.29, 448.98, 374.89],
  [150.22, 162.47, 145.21, 451.39, 0, 129.86, 75.72],
  [70.75, 91.21, 142.58, 448.75, 130.26, 0, 73.08],
  [93.46, 105.71, 68.49, 374.67, 76.4, 73.08, 0],
];

describe('routing utilities', () => {
  it('calculates a plausible straight-line distance', () => {
    const distance = haversineDistanceKm(hub, {
      lat: 44.1413139,
      lon: 52.1556413,
    });

    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });

  it('chooses the shortest route when carrying weight has no cost', () => {
    expect(
      orderByLowestOperatingCost(hub, destinations, roadDistancesKm, {
        costPerKmKzt: 178.5,
        loadCostPerTonneKmKzt: 0,
      }).map(({ code }) => code),
    ).toEqual([
      'AKSHUKUR',
      'ZHANAOZEN',
      'BEINEU',
      'SHETPE',
      'ZHETYBAI',
      'KURYK',
    ]);
  });

  it('keeps a light nearby delivery for the return leg when that costs less overall', () => {
    expect(
      orderByLowestOperatingCost(hub, destinations, roadDistancesKm).map(
        ({ code }) => code,
      ),
    ).toEqual([
      'KURYK',
      'ZHANAOZEN',
      'ZHETYBAI',
      'SHETPE',
      'BEINEU',
      'AKSHUKUR',
    ]);
  });
});
