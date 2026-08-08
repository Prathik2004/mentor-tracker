import { api } from './client';

export const settingsApi = {
  getAll: () => api.get<Record<string, any>>('/settings'),
  update: (data: Record<string, any>) => api.put<Record<string, any>>('/settings', data),
};
