import { api } from './client';
import type { Incentive, CreateIncentiveInput } from '@/types';

export const incentivesApi = {
  getAll: (month?: string) => {
    const params = month ? `?month=${month}` : '';
    return api.get<Incentive[]>(`/incentives${params}`);
  },
  create: (data: CreateIncentiveInput) => api.post<Incentive>('/incentives', data),
  update: (id: string, data: Partial<CreateIncentiveInput>) => api.put<Incentive>(`/incentives/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/incentives/${id}`),
};
