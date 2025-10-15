import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { cacheConfig } from '@/lib/query-client';

/**
 * Custom hook for cached queries with predefined cache strategies
 * Usage: const { data } = useCachedQuery('static', ['key'], fetchFn);
 */
export function useCachedQuery<TData = unknown, TError = Error>(
  cacheType: 'static' | 'semiStatic' | 'dynamic' | 'realtime',
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...cacheConfig[cacheType],
    ...options,
  });
}
