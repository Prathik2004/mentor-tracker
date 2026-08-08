import { api } from './client';
import type { IncentiveType } from '@/types';

export const incentiveTypesApi = {
  getAll: () => api.get<IncentiveType[]>('/incentive-types'),
  create: (name: string) => api.post<IncentiveType>('/incentive-types', { name }),
  delete: (id: string) => api.delete<{ message: string }>(`/incentive-types/${id}`),
};
