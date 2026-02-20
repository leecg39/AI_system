// @TASK P0-T0.2 - Frontend 초기화: React Query Provider
// @SPEC docs/planning/01-project-overview.md

'use client';

import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </QueryClientProvider>
  );
}
