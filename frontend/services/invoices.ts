import { api } from './client';

export type InvoiceType   = 'Sales' | 'Purchase' | 'Credit Note';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled' | 'Void';

export interface InvoiceLine {
  id?: string;
  serviceId?: string;
  serviceName?: string;
  serviceCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  currency: string;
  lineTotal?: number;
  vatAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  clientId?: string;
  clientName?: string;
  bookingId?: string;
  bookingNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  exchangeRate: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  paymentTerms?: string;
  bankDetails?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  lines: InvoiceLine[];
}

export interface InvoicePayload {
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  clientId?: string;
  bookingId?: string;
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  exchangeRate?: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid?: number;
  notes?: string;
  paymentTerms?: string;
  bankDetails?: string;
  lines: InvoiceLine[];
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  invoice_type: string;
  status: string;
  client_id?: string | null;
  client_name?: string | null;
  client_trading_name?: string | null;
  booking_id?: string | null;
  booking_number?: string | null;
  invoice_date: string;
  due_date?: string | null;
  currency: string;
  exchange_rate: number | string;
  subtotal: number | string;
  vat_amount: number | string;
  total_amount: number | string;
  amount_paid: number | string;
  balance_due: number | string;
  notes?: string | null;
  payment_terms?: string | null;
  bank_details?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  last_modified_by?: string | null;
  last_modified_at?: string | null;
  lines?: any[];
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function dateOnly(v?: string | null): string {
  if (!v) return '';
  return String(v).split('T')[0];
}

function toLine(l: any): InvoiceLine {
  return {
    id: l.id,
    serviceId: l.service_id ?? undefined,
    serviceName: l.service_name ?? undefined,
    serviceCode: l.service_code ?? undefined,
    description: l.description ?? '',
    quantity: toNum(l.quantity) || 1,
    unitPrice: toNum(l.unit_price),
    vatRate: toNum(l.vat_rate),
    currency: l.currency ?? 'EUR',
    lineTotal: toNum(l.line_total),
    vatAmount: toNum(l.vat_amount),
  };
}

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceType: (row.invoice_type as InvoiceType) ?? 'Sales',
    status: (row.status as InvoiceStatus) ?? 'Draft',
    clientId: row.client_id ?? undefined,
    clientName: row.client_name ?? row.client_trading_name ?? undefined,
    bookingId: row.booking_id ?? undefined,
    bookingNumber: row.booking_number ?? undefined,
    invoiceDate: dateOnly(row.invoice_date),
    dueDate: dateOnly(row.due_date) || undefined,
    currency: row.currency ?? 'EUR',
    exchangeRate: toNum(row.exchange_rate) || 1,
    subtotal: toNum(row.subtotal),
    vatAmount: toNum(row.vat_amount),
    totalAmount: toNum(row.total_amount),
    amountPaid: toNum(row.amount_paid),
    balanceDue: toNum(row.balance_due),
    notes: row.notes ?? undefined,
    paymentTerms: row.payment_terms ?? undefined,
    bankDetails: row.bank_details ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? undefined,
    lastModifiedBy: row.last_modified_by ?? undefined,
    lastModifiedAt: row.last_modified_at ?? undefined,
    lines: (row.lines || []).map(toLine),
  };
}

function toApiPayload(data: InvoicePayload, extra: Record<string, unknown> = {}) {
  return {
    invoice_number: data.invoiceNumber,
    invoice_type: data.invoiceType,
    status: data.status,
    client_id: data.clientId ?? null,
    booking_id: data.bookingId ?? null,
    invoice_date: data.invoiceDate,
    due_date: data.dueDate ?? null,
    currency: data.currency,
    exchange_rate: data.exchangeRate ?? 1,
    subtotal: data.subtotal,
    vat_amount: data.vatAmount,
    total_amount: data.totalAmount,
    amount_paid: data.amountPaid ?? 0,
    notes: data.notes ?? null,
    payment_terms: data.paymentTerms ?? null,
    bank_details: data.bankDetails ?? null,
    lines: data.lines.map((l, i) => ({
      service_id: l.serviceId ?? null,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      vat_rate: l.vatRate,
      currency: l.currency,
      sort_order: i,
    })),
    ...extra,
  };
}

export const invoicesApi = {
  getNextNumber: async (): Promise<string> => {
    const res = await api.get<{ nextNumber: string }>('/invoices/next-number');
    return res.nextNumber;
  },
  getAll: async (): Promise<Invoice[]> => {
    const rows = await api.get<InvoiceRow[]>('/invoices');
    return rows.map(toInvoice);
  },
  getById: async (id: string): Promise<Invoice> => {
    const row = await api.get<InvoiceRow>(`/invoices/${id}`);
    return toInvoice(row);
  },
  create: (data: InvoicePayload, createdBy?: string) =>
    api.post<{ id: string; message: string }>('/invoices', toApiPayload(data, { created_by: createdBy })),
  update: (id: string, data: InvoicePayload, lastModifiedBy?: string) =>
    api.put<{ message: string }>(`/invoices/${id}`, toApiPayload(data, { last_modified_by: lastModifiedBy })),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/invoices/${id}`),
};
