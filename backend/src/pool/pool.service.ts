import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { POOL_WEIGHT_THRESHOLD_KG } from '../config/constants';
import { SupabaseService } from '../supabase/supabase.service';

export interface PoolStatus {
  totalWeightKg: number;
  ordersCount: number;
  thresholdKg: number;
  isReady: boolean;
}

export function calculatePoolStatus(weights: number[]): PoolStatus {
  const totalWeightKg = weights.reduce((sum, weight) => sum + weight, 0);

  return {
    totalWeightKg,
    ordersCount: weights.length,
    thresholdKg: POOL_WEIGHT_THRESHOLD_KG,
    isReady: totalWeightKg >= POOL_WEIGHT_THRESHOLD_KG,
  };
}

@Injectable()
export class PoolService {
  constructor(private readonly supabase: SupabaseService) {}

  async getStatus(): Promise<PoolStatus> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('weight_kg')
      .eq('status', 'new');

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return calculatePoolStatus(
      (data ?? []).map((row) => Number(row.weight_kg)),
    );
  }
}
