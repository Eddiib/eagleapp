import { api } from './client';
import { TransportMode, LoadStatus, QuoteStatus } from '../components/pricing/types';

// ── Row types (from DB) ───────────────────────────────────────

interface PricingLoadRow {
  id: string;
  load_number: string;
  client_id?: string | null;
  client_name?: string | null;
  sales_person?: string | null;
  related_quotation_id?: string | null;
  related_booking_id?: string | null;
  transport_mode: string;
  origin?: string | null;
  destination?: string | null;
  equipment_type?: string | null;
  quantity?: number | null;
  volume_cbm?: number | string | null;
  weight_kg?: number | string | null;
  cargo_nature?: string | null;
  hazardous?: number | boolean | null;
  incoterm?: string | null;
  required_date?: string | null;
  status: string;
  posted_date?: string | null;
  closed_date?: string | null;
  selected_quote_id?: string | null;
  sales_notes?: string | null;
  pricing_notes?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  quote_count?: number | string | null;
  quotes?: PricingQuoteRow[];
}

interface PricingQuoteRow {
  id: string;
  load_id: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  carrier_name?: string | null;
  transport_mode?: string | null;
  offered_rate?: number | string | null;
  currency?: string | null;
  base_rate?: number | string | null;
  total_rate?: number | string | null;
  transit_days?: number | string | null;
  validity_date?: string | null;
  equipment_available_date?: string | null;
  remarks?: string | null;
  status?: string | null;
  decline_reason?: string | null;
  received_date?: string | null;
  responded_date?: string | null;
  responded_by?: string | null;
}

