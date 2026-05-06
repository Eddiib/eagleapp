import { api } from './client';

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

interface QuotationRow {
  id: string;
  quote_number: string;
  status?: QuotationStatus | null;
  client_id?: string | null;
  client_name?: string | null;
  mode_of_transport?: string | null;
  origin_country?: string | null;
  origin_port?: string | null;
  destination_country?: string | null;
  destination_port?: string | null;
  valid_until?: string | null;
  total_sell?: number | string | null;
  total_cost?: number | string | null;
  currency?: string | null;
  notes?: string | null;
  rejection_reason?: string | null;
  created_date?: string | null;
  created_by?: string | null;
  updated_date?: string | null;
  service_count?: number | string | null;
  services?: QuotationServiceRow[];
}

interface QuotationServiceRow {
  id: string;
  quotation_id?: string;
  service_id: string;
  service_name?: string | null;
  service_code?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  quantity?: number | string | null;
  cost_price?: number | string | null;
  sell_price?: number | string | null;
  currency?: string | null;
  notes?: string | null;
}

export interface QuotationServiceLine {
  id?: string;
  quotationId?: string;
  serviceId: string;
  serviceName?: string;
  serviceCode?: string;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  currency: string;
  notes?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  status: QuotationStatus;
  clientId: string;
  clientName: string;
  modeOfTransport?: string;
  originCountry?: string;
  originPort?: string;
  destinationCountry?: string;
  destinationPort?: string;
  validUntil?: string;
  totalSell: number;
  totalCost: number;
  currency: string;
  notes?: string;
  rejectionReason?: string;
  createdDate?: string;
  createdBy?: string;
  updatedDate?: string;
  serviceCount: number;
  services: QuotationServiceLine[];
}

export interface QuotationPayload {
  quoteNumber: string;
  status: QuotationStatus;
  clientId: string;
  modeOfTransport?: string;
  originCountry?: string;
  originPort?: string;
  destinationCountry?: string;
  destinationPort?: string;
  validUntil?: string;
  totalSell: number;
  totalCost: number;
  currency: string;
  notes?: string;
  rejectionReason?: string;
  services: QuotationServiceLine[];
}

function toNum(value: unknown): number {
  if (value == null) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : (value as number);
  return Number.isFinite(num) ? num : 0;
}

function toDateOnly(value?: string | null): string | undefined {
  if (!value) return undefined;
  return String(value).split('T')[0];
}

function toServiceLine(row: QuotationServiceRow): QuotationServiceLine {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    serviceId: row.service_id,
    serviceName: row.service_name ?? undefined,
    serviceCode: row.service_code ?? undefined,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? undefined,
    quantity: toNum(row.quantity) || 1,
    costPrice: toNum(row.cost_price),
    sellPrice: toNum(row.sell_price),
    currency: row.currency ?? 'USD',
    notes: row.notes ?? undefined,
  };
}

function toQuotation(row: QuotationRow): Quotation {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    status: row.status ?? 'Draft',
    clientId: row.client_id ?? '',
    clientName: row.client_name ?? '',
    modeOfTransport: row.mode_of_transport ?? undefined,
    originCountry: row.origin_country ?? undefined,
    originPort: row.origin_port ?? undefined,
    destinationCountry: row.destination_country ?? undefined,
    destinationPort: row.destination_port ?? undefined,
    validUntil: toDateOnly(row.valid_until),
    totalSell: toNum(row.total_sell),
    totalCost: toNum(row.total_cost),
    currency: row.currency ?? 'USD',
    notes: row.notes ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    createdDate: row.created_date ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedDate: row.updated_date ?? undefined,
    serviceCount: toNum(row.service_count) || (Array.isArray(row.services) ? row.services.length : 0),
    services: Array.isArray(row.services) ? row.services.map(toServiceLine) : [],
  };
}

function toApiPayload(data: Partial<QuotationPayload>, extra: Record<string, unknown> = {}) {
  return {
    quote_number: data.quoteNumber,
    status: data.status,
    client_id: data.clientId,
    mode_of_transport: data.modeOfTransport ?? null,
    origin_country: data.originCountry ?? null,
    origin_port: data.originPort ?? null,
    destination_country: data.destinationCountry ?? null,
    destination_port: data.destinationPort ?? null,
    valid_until: data.validUntil ?? null,
    total_sell: data.totalSell ?? 0,
    total_cost: data.totalCost ?? 0,
    currency: data.currency ?? 'USD',
    notes: data.notes ?? null,
    rejection_reason: data.rejectionReason ?? null,
    services: (data.services ?? []).map((line) => ({
      service_id: line.serviceId,
      supplier_id: line.supplierId ?? null,
      quantity: line.quantity ?? 1,
      cost_price: line.costPrice ?? 0,
      sell_price: line.sellPrice ?? 0,
      currency: line.currency ?? data.currency ?? 'USD',
      notes: line.notes ?? null,
    })),
    ...extra,
  };
}

export function generateQuoteNumber(date = new Date()): string {
  const year = date.getFullYear();
  const stamp = `${date.getMonth() + 1}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
  return `QT-${year}-${stamp}`;
}

export const quotationsApi = {
  getAll: async (): Promise<Quotation[]> => {
    const rows = await api.get<QuotationRow[]>('/quotations');
    return rows.map(toQuotation);
  },
  getById: async (id: string): Promise<Quotation> => {
    const row = await api.get<QuotationRow>(`/quotations/${id}`);
    return toQuotation(row);
  },
  create: (data: QuotationPayload, createdBy?: string) =>
    api.post<{ id: string; message: string }>('/quotations', toApiPayload(data, { created_by: createdBy })),
  update: (id: string, data: Partial<QuotationPayload>) =>
    api.put<{ message: string }>(`/quotations/${id}`, toApiPayload(data)),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/quotations/${id}`),
};
