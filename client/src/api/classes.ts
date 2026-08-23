import { api } from './client';
import type { ClassRecord, ClassesResponse, CreateClassInput, ClassFilters } from '@/types';

export interface NextClassNumber {
  nextClassNo: number;
  highestClassNo: number;
  missingClassNumbers: number[];
}

export const classesApi = {
  getAll: (filters?: ClassFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return api.get<ClassesResponse>(`/classes${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get<ClassRecord>(`/classes/${id}`),
  getNextClassNumber: (studentId: string) => api.get<NextClassNumber>(`/classes/student/${studentId}/next-number`),
  create: (data: CreateClassInput) => api.post<ClassRecord>('/classes', data),
  update: (id: string, data: Partial<CreateClassInput>) => api.put<ClassRecord>(`/classes/${id}`, data),
  delete: (id: string) => api.delete<{ message: string; class: ClassRecord }>(`/classes/${id}`),
  restore: (id: string) => api.post<ClassRecord>(`/classes/${id}/restore`, {}),
};
