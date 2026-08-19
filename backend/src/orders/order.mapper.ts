import { mapSettlement } from '../settlements/settlement.mapper';
import { OrderResponse, OrderRow } from './order.types';

export function mapOrder(row: OrderRow): OrderResponse {
  return {
    id: row.id,
    code: row.code,
    from: mapSettlement(row.from),
    to: mapSettlement(row.to),
    shipperName: row.shipper_name,
    cargoName: row.cargo_name,
    weightKg: Number(row.weight_kg),
    boxesCount: row.boxes_count,
    boxNote: row.box_note,
    color: row.color,
    status: row.status,
    createdAt: row.created_at,
  };
}
