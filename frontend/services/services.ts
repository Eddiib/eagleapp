import { api } from './client';
import {
  Service,
  ServiceGroup,
  ServiceCategory,
  TransportMode,
  AppliesTo,
  ChargeUnit,
  BuySellType,
  PriceBehavior,
  LocationType,
  WhereUsed,
  PartnerType,
} from '../types/service';

// ── Backend row shapes (snake_case, read-only) ───────────────────────────────
interface ServiceRow {
  id: string;
  service_code: string;
  service_name: string;
  service_group_id?: string | null;
  category?: string | null;
  transport_modes?: unknown;         // JSON in DB, driver sometimes returns string
  applies_to_list?: unknown;         // JSON
  charge_unit?: string | null;
  default_currency?: string | null;
  buy_sell_type?: string | null;
  default_vat_rate?: number | string | null;
  default_gl_code?: string | null;
  price_behavior?: string | null;
  pricing_model_id?: string | null;
  related_partner_types?: unknown;   // JSON
  location_type?: string | null;
  documentation_required?: number | boolean | null;
  mandatory_for_shipment_types?: unknown; // JSON
  is_active?: number | boolean | null;
  visible_to_sales?: number | boolean | null;
  visible_to_marketplace?: number | boolean | null;
  notes?: string | null;
  used_in_bookings?: number | null;
  used_in_quotations?: number | null;
  used_in_pricing?: number | null;
  used_in_invoices?: number | null;
  created_at?: string | null;
  created_date?: string | null;
  created_by?: string | null;
  updated_at?: string | null;
  modified_date?: string | null;
  modified_by?: string | null;
}

interface ServiceGroupRow {
  id: string;
  group_code: string;
  group_name: string;
  description?: string | null;
  default_where_used?: unknown;
  default_modes?: unknown;
  is_active?: number | boolean | null;
  created_by?: string | null;
  created_date?: string | null;
  modified_by?: string | null;
  modified_date?: string | null;
  used_in_services?: number | string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseJsonArray<T extends string>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toBool(v: unknown, fallback = false): boolean {
  if (v == null) return fallback;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return fallback;
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    serviceCode: row.service_code,
    serviceName: row.service_name,
    serviceGroupId: row.service_group_id ?? null,
    category: (row.category ?? 'Main Freight') as ServiceCategory,
    transportModes: parseJsonArray<TransportMode>(row.transport_modes),
    appliesTo: parseJsonArray<AppliesTo>(row.applies_to_list),
    chargeUnit: (row.charge_unit ?? 'Per Shipment') as ChargeUnit,
    defaultCurrency: row.default_currency ?? 'EUR',
    buySellType: (row.buy_sell_type ?? 'Both') as BuySellType,
    defaultVatRate: toNum(row.default_vat_rate),
    defaultGlCode: row.default_gl_code ?? undefined,
    priceBehavior: (row.price_behavior ?? 'Fixed') as PriceBehavior,
    pricingModelId: row.pricing_model_id ?? undefined,
    relatedPartnerTypes: parseJsonArray<PartnerType>(row.related_partner_types),
    locationType: (row.location_type ?? 'Not location-specific') as LocationType,
    documentationRequired: toBool(row.documentation_required),
    mandatoryForShipmentTypes: parseJsonArray<AppliesTo>(row.mandatory_for_shipment_types),
    isActive: toBool(row.is_active, true),
    visibleToSales: toBool(row.visible_to_sales, true),
    visibleToMarketplace: toBool(row.visible_to_marketplace),
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? row.created_date ?? '',
    createdBy: row.created_by ?? '',
    updatedAt: row.updated_at ?? row.modified_date ?? undefined,
    updatedBy: row.modified_by ?? undefined,
    usedInPricing: row.used_in_pricing ?? 0,
    usedInInvoices: row.used_in_invoices ?? 0,
    usedInBookings: row.used_in_bookings ?? 0,
    usedInQuotations: row.used_in_quotations ?? 0,
  };
}

