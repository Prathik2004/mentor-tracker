import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export function useQueryWithErrorHandling<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
) {
  return useQuery({
    ...options,
    throwOnError: false,
  } as UseQueryOptions<TData, TError>);
}

export function useQueryWithToast<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
) {
  return useQuery({
    ...options,
  } as UseQueryOptions<TData, TError>);
}
