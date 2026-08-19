import { COST_PER_KM_KZT } from '../config/constants';
import { OrderResponse } from '../orders/order.types';
import { OrdersService } from '../orders/orders.service';
import { PricingService } from '../pricing/pricing.service';
import { ReportService } from '../report/report.service';
import { RoutingService } from '../routing/routing.service';
import { SettlementsService } from '../settlements/settlements.service';
import { SupabaseService } from '../supabase/supabase.service';
import { TripsService } from './trips.service';

describe('TripsService', () => {
  it('persists a complete trip and serves cached reads without external calls', async () => {
    const hub = {
      id: 1,
      code: 'AKTAU',
      nameRu: 'Актау',
      nameKz: 'Ақтау',
      district: 'Актау',
      lat: 43.63,
      lon: 51.16,
    };
    const destinations = [
      {
        id: 2,
        code: 'SHETPE',
        nameRu: 'Шетпе',
        nameKz: 'Шетпе',
        district: 'Мангистауский район',
        lat: 44.14,
        lon: 52.15,
      },
      {
        id: 3,
        code: 'BEINEU',
        nameRu: 'Бейнеу',
        nameKz: 'Бейнеу',
        district: 'Бейнеуский район',
        lat: 45.32,
        lon: 55.18,
      },
    ];
    const orders: OrderResponse[] = destinations.map((to, index) => ({
      id: `00000000-0000-0000-0000-00000000000${index + 1}`,
      code: `ORD-00${index + 1}`,
      from: hub,
      to,
      shipperName: `Shipper ${index + 1}`,
      cargoName: `Cargo ${index + 1}`,
      weightKg: 260,
      boxesCount: 1,
      boxNote: null,
      color: '#ef4444',
      status: 'new',
      createdAt: '2026-08-19T00:00:00.000Z',
    }));
    const route = {
      stopOrder: ['AKTAU', 'SHETPE', 'BEINEU', 'AKTAU'],
      orderedDestinations: destinations.map(({ code, nameRu, lat, lon }) => ({
        code,
        nameRu,
        lat,
        lon,
      })),
      routeGeometry: {
        type: 'LineString' as const,
        coordinates: [
          [51.16, 43.63] as [number, number],
          [52.15, 44.14] as [number, number],
          [55.18, 45.32] as [number, number],
          [51.16, 43.63] as [number, number],
        ],
      },
      totalDistanceKm: 800,
      distanceFromHubKm: { SHETPE: 100, BEINEU: 500 },
      source: 'ors' as const,
    };
    const pricedOrders = [
      {
        orderId: orders[0].id,
        weightKg: 260,
        legDistanceKm: 100,
        dropIndex: 1,
        loadPosition: 1,
        priceKzt: 30_000,
      },
      {
        orderId: orders[1].id,
        weightKg: 260,
        legDistanceKm: 500,
        dropIndex: 2,
        loadPosition: 2,
        priceKzt: 112_800,
      },
    ];
    const persistedTrip = {
      id: '11111111-1111-4111-8111-111111111111',
      code: 'TRIP-001',
      stop_order: route.stopOrder,
      route_geometry: route.routeGeometry,
      total_distance_km: 800,
      solo_distance_km: 1200,
      saved_distance_km: 400,
      saved_cost_kzt: 71_400,
      total_weight_kg: 520,
    };
    const persistedTripOrders = pricedOrders.map((order, index) => ({
      price_kzt: order.priceKzt,
      load_position: order.loadPosition,
      drop_index: order.dropIndex,
      leg_distance_km: order.legDistanceKm,
      order: { code: orders[index].code },
    }));
    const rpc = jest.fn().mockResolvedValue({ error: null });
    const client = {
      rpc,
      from: jest.fn((table: string) => ({
        select: jest.fn(
          (_columns: string, options?: { count?: string; head?: boolean }) => {
            if (table === 'trips' && options?.head) {
              return Promise.resolve({ count: 0, error: null });
            }
            if (table === 'trips') {
              return {
                eq: () => ({
                  maybeSingle: async () => ({
                    data: persistedTrip,
                    error: null,
                  }),
                }),
              };
            }
            if (table === 'trip_orders') {
              return {
                eq: () => ({
                  order: async () => ({
                    data: persistedTripOrders,
                    error: null,
                  }),
                }),
              };
            }
            if (table === 'reports') {
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => ({
                        data: { content_md: '## Отчёт', source: 'mock' },
                        error: null,
                      }),
                    }),
                  }),
                }),
              };
            }
            throw new Error(`Unexpected table ${table}`);
          },
        ),
      })),
    };
    const ordersService = {
      findNew: jest.fn().mockResolvedValue(orders),
    };
    const settlementsService = {
      findByCode: jest.fn().mockResolvedValue(hub),
    };
    const routingService = {
      buildRoute: jest.fn().mockResolvedValue(route),
    };
    const pricingService = {
      calculate: jest.fn().mockReturnValue({
        orders: pricedOrders,
        totalCostKzt: 142_800,
        soloDistanceKm: 1200,
        savedDistanceKm: 400,
        savedCostKzt: 71_400,
      }),
    };
    const reportService = {
      generate: jest.fn().mockResolvedValue({
        contentMd: '## Отчёт',
        raw: null,
        source: 'mock',
      }),
    };
    const service = new TripsService(
      { client } as unknown as SupabaseService,
      ordersService as unknown as OrdersService,
      settlementsService as unknown as SettlementsService,
      routingService as unknown as RoutingService,
      pricingService as unknown as PricingService,
      reportService as unknown as ReportService,
    );

    const created = await service.create();
    const cached = await service.findById(created.id);

    expect(created.code).toBe('TRIP-001');
    expect(created.orders).toHaveLength(2);
    expect(cached).toEqual(created);
    expect(routingService.buildRoute).toHaveBeenCalledTimes(1);
    expect(routingService.buildRoute).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'AKTAU' }),
      [
        expect.objectContaining({
          code: 'SHETPE',
          deliveryWeightKg: 260,
        }),
        expect.objectContaining({
          code: 'BEINEU',
          deliveryWeightKg: 260,
        }),
      ],
    );
    expect(reportService.generate).toHaveBeenCalledTimes(1);
    expect(pricingService.calculate).toHaveBeenCalledWith(800, [
      {
        orderId: orders[0].id,
        weightKg: 260,
        legDistanceKm: 100,
        dropIndex: 1,
      },
      {
        orderId: orders[1].id,
        weightKg: 260,
        legDistanceKm: 500,
        dropIndex: 2,
      },
    ]);
    expect(reportService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        tripCode: 'TRIP-001',
        totalWeightKg: 520,
        costPerKmKzt: COST_PER_KM_KZT,
      }),
    );
    expect(rpc).toHaveBeenCalledWith(
      'persist_trip',
      expect.objectContaining({
        p_order_ids: orders.map(({ id }) => id),
      }),
    );
  });
});
