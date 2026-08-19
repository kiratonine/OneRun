import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatKg, formatKzt, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Order, Trip } from '@/api/types';

const STATUS_LABELS: Record<Order['status'], string> = {
  new: 'Новая',
  pooled: 'В пуле',
  routed: 'В рейсе',
};

interface OrdersTableProps {
  orders: Order[];
  /** Рейс построен: добавляются колонки очереди выгрузки и стоимости. */
  trip?: Trip;
  onSelectOrder: (orderCode: string) => void;
}

export function OrdersTable({ orders, trip, onSelectOrder }: OrdersTableProps) {
  const lineByCode = new Map(trip?.orders.map((line) => [line.orderCode, line]) ?? []);

  // После построения рейса порядок строк = порядок выгрузки: таблица начинает
  // читаться как маршрутный лист водителя, а не как журнал приёма заявок.
  const rows = trip
    ? [...orders].sort(
        (a, b) =>
          (lineByCode.get(a.code)?.dropIndex ?? Infinity) -
          (lineByCode.get(b.code)?.dropIndex ?? Infinity),
      )
    : orders;

  const totalWeightKg = orders.reduce((sum, order) => sum + order.weightKg, 0);
  const totalCostKzt = trip?.orders.reduce((sum, line) => sum + line.priceKzt, 0) ?? 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Заявка</TableHead>
          <TableHead>Откуда</TableHead>
          <TableHead>Куда</TableHead>
          <TableHead>Груз</TableHead>
          <TableHead className="text-right">Вес</TableHead>
          <TableHead className="text-right">Мест</TableHead>
          <TableHead>Статус</TableHead>
          {trip && <TableHead className="text-right">Выгрузка</TableHead>}
          {trip && <TableHead className="text-right">Стоимость</TableHead>}
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((order) => {
          const line = lineByCode.get(order.code);
          return (
            <TableRow
              key={order.id}
              className="cursor-pointer"
              onClick={() => onSelectOrder(order.code)}
            >
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: order.color }}
                  />
                  {order.code}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{order.from.nameRu}</TableCell>
              <TableCell className="font-medium">{order.to.nameRu}</TableCell>
              <TableCell className="max-w-48 truncate">{order.cargoName}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatKg(order.weightKg)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {order.boxesCount === null ? '—' : formatNumber(order.boxesCount)}
              </TableCell>
              <TableCell>
                <Badge variant={order.status === 'routed' ? 'default' : 'secondary'}>
                  {STATUS_LABELS[order.status]}
                </Badge>
              </TableCell>
              {trip && (
                <TableCell className={cn('text-right tabular-nums', !line && 'text-muted-foreground')}>
                  {line ? `${line.dropIndex}-я` : '—'}
                </TableCell>
              )}
              {trip && (
                <TableCell className="text-right font-medium tabular-nums">
                  {line ? formatKzt(line.priceKzt) : '—'}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Итого</TableCell>
          <TableCell className="text-right tabular-nums">{formatKg(totalWeightKg)}</TableCell>
          <TableCell colSpan={trip ? 3 : 2} />
          {trip && (
            <TableCell className="text-right tabular-nums">{formatKzt(totalCostKzt)}</TableCell>
          )}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
