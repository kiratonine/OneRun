import {
  SettlementResponse,
  SettlementRow,
} from '../settlements/settlement.types';

export type OrderStatus = 'new' | 'pooled' | 'routed';

export interface CreateOrderDto {
  fromCode: string;
  toCode: string;
  shipperName: string;
  cargoName: string;
  weightKg: number;
  boxesCount?: number | null;
  boxNote?: string | null;
}

export interface OrderRow {
  id: string;
  code: string;
  shipper_name: string;
  cargo_name: string;
  weight_kg: number;
  boxes_count: number | null;
  box_note: string | null;
  color: string;
  status: OrderStatus;
  created_at: string;
  from: SettlementRow;
  to: SettlementRow;
}

export interface OrderResponse {
  id: string;
  code: string;
  from: SettlementResponse;
  to: SettlementResponse;
  shipperName: string;
  cargoName: string;
  weightKg: number;
  boxesCount: number | null;
  boxNote: string | null;
  color: string;
  status: OrderStatus;
  createdAt: string;
}
