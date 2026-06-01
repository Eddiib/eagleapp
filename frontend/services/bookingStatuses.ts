import { api } from './client';

export interface BookingStatusConfig {
  id: string;
  name: string;
  color: string;       // hex, e.g. #2563eb
  sort_order: number;
  is_active: 0 | 1 | boolean;
}

export interface BookingStatusInput {
  name?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const bookingStatusesApi = {
  getAll: () => api.get<BookingStatusConfig[]>('/booking-statuses'),
  create: (data: BookingStatusInput) => api.post<BookingStatusConfig>('/booking-statuses', data),
  update: (id: string, data: BookingStatusInput) => api.put<BookingStatusConfig>(`/booking-statuses/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/booking-statuses/${id}`),
};
