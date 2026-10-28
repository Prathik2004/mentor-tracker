import { api } from './client';
import type { CreateDeductionInput, Deduction } from '@/types';

export const deductionsApi = {
  getAll: (month?: string) => api.get<Deduction[]>(`/deductions${month ? `?month=${encodeURIComponent(month)}` : ''}`),
  create: (data: CreateDeductionInput) => api.post<Deduction>('/deductions', data),
  delete: (id: string) => api.delete<{ message: string }>(`/deductions/${id}`),
};
