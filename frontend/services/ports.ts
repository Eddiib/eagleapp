import { api } from './client';

export interface Port {
  code: string;
  name: string;
  country: string;     // ISO 3166-1 alpha-2
  sortOrder: number;
}

export interface PortPayload {
  code: string;
  name: string;
  country: string;
  sortOrder?: number;
}

function mapPort(row: any): Port {
  return {
    code: row.code,
    name: row.name,
    country: row.country,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function toApi(p: Partial<PortPayload>) {
  const out: Record<string, unknown> = {};
  if (p.code !== undefined) out.code = p.code;
  if (p.name !== undefined) out.name = p.name;
  if (p.country !== undefined) out.country = p.country;
  if (p.sortOrder !== undefined) out.sort_order = p.sortOrder;
  return out;
}

export const portsApi = {
  getAll: async (): Promise<Port[]> => {
    const rows = await api.get<any[]>('/ports');
    return rows.map(mapPort);
  },
  create: (data: PortPayload) =>
    api.post<{ code: string; message: string }>('/ports', toApi(data)),
  update: (code: string, data: Partial<PortPayload>) =>
    api.put<{ message: string }>(`/ports/${encodeURIComponent(code)}`, toApi(data)),
  delete: (code: string) =>
    api.delete<{ message: string }>(`/ports/${encodeURIComponent(code)}`),
};
