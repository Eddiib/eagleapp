import { api } from './client';

export type CostEntryStatus = 'Pending' | 'Approved' | 'Paid' | 'Disputed';

interface CostEntryRow {
  id: string;
  booking_id?: string | null;
  booking_number?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  client_trading_name?: string | null;
  description?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  buying_exchange_rate?: number | string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  status?: CostEntryStatus | null;
  selling_price?: number | string | null;
  selling_currency?: string | null;
  selling_exchange_rate?: number | string | null;
  selling_invoice_number?: string | null;
  selling_invoice_date?: string | null;
  quantity?: number | string | null;
  is_locked?: number | boolean | null;
  created_at?: string | null;
  created_by?: string | null;
  last_modified_by?: string | null;
  last_modified_at?: string | null;
}

export interface CostEntry {
  id: string;
  bookingId?: string;
  bookingNumber?: string;
  serviceId?: string;
  serviceName?: string;
  supplierId?: string;
  supplierName?: string;
  clientId?: string;
  clientName?: string;
  description?: string;
  amount: number;
  currency: string;
  buyingExchangeRate: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  status: CostEntryStatus;
  sellingPrice: number;
  sellingCurrency: string;
  sellingExchangeRate: number;
  sellingInvoiceNumber?: string;
  sellingInvoiceDate?: string;
  quantity: number;
  isLocked: boolean;
  createdAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface CostEntryPayload {
  bookingId: string;
  serviceId: string;
  supplierId?: string;
  clientId?: string;
  description?: string;
  amount: number;
  currency: string;
  buyingExchangeRate?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  status: CostEntryStatus;
  sellingPrice?: number;
  sellingCurrency?: string;
  sellingExchangeRate?: number;
  sellingInvoiceNumber?: string;
  sellingInvoiceDate?: string;
  quantity?: number;
  isLocked?: boolean;
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

function toEntry(row: CostEntryRow): CostEntry {
  return {
    id: row.id,
    bookingId: row.booking_id ?? undefined,
    bookingNumber: row.booking_number ?? undefined,
    serviceId: row.service_id ?? undefined,
    serviceName: row.service_name ?? undefined,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? undefined,
    clientId: row.client_id ?? undefined,
    clientName: row.client_name ?? row.client_trading_name ?? undefined,
    description: row.description ?? undefined,
    amount: toNum(row.amount),
    currency: row.currency ?? 'EUR',
    buyingExchangeRate: toNum(row.buying_exchange_rate) || 1,
    invoiceNumber: row.invoice_number ?? undefined,
    invoiceDate: toDateOnly(row.invoice_date),
    dueDate: toDateOnly(row.due_date),
    status: row.status ?? 'Pending',
    sellingPrice: toNum(row.selling_price),
    sellingCurrency: row.selling_currency ?? 'EUR',
    sellingExchangeRate: toNum(row.selling_exchange_rate) || 1,
    sellingInvoiceNumber: row.selling_invoice_number ?? undefined,
    sellingInvoiceDate: toDateOnly(row.selling_invoice_date),
    quantity: toNum(row.quantity) || 1,
    isLocked: Boolean(row.is_locked),
    createdAt: row.created_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    lastModifiedBy: row.last_modified_by ?? undefined,
    lastModifiedAt: row.last_modified_at ?? undefined,
  };
}

function toApiPayload(data: Partial<CostEntryPayload>, extra: Record<string, unknown> = {}) {
  return {
    booking_id: data.bookingId,
    service_id: data.serviceId,
    supplier_id: data.supplierId ?? null,
    client_id: data.clientId ?? null,
    description: data.description ?? null,
    amount: data.amount ?? 0,
    currency: data.currency ?? 'EUR',
    buying_exchange_rate: data.buyingExchangeRate ?? 1,
    invoice_number: data.invoiceNumber ?? null,
    invoice_date: data.invoiceDate ?? null,
    due_date: data.dueDate ?? null,
    status: data.status ?? 'Pending',
    selling_price: data.sellingPrice ?? 0,
    selling_currency: data.sellingCurrency ?? 'EUR',
    selling_exchange_rate: data.sellingExchangeRate ?? 1,
    selling_invoice_number: data.sellingInvoiceNumber ?? null,
    selling_invoice_date: data.sellingInvoiceDate ?? null,
    quantity: data.quantity ?? 1,
    is_locked: data.isLocked ? 1 : 0,
    ...extra,
  };
}

export const costControlApi = {
  getAll: async (): Promise<CostEntry[]> => {
    const rows = await api.get<CostEntryRow[]>('/cost-control');
    return rows.map(toEntry);
  },
  getById: async (id: string): Promise<CostEntry> => {
    const row = await api.get<CostEntryRow>(`/cost-control/${id}`);
    return toEntry(row);
  },
  create: (data: CostEntryPayload, createdBy?: string) =>
    api.post<{ id: string; message: string }>('/cost-control', toApiPayload(data, { created_by: createdBy })),
  update: (id: string, data: Partial<CostEntryPayload>, lastModifiedBy?: string) =>
    api.put<{ message: string }>(`/cost-control/${id}`, toApiPayload(data, { last_modified_by: lastModifiedBy })),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/cost-control/${id}`),
};
