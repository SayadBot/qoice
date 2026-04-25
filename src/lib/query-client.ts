import { QueryClient } from '@tanstack/react-query'
import ms from 'ms'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,

      gcTime: Infinity,
      staleTime: ms('10m'),

      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  },
})
