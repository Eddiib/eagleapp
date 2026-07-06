import { api } from './client';

export interface Currency {
  code: string;        // ISO 4217
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CurrencyPayload {
  code: string;
  name: string;
  isActive?: boolean;
  sortOrder?: number;
}

function mapCurrency(row: any): Currency {
  return {
    code: row.code,
    name: row.name,
    isActive: Boolean(Number(row.is_active ?? 1)),
    sortOrder: Number(row.sort_order ?? 999),
  };
}

function toApi(c: Partial<CurrencyPayload>) {
  const out: Record<string, unknown> = {};
  if (c.code !== undefined) out.code = c.code;
  if (c.name !== undefined) out.name = c.name;
  if (c.isActive !== undefined) out.is_active = c.isActive ? 1 : 0;
  if (c.sortOrder !== undefined) out.sort_order = c.sortOrder;
  return out;
}

export const currenciesApi = {
  getAll: async (): Promise<Currency[]> => {
    const rows = await api.get<any[]>('/currencies');
    return rows.map(mapCurrency);
  },
  create: (data: CurrencyPayload) =>
    api.post<{ code: string; message: string }>('/currencies', toApi(data)),
  update: (code: string, data: Partial<CurrencyPayload>) =>
    api.put<{ message: string }>(`/currencies/${encodeURIComponent(code)}`, toApi(data)),
  delete: (code: string) =>
    api.delete<{ message: string }>(`/currencies/${encodeURIComponent(code)}`),
};