function toServiceGroup(row: ServiceGroupRow): ServiceGroup {
  return {
    id: row.id,
    groupCode: row.group_code,
    groupName: row.group_name,
    description: row.description ?? '',
    defaultWhereUsed: parseJsonArray<WhereUsed>(row.default_where_used),
    defaultModes: parseJsonArray<TransportMode>(row.default_modes),
    isActive: toBool(row.is_active, true),
    createdBy: row.created_by ?? '',
    createdDate: row.created_date ?? '',
    modifiedBy: row.modified_by ?? undefined,
    modifiedDate: row.modified_date ?? undefined,
    usedInServices: toNum(row.used_in_services),
  };
}

function toApiPayload(p: Partial<Service>, extra: Record<string, any> = {}) {
  return {
    service_code: p.serviceCode,
    service_name: p.serviceName,
    service_group_id: p.serviceGroupId ?? null,
    category: p.category,
    transport_modes: p.transportModes ?? [],
    applies_to: p.appliesTo ?? [],
    charge_unit: p.chargeUnit,
    default_currency: p.defaultCurrency,
    buy_sell_type: p.buySellType,
    default_vat_rate: p.defaultVatRate ?? 0,
    default_gl_code: p.defaultGlCode ?? null,
    price_behavior: p.priceBehavior,
    pricing_model_id: p.pricingModelId ?? null,
    related_partner_types: p.relatedPartnerTypes ?? [],
    location_type: p.locationType,
    documentation_required: p.documentationRequired ? 1 : 0,
    mandatory_for_shipment_types: p.mandatoryForShipmentTypes ?? [],
    is_active: p.isActive == null ? 1 : (p.isActive ? 1 : 0),
    visible_to_sales: p.visibleToSales == null ? 1 : (p.visibleToSales ? 1 : 0),
    visible_to_marketplace: p.visibleToMarketplace ? 1 : 0,
    notes: p.notes ?? null,
    ...extra,
  };
}

function toGroupApiPayload(p: Partial<ServiceGroup>, extra: Record<string, any> = {}) {
  return {
    group_code: p.groupCode,
    group_name: p.groupName,
    description: p.description ?? null,
    default_where_used: p.defaultWhereUsed ?? [],
    default_modes: p.defaultModes ?? [],
    is_active: p.isActive == null ? 1 : (p.isActive ? 1 : 0),
    ...extra,
  };
}

export const servicesApi = {
  getAll: async (): Promise<Service[]> => {
    const rows = await api.get<ServiceRow[]>('/services');
    return rows.map(toService);
  },
  getById: async (id: string): Promise<Service> => {
    const row = await api.get<ServiceRow>(`/services/${id}`);
    return toService(row);
  },
  create: (data: Partial<Service>, createdBy?: string) =>
    api.post<{ id: string }>('/services', toApiPayload(data, { created_by: createdBy })),
  update: (id: string, data: Partial<Service>, modifiedBy?: string) =>
    api.put<{ message: string }>(`/services/${id}`, toApiPayload(data, { modified_by: modifiedBy })),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/services/${id}`),

  getAllGroups: async (): Promise<ServiceGroup[]> => {
    const rows = await api.get<ServiceGroupRow[]>('/services/groups');
    return rows.map(toServiceGroup);
  },
  createGroup: (data: Partial<ServiceGroup>, createdBy?: string) =>
    api.post<{ id: string }>('/services/groups', toGroupApiPayload(data, { created_by: createdBy })),
  updateGroup: (id: string, data: Partial<ServiceGroup>, modifiedBy?: string) =>
    api.put<{ message: string }>(`/services/groups/${id}`, toGroupApiPayload(data, { modified_by: modifiedBy })),
  deleteGroup: (id: string) =>
    api.delete<{ message: string }>(`/services/groups/${id}`),
};
