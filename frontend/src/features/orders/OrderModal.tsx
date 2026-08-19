import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatKg, formatKm, formatKzt, formatNumber } from '@/lib/format';
import type { Order, TripOrderLine } from '@/api/types';

const STATUS_LABELS: Record<Order['status'], string> = {
  new: 'Новая',
  pooled: 'В пуле',
  routed: 'В рейсе',
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

interface OrderModalProps {
  /** null закрывает модалку — открытость выводится из наличия заявки. */
  order: Order | null;
  /** Строка рейса по этой заявке. Появляется только после построения рейса. */
  tripLine?: TripOrderLine | null;
  onClose: () => void;
}

export function OrderModal({ order, tripLine, onClose }: OrderModalProps) {
  return (
    <Dialog
      open={Boolean(order)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {order && (
          <>
            <DialogHeader>
              {/* pr-8 — место под крестик закрытия, он абсолютный в правом верхнем углу. */}
              <DialogTitle className="flex items-center gap-2 pr-8">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: order.color }}
                />
                {order.code}
                <Badge variant="secondary" className="ml-auto">
                  {STATUS_LABELS[order.status]}
                </Badge>
              </DialogTitle>
              <DialogDescription>{order.shipperName}</DialogDescription>
            </DialogHeader>

            <dl className="divide-y text-sm">
              <Row label="Маршрут">
                <span className="font-medium">{order.from.nameRu}</span>
                <span className="mx-1.5 text-muted-foreground">→</span>
                <span className="font-medium">{order.to.nameRu}</span>
                {order.to.district && (
                  <span className="ml-1.5 text-muted-foreground">
                    ({order.to.district} р-н)
                  </span>
                )}
              </Row>

              <Row label="Груз">{order.cargoName}</Row>

              <Row label="Вес">
                <span className="font-medium tabular-nums">{formatKg(order.weightKg)}</span>
              </Row>

              {order.boxesCount !== null && (
                <Row label="Мест">
                  <span className="tabular-nums">{formatNumber(order.boxesCount)}</span>
                </Row>
              )}

              {order.boxNote && <Row label="Габариты">{order.boxNote}</Row>}
            </dl>

            {tripLine && (
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  В сводном рейсе
                </p>
                <dl className="divide-y text-sm">
                  <Row label="Выгрузка">
                    <span className="tabular-nums">{tripLine.dropIndex}-я остановка</span>
                  </Row>
                  <Row label="Погрузка">
                    <span className="tabular-nums">место {tripLine.loadPosition}</span>
                  </Row>
                  <Row label="Плечо">
                    <span className="tabular-nums">{formatKm(tripLine.legDistanceKm)}</span>
                  </Row>
                  <Row label="Стоимость">
                    <span className="font-medium tabular-nums">
                      {formatKzt(tripLine.priceKzt)}
                    </span>
                  </Row>
                </dl>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
