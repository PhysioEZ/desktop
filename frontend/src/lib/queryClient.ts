// Enhanced React Query Client Configuration
// Optimized for caching, stale-time management, and performance

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 3 minutes before considering it stale
      staleTime: 3 * 60 * 1000, // 3 minutes
      
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      
      // Retry failed requests
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on window focus by default (we'll use WebSocket for updates)
      refetchOnWindowFocus: false,
      
      // Don't refetch on reconnect (WebSocket will handle this)
      refetchOnReconnect: false,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});
