/** Заглушка. Экран управления демо с телефона — сессия 4. */
export function DemoPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-medium">Демо</h1>
      <p className="text-center text-sm text-muted-foreground">
        Кнопки «Создать заявки» и «Сброс» появятся здесь.
      </p>
    </div>
  );
}
