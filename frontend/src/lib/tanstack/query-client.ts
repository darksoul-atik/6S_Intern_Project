import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute fresh cache
        retry: 1, // retry once on failure
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
