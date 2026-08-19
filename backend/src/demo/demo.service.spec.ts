import { OrdersService } from '../orders/orders.service';
import { SupabaseService } from '../supabase/supabase.service';
import { DemoService } from './demo.service';

describe('DemoService', () => {
  it('can reset the demo three times in dependency-safe table order', async () => {
    const deletionOrder: string[] = [];
    const client = {
      from: jest.fn((table: string) => ({
        delete: () => ({
          neq: async () => {
            deletionOrder.push(table);
            return { error: null };
          },
        }),
      })),
    };
    const service = new DemoService(
      {} as OrdersService,
      { client } as unknown as SupabaseService,
    );

    await service.reset();
    await service.reset();
    await service.reset();

    expect(deletionOrder).toEqual(
      Array.from({ length: 3 }, () => [
        'trip_orders',
        'reports',
        'trips',
        'orders',
      ]).flat(),
    );
  });
});
