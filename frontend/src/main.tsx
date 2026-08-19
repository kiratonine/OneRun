import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import './index.css';
import App from './App.tsx';
import { ThemeProvider } from '@/components/theme-provider.tsx';
import { THEME_STORAGE_KEY } from '@/config/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Демо идёт с одного ноутбука: перезапросы на фокус только мешают.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      Тема жёстко светлая. Стиль карты (OpenFreeMap Liberty) светлый всегда, и тёмная
      шапка поверх светлой карты — это лотерея по настройкам чужого ноутбука на питче.
    */}
    <ThemeProvider defaultTheme="light" storageKey={THEME_STORAGE_KEY}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
