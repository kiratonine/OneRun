import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ORDER_LINE_COLORS } from '../config/constants';
import { SettlementRow } from '../settlements/settlement.types';
import { SupabaseService } from '../supabase/supabase.service';
import { mapOrder } from './order.mapper';
import { CreateOrderDto, OrderResponse, OrderRow } from './order.types';

const ORDER_SELECT = `
  id,
  code,
  shipper_name,
  cargo_name,
  weight_kg,
  boxes_count,
  box_note,
  color,
  status,
  created_at,
  from:settlements!orders_from_id_fkey(*),
  to:settlements!orders_to_id_fkey(*)
`;

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(): Promise<OrderResponse[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at');

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
  }

  async findNew(): Promise<OrderResponse[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(ORDER_SELECT)
      .eq('status', 'new')
      .order('created_at');

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
  }

  async countAll(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return count ?? 0;
  }

  async create(input: CreateOrderDto): Promise<OrderResponse> {
    const [from, to, orderCount] = await Promise.all([
      this.findSettlement(input.fromCode),
      this.findSettlement(input.toCode),
      this.countAll(),
    ]);
    const code = `ORD-${String(orderCount + 1).padStart(3, '0')}`;
    const color = ORDER_LINE_COLORS[orderCount % ORDER_LINE_COLORS.length];

    const { data, error } = await this.supabase.client
      .from('orders')
      .insert({
        code,
        from_id: from.id,
        to_id: to.id,
        shipper_name: input.shipperName,
        cargo_name: input.cargoName,
        weight_kg: input.weightKg,
        boxes_count: input.boxesCount ?? null,
        box_note: input.boxNote ?? null,
        color,
      })
      .select(ORDER_SELECT)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        error?.message ?? 'Order insert returned no data',
      );
    }

    return mapOrder(data as unknown as OrderRow);
  }

  private async findSettlement(code: string): Promise<SettlementRow> {
    const { data, error } = await this.supabase.client
      .from('settlements')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Settlement ${code} not found`);
    }

    return data as SettlementRow;
  }
}
