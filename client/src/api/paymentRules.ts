import { api } from './client';
import type { PaymentRule } from '@/types';

export const paymentRulesApi = {
  getAll: () => api.get<PaymentRule[]>('/payment-rules'),
  update: (data: { classType: string; status: string; amount: number }) =>
    api.put<PaymentRule>('/payment-rules', data),
  calculate: (classType: string, status: string, date: string) =>
    api.get<{ amount: number }>(`/payment-rules/calculate?classType=${classType}&status=${status}&date=${date}`),
};
