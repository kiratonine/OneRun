import { NavLink, Route, Routes } from 'react-router-dom';

import { MapPage } from '@/routes/MapPage';
import { OrdersPage } from '@/routes/OrdersPage';
import { ReportPage } from '@/routes/ReportPage';
import { DemoPage } from '@/routes/DemoPage';
import { HealthPage } from '@/routes/HealthPage';
import { LandingPage } from '@/routes/LandingPage';
import { CreateOrderPage } from '@/routes/CreateOrderPage';
import { DemoFallbackPanel } from '@/features/demo/DemoFallbackPanel';
import { CurrentTripProvider } from '@/features/trip/CurrentTripProvider';
import { useOrdersRealtime } from '@/realtime/useOrdersRealtime';
import { USE_MOCK_API } from '@/config/constants';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', label: 'Карта' },
  { to: '/orders', label: 'Заявки' },
  { to: '/report', label: 'Отчёт' },
  { to: '/create-order', label: 'Создать заявку' },
] as const;

function Shell() {
  return (
    <div className="flex h-svh flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-3 md:flex-nowrap md:px-6">
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="text-base font-semibold">OneRun</span>
          <span className="text-xs text-muted-foreground">Мангистау</span>
        </div>

        <nav className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:overflow-visible">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:px-3',
                  isActive
                    ? 'bg-secondary font-medium text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {USE_MOCK_API && (
          <span className="ml-auto shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-700 dark:text-amber-400">
            мок-данные
          </span>
        )}
      </header>

      {/* relative — якорь для резервного пульта, он позиционируется от области контента. */}
      <main className="relative min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
          <Route path="/health" element={<HealthPage />} />
        </Routes>

        {/* Скрыт, пока не нажмут Ctrl+Shift+X. Живёт над всеми вкладками: телефон
            может отвалиться в любой момент показа, не только на карте. */}
        <DemoFallbackPanel />
      </main>
    </div>
  );
}

function MvpApp() {
  // Подписка одна на всё приложение: заявки нужны и карте, и таблице, и демо-экрану.
  useOrdersRealtime();

  return (
    // Рейс общий для всех вкладок: строят его на карте, показывают ещё в заявках и отчёте.
    <CurrentTripProvider>
      <Routes>
        {/* /demo — отдельный полноэкранный роут без шапки: им управляют с телефона. */}
        <Route path="/demo" element={<DemoPage />} />
        <Route path="*" element={<Shell />} />
      </Routes>
    </CurrentTripProvider>
  );
}

export function App() {
  return (
    <Routes>
      {/* Лендинг живёт вне светлой оболочки MVP и не запускает его realtime-подписку. */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="*" element={<MvpApp />} />
    </Routes>
  );
}

export default App;
