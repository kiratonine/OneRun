import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { mapSettlement } from './settlement.mapper';
import { SettlementResponse, SettlementRow } from './settlement.types';

@Injectable()
export class SettlementsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(): Promise<SettlementResponse[]> {
    const { data, error } = await this.supabase.client
      .from('settlements')
      .select('*')
      .order('name_ru');

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return ((data ?? []) as SettlementRow[]).map(mapSettlement);
  }

  async findByCode(code: string): Promise<SettlementResponse> {
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

    return mapSettlement(data as SettlementRow);
  }
}
