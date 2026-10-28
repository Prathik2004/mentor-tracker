import { useToast } from '@/components/ui/toast';

export interface ApiError {
  status?: number;
  error?: string;
  message?: string;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const getErrorMessage = (error: any): string => {
    // Handle network errors
    if (error instanceof TypeError) {
      if (error.message.includes('fetch')) {
        return 'Network error: Unable to connect to server. Please check your connection.';
      }
      return 'An unexpected error occurred.';
    }

    // Handle API errors
    if (error?.status) {
      switch (error.status) {
        case 400:
          return error.error || 'Invalid input. Please check your data.';
        case 401:
          return 'Session expired. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return error.error || 'Resource not found.';
        case 409:
          return error.error || 'This resource already exists.';
        case 422:
          return error.error || 'Invalid data provided.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return error.error || 'An error occurred. Please try again.';
      }
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Handle error objects with error property
    if (error?.error) {
      return error.error;
    }

    // Handle error objects with message property
    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred.';
  };

  const handleError = (error: any, fallbackMessage?: string): string => {
    const extracted = getErrorMessage(error);
    // Use extracted message if it's specific, otherwise fall back to caller's label
    const message =
      extracted === 'An unexpected error occurred.' && fallbackMessage
        ? fallbackMessage
        : extracted;
    toast(message, 'error');
    return message;
  };

  return { handleError, getErrorMessage };
}
