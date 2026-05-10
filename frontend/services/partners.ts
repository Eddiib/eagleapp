import { api } from './client';
import { Partner } from '../types/partner';
import { normalizePartnerRoles } from '../utils/partnerRoles';

// ── DB row → camelCase Partner ────────────────────────────────────────────────
function mapContact(c: any) {
  return {
    id: c.id,
    name: c.name,
    position: c.position,
    phone: c.phone,
    email: c.email,
    isPrimary: c.is_primary === 1 || c.is_primary === true,
  };
}

function mapBank(b: any) {
  return {
    id: b.id,
    bankName: b.bank_name,
    iban: b.iban,
    swift: b.swift,
    accountNumber: b.account_number,
    currency: b.currency,
    intermediaryBankName: b.intermediary_bank_name,
    intermediarySwift: b.intermediary_swift,
    isDefault: b.is_default === 1 || b.is_default === true,
  };
}

function mapDocument(d: any) {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    url: d.url,
    uploadedDate: d.uploaded_date ?? d.uploadedDate ?? '',
    uploadedBy: d.uploaded_by ?? d.uploadedBy ?? '',
  };
}

function mapAddress(a: any) {
  return {
    id: a.id,
    addressName: a.address_name,
    fullAddress: a.full_address,
    city: a.city,
    country: a.country,
    zipCode: a.zip_code,
    contactPerson: a.contact_person,
    contactPhone: a.contact_phone,
    isDefault: a.is_default === 1 || a.is_default === true,
  };
}

export function toPartner(row: any): Partner {
  let mainTrades: string[] = [];
  try {
    if (Array.isArray(row.main_trades)) {
      mainTrades = row.main_trades;
    } else if (typeof row.main_trades === 'string' && row.main_trades) {
      mainTrades = JSON.parse(row.main_trades);
    }
  } catch { mainTrades = []; }

  let partnerRoles;
  try {
    if (Array.isArray(row.partner_roles)) {
      partnerRoles = row.partner_roles;
    } else if (typeof row.partner_roles === 'string' && row.partner_roles) {
      partnerRoles = JSON.parse(row.partner_roles);
    }
  } catch { partnerRoles = undefined; }

  const partner = {
    partnerType: row.partner_type,
    partnerCategory: row.partner_category || row.partner_type,
    partnerRoles,
  };

  return {
    id: row.id,
    partnerCode: row.partner_code,
    companyLegalName: row.company_legal_name,
    tradingName: row.trading_name,
    businessNumber: row.business_number,
    eoriNumber: row.eori_number,
    partnerType: row.partner_type,
    partnerClass: row.partner_class || undefined,
    partnerRoles: normalizePartnerRoles(partner),
    partnerCategory: row.partner_category || row.partner_type,
    country: row.country,
    city: row.city,
    address: row.address,
    zipCode: row.zip_code,
    website: row.website,
    taxNumber: row.tax_number,
    registrationNumber: row.registration_number,
    assignedAgentId: row.assigned_agent_id,
    paymentTerms: row.payment_terms,
    paymentTermsAsSupplier: row.payment_terms_as_supplier,
    paymentTermsAsClient: row.payment_terms_as_client,
    creditTerms: row.credit_terms,
    currency: row.currency,
    defaultServiceType: row.default_service_type,
    mainTrades,
    notes: row.notes,
    status: row.status,
    rating: row.rating,
    openBalance: row.open_balance,
    creditLimit: row.credit_limit,
    createdDate: row.created_date,
    createdBy: row.created_by,
    lastUpdatedDate: row.last_updated_date,
    lastUpdatedBy: row.last_updated_by,
    lastActivityDate: row.last_activity_date,
    contacts: Array.isArray(row.contacts) ? row.contacts.map(mapContact) : [],
    bankDetails: Array.isArray(row.bankDetails) ? row.bankDetails.map(mapBank) : [],
    deliveryAddresses: Array.isArray(row.deliveryAddresses) ? row.deliveryAddresses.map(mapAddress) : [],
    documents: Array.isArray(row.documents) ? row.documents.map(mapDocument) : [],
    activityLog: Array.isArray(row.activityLog) ? row.activityLog : [],
    tradeMarketInfo: Array.isArray(row.tradeMarketInfo) ? row.tradeMarketInfo : [],
  } as Partner;
}

// ── camelCase Partner → snake_case API payload ────────────────────────────────
// Notes:
//  • partner_code is no longer sent — backend assigns one on create and the
//    column is immutable afterwards.
//  • partner_category / payment_terms (legacy) are not sent — the backend
//    mirrors them from partner_type / payment_terms_as_supplier respectively.
//  • open_balance is derived from invoices/payments — the form does not write it.
export function toApiPayload(p: Partial<Partner>, extra: Record<string, any> = {}) {
  return {
    company_legal_name: p.companyLegalName,
    trading_name: p.tradingName,
    business_number: p.businessNumber,
    eori_number: p.eoriNumber,
    partner_type: p.partnerType,
    partner_class: p.partnerClass || null,
    partner_roles: normalizePartnerRoles(p),
    country: p.country,
    city: p.city,
    address: p.address,
    zip_code: p.zipCode,
    website: p.website,
    tax_number: p.taxNumber,
    registration_number: p.registrationNumber,
    assigned_agent_id: p.assignedAgentId,
    payment_terms_as_supplier: p.paymentTermsAsSupplier,
    payment_terms_as_client: p.paymentTermsAsClient,
    credit_terms: p.creditTerms,
    currency: p.currency,
    default_service_type: p.defaultServiceType,
    main_trades: p.mainTrades || [],
    notes: p.notes,
    status: p.status,
    rating: p.rating,
    credit_limit: p.creditLimit,
    contacts: p.contacts || [],
    bankDetails: p.bankDetails || [],
    deliveryAddresses: p.deliveryAddresses || [],
    tradeMarketInfo: p.tradeMarketInfo || [],
    documents: p.documents || [],
    ...extra,
  };
}

// ── API client ────────────────────────────────────────────────────────────────
export const partnersApi = {
  getAll: async (): Promise<Partner[]> => {
    const rows = await api.get<any[]>('/partners');
    return rows.map(toPartner);
  },
  getById: async (id: string): Promise<Partner> => {
    const row = await api.get<any>(`/partners/${id}`);
    return toPartner(row);
  },
  create: (data: Partial<Partner>, createdBy?: string) =>
    api.post<{ id: string; message: string }>('/partners', toApiPayload(data, { created_by: createdBy })),
  update: (id: string, data: Partial<Partner>, updatedBy?: string) =>
    api.put<{ message: string }>(`/partners/${id}`, toApiPayload(data, { last_updated_by: updatedBy })),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/partners/${id}`),
};
