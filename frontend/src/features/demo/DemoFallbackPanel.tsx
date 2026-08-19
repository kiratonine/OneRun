import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { usePool } from '@/api/queries';
import { formatKg, formatNumber } from '@/lib/format';
import { DEMO_FALLBACK_HOTKEY_CODE } from '@/config/constants';
import { useDemoSeeder } from './useDemoSeeder';
import { ResetButton } from './ResetButton';

/**
 * Резервный пульт демо прямо на экране ноутбука. Основной сценарий — телефон
 * и роут `/demo`, но если на площадке не будет вайфая или сядет телефон, показ
 * не должен встать. Панель по умолчанию скрыта: судьи видят карту, а не наши кнопки.
 *
 * Открывается Ctrl+Shift+X — это единственное, что ведущему нужно помнить.
 */
export function DemoFallbackPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { sentCount, totalCount, isSeeding, isResetting, isExhausted, error, seedAll, reset } =
    useDemoSeeder();
  const { data: pool } = usePool();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey || event.altKey) return;
      if (event.code !== DEMO_FALLBACK_HOTKEY_CODE) return;
      event.preventDefault();
      setIsOpen((open) => !open);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 bottom-10 z-10 w-72 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Резервный пульт</span>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsOpen(false)}
        >
          скрыть
        </button>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        То же, что на телефоне. Ctrl+Shift+X закрывает.
      </p>

      <div className="mt-3 flex items-baseline gap-2 tabular-nums">
        <span className="text-2xl font-semibold">{formatNumber(sentCount)}</span>
        <span className="text-sm text-muted-foreground">из {totalCount} отправлено</span>
      </div>

      {pool && (
        <div className="mt-1 text-xs text-muted-foreground tabular-nums">
          В пуле: {formatNumber(pool.totalWeightKg)} / {formatKg(pool.thresholdKg)}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {isExhausted && !error && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          Набор исчерпан — нужен сброс.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <Button onClick={() => void seedAll()} disabled={isSeeding || isResetting}>
          {isSeeding ? `Создаём… ${sentCount} из ${totalCount}` : 'Создать заявки'}
        </Button>
        <ResetButton onReset={() => void reset()} isResetting={isResetting} />
      </div>

      <Link
        to="/health"
        className="mt-3 block text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Диагностика бэкенда
      </Link>
    </div>
  );
}
