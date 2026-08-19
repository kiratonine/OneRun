import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { RESET_CONFIRM_TIMEOUT_MS } from '@/config/constants';

interface ResetButtonProps {
  onReset: () => void;
  isResetting?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Сброс в два касания. Промах по этой кнопке посреди питча стирает всё, что показали,
 * поэтому первое нажатие только взводит подтверждение, а через
 * RESET_CONFIRM_TIMEOUT_MS оно само снимается — забытая взведённая кнопка опаснее лишнего тапа.
 */
export function ResetButton({ onReset, isResetting, disabled, className }: ResetButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => setIsConfirming(false), RESET_CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  return (
    <Button
      variant={isConfirming ? 'destructive' : 'outline'}
      className={className}
      disabled={isResetting || disabled}
      onClick={() => {
        if (!isConfirming) {
          setIsConfirming(true);
          return;
        }
        setIsConfirming(false);
        onReset();
      }}
    >
      {isResetting ? 'Сбрасываем…' : isConfirming ? 'Точно сбросить?' : 'Сброс'}
    </Button>
  );
}
