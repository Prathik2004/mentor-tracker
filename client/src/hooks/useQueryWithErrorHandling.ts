import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { useErrorHandler } from './useErrorHandler';

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
  const { getErrorMessage } = useErrorHandler();
  const { toast } = useToast();

  return useQuery({
    ...options,
  } as UseQueryOptions<TData, TError>);
}
