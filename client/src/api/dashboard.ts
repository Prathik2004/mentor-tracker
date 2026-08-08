import { api } from './client';
import type { DashboardStats, MonthlyHistory } from '@/types';

export const dashboardApi = {
  getStats: (month: string) => api.get<DashboardStats>(`/dashboard/stats/${month}`),
  getMonthlyHistory: () => api.get<MonthlyHistory[]>('/dashboard/monthly-history'),
  getInsights: (month: string) => api.get<string[]>(`/dashboard/insights/${month}`),
};
