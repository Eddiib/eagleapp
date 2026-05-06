import { api } from './client';

export interface ExchangeRateRow {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  created_at?: string;
  updated_at?: string;
}

export const exchangeRatesApi = {
  getAll: () => api.get<ExchangeRateRow[]>('/exchange-rates'),
  upsert: (payload: { from_currency: string; to_currency: string; rate: number; effective_date: string }) =>
    api.post<{ id: string; message: string }>('/exchange-rates', payload),
  delete: (id: string) => api.delete<{ message: string }>(`/exchange-rates/${id}`),
};
