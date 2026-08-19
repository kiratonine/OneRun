/**
 * Тонкая обёртка над fetch. При USE_MOCK_API запросы не уходят в сеть —
 * их обслуживает локальное хранилище ниже, повторяющее поведение бэкенда.
 */

import { API_BASE_URL, MOCK_LATENCY_MS, USE_MOCK_API } from '@/config/constants';
import {
  buildMockPool,
  buildMockTrip,
  mockOrders,
  mockSettlements,
} from './mock-data';
import type { CreateOrderPayload, Order, PoolStatus, Settlement, Trip } from './types';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(`${init?.method ?? 'GET'} ${path} → ${response.status}`, response.status);
  }

  // 204 приходит от /demo/seed, когда набор заявок исчерпан.
  if (response.status === 204) return null as T;

  return (await response.json()) as T;
}

// --- Локальное хранилище мока -------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockStore = {
  orders: [...mockOrders],
  trip: null as Trip | null,
};

/** Сколько заявок демо-набора уже создано. */
function seededCount(): number {
  return mockStore.orders.length;
}

const mockHandlers = {
  settlements: (): Settlement[] => mockSettlements,

  orders: (): Order[] => mockStore.orders,

  pool: (): PoolStatus => buildMockPool(mockStore.orders),

  createOrder: (payload: CreateOrderPayload): Order => {
    const from = mockSettlements.find((s) => s.code === payload.fromCode);
    const to = mockSettlements.find((s) => s.code === payload.toCode);
    if (!from || !to) throw new ApiError('Неизвестный код посёлка', 400);

    const index = mockStore.orders.length;
    const order: Order = {
      id: `mock-order-${index + 1}`,
      code: `ORD-${String(index + 1).padStart(3, '0')}`,
      from,
      to,
      shipperName: payload.shipperName,
      cargoName: payload.cargoName,
      weightKg: payload.weightKg,
      boxesCount: payload.boxesCount ?? null,
      boxNote: payload.boxNote ?? null,
      color: mockOrders[index % mockOrders.length].color,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    mockStore.orders = [...mockStore.orders, order];
    return order;
  },

  seed: (): Order | null => {
    const next = mockOrders[seededCount()];
    if (!next) return null; // соответствует 204 от бэкенда
    mockStore.orders = [...mockStore.orders, next];
    return next;
  },

  reset: (): { ok: true } => {
    mockStore.orders = [];
    mockStore.trip = null;
    return { ok: true };
  },

  createTrip: (): Trip => {
    const trip = buildMockTrip(mockStore.orders);
    mockStore.trip = trip;
    mockStore.orders = mockStore.orders.map((order) => ({ ...order, status: 'routed' }));
    return trip;
  },

  getTrip: (id: string): Trip => {
    if (!mockStore.trip || mockStore.trip.id !== id) {
      throw new ApiError(`Рейс ${id} не найден`, 404);
    }
    return mockStore.trip;
  },
};

async function mocked<T>(produce: () => T): Promise<T> {
  await sleep(MOCK_LATENCY_MS);
  return produce();
}

// --- Публичное API ------------------------------------------------------------

export const api = {
  getSettlements: (): Promise<Settlement[]> =>
    USE_MOCK_API ? mocked(mockHandlers.settlements) : request('/settlements'),

  getOrders: (): Promise<Order[]> =>
    USE_MOCK_API ? mocked(mockHandlers.orders) : request('/orders'),

  getPool: (): Promise<PoolStatus> =>
    USE_MOCK_API ? mocked(mockHandlers.pool) : request('/pool'),

  createOrder: (payload: CreateOrderPayload): Promise<Order> =>
    USE_MOCK_API
      ? mocked(() => mockHandlers.createOrder(payload))
      : request('/orders', { method: 'POST', body: JSON.stringify(payload) }),

  /** null означает «набор исчерпан» — бэкенд отдаёт на это 204. */
  seedDemoOrder: (): Promise<Order | null> =>
    USE_MOCK_API ? mocked(mockHandlers.seed) : request('/demo/seed', { method: 'POST' }),

  resetDemo: (): Promise<{ ok: true }> =>
    USE_MOCK_API ? mocked(mockHandlers.reset) : request('/demo/reset', { method: 'POST' }),

  createTrip: (): Promise<Trip> =>
    USE_MOCK_API ? mocked(mockHandlers.createTrip) : request('/trips', { method: 'POST' }),

  getTrip: (id: string): Promise<Trip> =>
    USE_MOCK_API ? mocked(() => mockHandlers.getTrip(id)) : request(`/trips/${id}`),
};
