import { api } from './client';
import type { Student, CreateStudentInput } from '@/types';

export const studentsApi = {
  getAll: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<Student[]>(`/students${params}`);
  },
  getById: (id: string) => api.get<Student>(`/students/${id}`),
  create: (data: CreateStudentInput) => api.post<Student>('/students', data),
  update: (id: string, data: Partial<CreateStudentInput>) => api.put<Student>(`/students/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/students/${id}`),
};