interface PricingContractRow {
  id: string;
  contract_number: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  transport_mode: string;
  origin?: string | null;
  destination?: string | null;
  equipment_type?: string | null;
  service_level?: string | null;
  base_rate?: number | string | null;
  currency?: string | null;
  total_rate?: number | string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  transit_days?: number | string | null;
  frequency?: string | null;
  notes?: string | null;
  is_active?: number | boolean | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface PricingModelRow {
  id: string;
  model_name: string;
  transport_mode: string;
  calculation_type: string;
  base_unit?: string | null;
  description?: string | null;
  minimum_charge?: number | string | null;
  default_validity_days?: number | null;
  rounding_rule?: string | null;
  is_active?: number | boolean | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ── Domain types ─────────────────────────────────────────────

export interface PricingLoad {
  id: string;
  loadNumber: string;
  clientId?: string;
  clientName: string;
  salesPerson?: string;
  relatedQuotationId?: string;
  relatedBookingId?: string;
  mode: TransportMode;
  origin: string;
  destination: string;
  equipmentType: string;
  quantity: number;
  volumeCbm?: number;
  weightKg?: number;
  cargoNature: string;
  hazardous: boolean;
  incoterm?: string;
  requiredDate: string;
  status: LoadStatus;
  postedDate?: string;
  closedDate?: string;
  selectedQuoteId?: string;
  salesNotes?: string;
  pricingNotes?: string;
  createdBy?: string;
  createdAt: string;
  quoteCount: number;
  quotes?: PricingQuote[];
}

export interface PricingQuote {
  id: string;
  loadId: string;
  supplierId?: string;
  supplierName: string;
  carrierName?: string;
  mode?: TransportMode;
  offeredRate?: number;
  currency: string;
  baseRate?: number;
  totalRate?: number;
  transitDays?: number;
  validityDate?: string;
  equipmentAvailableDate?: string;
  remarks?: string;
  status: QuoteStatus;
  declineReason?: string;
  receivedDate?: string;
  respondedDate?: string;
  respondedBy?: string;
}

export interface PricingContract {
  id: string;
  contractNumber: string;
  supplierId?: string;
  supplierName: string;
  mode: TransportMode;
  origin: string;
  destination: string;
  equipmentType: string;
  serviceLevel?: string;
  baseRate?: number;
  currency: string;
  totalRate?: number;
  validFrom?: string;
  validTo?: string;
  transitDays?: number;
  frequency?: string;
  notes?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface PricingModel {
  id: string;
  modelName: string;
  mode: TransportMode;
  calculationType: 'per_unit' | 'per_weight' | 'per_volume' | 'whichever_greater' | 'custom';
  baseUnit?: string;
  description?: string;
  minimumCharge?: number;
  defaultValidityDays: number;
  roundingRule?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
}

// ── Mappers ───────────────────────────────────────────────────

function toDateOnly(v?: string | null): string {
  if (!v) return '';
  return String(v).split('T')[0];
}

function toLoad(row: PricingLoadRow): PricingLoad {
  return {
    id: row.id,
    loadNumber: row.load_number,
    clientId: row.client_id ?? undefined,
    clientName: row.client_name ?? '',
    salesPerson: row.sales_person ?? undefined,
    relatedQuotationId: row.related_quotation_id ?? undefined,
    relatedBookingId: row.related_booking_id ?? undefined,
    mode: (row.transport_mode as TransportMode) ?? 'FCL',
    origin: row.origin ?? '',
    destination: row.destination ?? '',
    equipmentType: row.equipment_type ?? '',
    quantity: Number(row.quantity ?? 1),
    volumeCbm: row.volume_cbm != null ? Number(row.volume_cbm) : undefined,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
    cargoNature: row.cargo_nature ?? '',
    hazardous: row.hazardous === 1 || row.hazardous === true,
    incoterm: row.incoterm ?? undefined,
    requiredDate: toDateOnly(row.required_date),
    status: (row.status as LoadStatus) ?? 'Open',
    postedDate: toDateOnly(row.posted_date) || undefined,
    closedDate: toDateOnly(row.closed_date) || undefined,
    selectedQuoteId: row.selected_quote_id ?? undefined,
    salesNotes: row.sales_notes ?? undefined,
    pricingNotes: row.pricing_notes ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? '',
    quoteCount: Number(row.quote_count ?? (Array.isArray(row.quotes) ? row.quotes.length : 0)),
    quotes: Array.isArray(row.quotes) ? row.quotes.map(toQuote) : undefined,
  };
}

function toQuote(row: PricingQuoteRow): PricingQuote {
  return {
    id: row.id,
    loadId: row.load_id,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? '',
    carrierName: row.carrier_name ?? undefined,
    mode: row.transport_mode ? (row.transport_mode as TransportMode) : undefined,
    offeredRate: row.offered_rate != null ? Number(row.offered_rate) : undefined,
    currency: row.currency ?? 'USD',
    baseRate: row.base_rate != null ? Number(row.base_rate) : undefined,
    totalRate: row.total_rate != null ? Number(row.total_rate) : undefined,
    transitDays: row.transit_days != null ? Number(row.transit_days) : undefined,
    validityDate: toDateOnly(row.validity_date) || undefined,
    equipmentAvailableDate: toDateOnly(row.equipment_available_date) || undefined,
    remarks: row.remarks ?? undefined,
    status: (row.status as QuoteStatus) ?? 'Received',
    declineReason: row.decline_reason ?? undefined,
    receivedDate: toDateOnly(row.received_date) || undefined,
    respondedDate: toDateOnly(row.responded_date) || undefined,
    respondedBy: row.responded_by ?? undefined,
  };
}

function toContract(row: PricingContractRow): PricingContract {
  return {
    id: row.id,
    contractNumber: row.contract_number,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? '',
    mode: (row.transport_mode as TransportMode) ?? 'FCL',
    origin: row.origin ?? '',
    destination: row.destination ?? '',
    equipmentType: row.equipment_type ?? '',
    serviceLevel: row.service_level ?? undefined,
    baseRate: row.base_rate != null ? Number(row.base_rate) : undefined,
    currency: row.currency ?? 'USD',
    totalRate: row.total_rate != null ? Number(row.total_rate) : undefined,
    validFrom: toDateOnly(row.valid_from) || undefined,
    validTo: toDateOnly(row.valid_to) || undefined,
    transitDays: row.transit_days != null ? Number(row.transit_days) : undefined,
    frequency: row.frequency ?? undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active === 1 || row.is_active === true,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? '',
  };
}

function toModel(row: PricingModelRow): PricingModel {
  return {
    id: row.id,
    modelName: row.model_name,
    mode: (row.transport_mode as TransportMode) ?? 'FCL',
    calculationType: (row.calculation_type as PricingModel['calculationType']) ?? 'per_unit',
    baseUnit: row.base_unit ?? undefined,
    description: row.description ?? undefined,
    minimumCharge: row.minimum_charge != null ? Number(row.minimum_charge) : undefined,
    defaultValidityDays: Number(row.default_validity_days ?? 30),
    roundingRule: row.rounding_rule ?? undefined,
    isActive: row.is_active === 1 || row.is_active === true,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? '',
  };
}

// ── API payload builders ──────────────────────────────────────

function toLoadPayload(d: Partial<PricingLoad>) {
  return {
    client_id: d.clientId ?? null,
    client_name: d.clientName ?? null,
    sales_person: d.salesPerson ?? null,
    related_quotation_id: d.relatedQuotationId ?? null,
    related_booking_id: d.relatedBookingId ?? null,
    transport_mode: d.mode ?? 'FCL',
    origin: d.origin ?? null,
    destination: d.destination ?? null,
    equipment_type: d.equipmentType ?? null,
    quantity: d.quantity ?? 1,
    volume_cbm: d.volumeCbm ?? null,
    weight_kg: d.weightKg ?? null,
    cargo_nature: d.cargoNature ?? null,
    hazardous: d.hazardous ? 1 : 0,
    incoterm: d.incoterm ?? null,
    required_date: d.requiredDate || null,
    status: d.status ?? 'Open',
    sales_notes: d.salesNotes ?? null,
    pricing_notes: d.pricingNotes ?? null,
    posted_date: d.postedDate ?? null,
    closed_date: d.closedDate ?? null,
    selected_quote_id: d.selectedQuoteId ?? null,
  };
}

function toContractPayload(d: Partial<PricingContract>) {
  return {
    supplier_id: d.supplierId ?? null,
    supplier_name: d.supplierName ?? null,
    transport_mode: d.mode ?? 'FCL',
    origin: d.origin ?? null,
    destination: d.destination ?? null,
    equipment_type: d.equipmentType ?? null,
    service_level: d.serviceLevel ?? null,
    base_rate: d.baseRate ?? null,
    currency: d.currency ?? 'USD',
    total_rate: d.totalRate ?? null,
    valid_from: d.validFrom ?? null,
    valid_to: d.validTo ?? null,
    transit_days: d.transitDays ?? null,
    frequency: d.frequency ?? null,
    notes: d.notes ?? null,
    is_active: d.isActive !== undefined ? (d.isActive ? 1 : 0) : 1,
  };
}

function toModelPayload(d: Partial<PricingModel>) {
  return {
    model_name: d.modelName ?? '',
    transport_mode: d.mode ?? 'FCL',
    calculation_type: d.calculationType ?? 'per_unit',
    base_unit: d.baseUnit ?? null,
    description: d.description ?? null,
    minimum_charge: d.minimumCharge ?? null,
    default_validity_days: d.defaultValidityDays ?? 30,
    rounding_rule: d.roundingRule ?? null,
    is_active: d.isActive !== undefined ? (d.isActive ? 1 : 0) : 1,
  };
}

// ── API client ────────────────────────────────────────────────

export const pricingApi = {
  // Loads
  getNextLoadNumber: () => api.get<{ load_number: string }>('/pricing/loads/next-number'),
  getLoads: async (): Promise<PricingLoad[]> => {
    const rows = await api.get<PricingLoadRow[]>('/pricing/loads');
    return rows.map(toLoad);
  },
  getLoad: async (id: string): Promise<PricingLoad> => {
    const row = await api.get<PricingLoadRow>(`/pricing/loads/${id}`);
    return toLoad(row);
  },
  createLoad: (data: Partial<PricingLoad>) =>
    api.post<{ id: string; load_number: string; message: string }>('/pricing/loads', toLoadPayload(data)),
  updateLoad: (id: string, data: Partial<PricingLoad>) =>
    api.put<{ message: string }>(`/pricing/loads/${id}`, toLoadPayload(data)),
  deleteLoad: (id: string) =>
    api.delete<{ message: string }>(`/pricing/loads/${id}`),

  // Quotes
  addQuote: (loadId: string, data: Partial<PricingQuote>) =>
    api.post<{ id: string; message: string }>(`/pricing/loads/${loadId}/quotes`, {
      supplier_id: data.supplierId ?? null,
      supplier_name: data.supplierName ?? null,
      carrier_name: data.carrierName ?? null,
      transport_mode: data.mode ?? null,
      offered_rate: data.offeredRate ?? null,
      currency: data.currency ?? 'USD',
      base_rate: data.baseRate ?? null,
      total_rate: data.totalRate ?? null,
      transit_days: data.transitDays ?? null,
      validity_date: data.validityDate ?? null,
      equipment_available_date: data.equipmentAvailableDate ?? null,
      remarks: data.remarks ?? null,
      received_date: data.receivedDate ?? null,
    }),
  updateQuoteStatus: (loadId: string, quoteId: string, status: QuoteStatus, declineReason?: string, respondedBy?: string) =>
    api.put<{ message: string }>(`/pricing/loads/${loadId}/quotes/${quoteId}`, {
      status,
      decline_reason: declineReason ?? null,
      responded_by: respondedBy ?? null,
    }),
  deleteQuote: (loadId: string, quoteId: string) =>
    api.delete<{ message: string }>(`/pricing/loads/${loadId}/quotes/${quoteId}`),

  // Contracts
  getNextContractNumber: () => api.get<{ contract_number: string }>('/pricing/contracts/next-number'),
  getContracts: async (): Promise<PricingContract[]> => {
    const rows = await api.get<PricingContractRow[]>('/pricing/contracts');
    return rows.map(toContract);
  },
  createContract: (data: Partial<PricingContract>) =>
    api.post<{ id: string; contract_number: string; message: string }>('/pricing/contracts', toContractPayload(data)),
  updateContract: (id: string, data: Partial<PricingContract>) =>
    api.put<{ message: string }>(`/pricing/contracts/${id}`, toContractPayload(data)),
  deleteContract: (id: string) =>
    api.delete<{ message: string }>(`/pricing/contracts/${id}`),

  // Models
  getModels: async (): Promise<PricingModel[]> => {
    const rows = await api.get<PricingModelRow[]>('/pricing/models');
    return rows.map(toModel);
  },
  createModel: (data: Partial<PricingModel>) =>
    api.post<{ id: string; message: string }>('/pricing/models', toModelPayload(data)),
  updateModel: (id: string, data: Partial<PricingModel>) =>
    api.put<{ message: string }>(`/pricing/models/${id}`, toModelPayload(data)),
  deleteModel: (id: string) =>
    api.delete<{ message: string }>(`/pricing/models/${id}`),
};
