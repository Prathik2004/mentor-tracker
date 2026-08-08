import { api } from './client';
import type { Payment, UpdatePaymentInput } from '@/types';

export const paymentsApi = {
  getAll: () => api.get<Payment[]>('/payments'),
  getByMonth: (month: string) => api.get<Payment>(`/payments/${month}`),
  update: (month: string, data: UpdatePaymentInput) => api.put<Payment>(`/payments/${month}`, data),
  recalculate: (month: string) => api.post<Payment>(`/payments/recalculate/${month}`, {}),
};
