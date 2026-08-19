import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OrderResponse } from '../orders/order.types';
import { OrdersService } from '../orders/orders.service';
import { SupabaseService } from '../supabase/supabase.service';
import { DEMO_ORDERS } from './demo-orders';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class DemoService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly supabase: SupabaseService,
  ) {}

  async seedNext(): Promise<OrderResponse | null> {
    const currentCount = await this.ordersService.countAll();
    const nextOrder = DEMO_ORDERS[currentCount];

    return nextOrder ? this.ordersService.create(nextOrder) : null;
  }

  async reset(): Promise<{ ok: true }> {
    const deletions = [
      this.supabase.client
        .from('trip_orders')
        .delete()
        .neq('trip_id', ZERO_UUID),
      this.supabase.client.from('reports').delete().neq('trip_id', ZERO_UUID),
    ];

    for (const deletion of deletions) {
      const { error } = await deletion;
      if (error) {
        throw new InternalServerErrorException(error.message);
      }
    }

    for (const table of ['trips', 'orders'] as const) {
      const { error } = await this.supabase.client
        .from(table)
        .delete()
        .neq('id', ZERO_UUID);
      if (error) {
        throw new InternalServerErrorException(error.message);
      }
    }

    return { ok: true };
  }
}
