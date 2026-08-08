import { api } from './client';

export const reportsApi = {
  getMonthly: (month: string) => api.get<any>(`/reports/monthly/${month}`),
  getStudent: (studentId: string) => api.get<any>(`/reports/student/${studentId}`),
  getYearly: (year: string) => api.get<any>(`/reports/yearly/${year}`),
  exportData: (format: string, month?: string) => {
    const params = month ? `?month=${month}` : '';
    return api.get<any>(`/reports/export/${format}${params}`);
  },
};
