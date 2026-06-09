import { api } from './client';

export type LeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Booked' | 'Lost' | 'Inactive';
export type LeadRanking = 'High' | 'Medium' | 'Low';
export type LeadSource = 'Expo' | 'Referral' | 'Website' | 'Cold Call' | 'Existing Client' | 'Other';
export type ContactType = 'Phone Call' | 'Email' | 'WhatsApp' | 'Physical Meeting' | 'Video Call' | 'Other';
export type NextAction = 'Send Quotation' | 'Follow-Up Call' | 'Schedule Meeting' | 'Waiting on Client' | 'Closed / Not Interested';

interface SalesLeadRow {
  id: string;
  lead_id: string;
  partner_id: string;
  assigned_sales_agent_id?: string | null;
  lead_status?: LeadStatus | null;
  lead_ranking?: LeadRanking | null;
  last_contact_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  client_name?: string | null;
  partner_code?: string | null;
  preferred_trades?: unknown;
  city?: string | null;
  country?: string | null;
  partner_status?: string | null;
  partner_assigned_agent_id?: string | null;
  effective_assigned_sales_agent_id?: string | null;
  assigned_sales_agent?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  meeting_minutes_count?: number | string | null;
  meetingMinutes?: SalesLeadMeetingMinuteRow[];
}

interface SalesLeadMeetingMinuteRow {
  id: string;
  sales_lead_id?: string | null;
  partner_id?: string | null;
  partner_name?: string | null;
  partner_trading_name?: string | null;
  sales_agent?: string | null;
  sales_agent_id?: string | null;
  sales_agent_full_name?: string | null;
  contact_type?: ContactType | null;
  meeting_date?: string | null;
  meeting_time?: string | null;
  summary?: string | null;
  client_needs?: string | null;
  next_action?: NextAction | null;
  next_action_date?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  // Extended fields
  meeting_type?: string | null;
  location?: string | null;
  duration_minutes?: number | string | null;
  purpose?: string | null;
  key_points?: string | null;
  proposed_solutions?: string | null;
  competitors_mentioned?: string | null;
  action_items?: unknown;
  communication_methods?: unknown;
  client_participants?: unknown;
  company_participants?: unknown;
  contact_person?: string | null;
  status?: 'draft' | 'completed' | 'follow-up-pending' | null;
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SalesLeadMeetingMinute {
  id: string;
  salesLeadId: string;
  partnerId: string;
  partnerName?: string;
  salesAgent: string;
  salesAgentId?: string;
  contactType: ContactType;
  meetingDate: string;
  meetingTime: string;
  summary: string;
  clientNeeds?: string;
  nextAction: NextAction;
  nextActionDate: string;
  createdAt: string;
  createdBy: string;
  // Extended fields
  meetingType?: string;
  location?: string;
  durationMinutes?: number;
  purpose?: string;
  keyPoints?: string;
  proposedSolutions?: string;
  competitorsMentioned?: string;
  actionItems: ActionItem[];
  communicationMethods: string[];
  clientParticipants: string[];
  companyParticipants: string[];
  contactPerson?: string;
  status: 'draft' | 'completed' | 'follow-up-pending';
}

export interface SalesLead {
  id: string;
  leadId: string;
  partnerId: string;
  clientName: string;
  partnerCode: string;
  preferredTrades: string[];
  city: string;
  country: string;
  email: string;
  phone: string;
  assignedSalesAgent: string;
  assignedSalesAgentId: string;
  partnerStatus: 'Active' | 'Passive';
  leadStatus: LeadStatus;
  leadRanking: LeadRanking;
  lastContactDate: string | null;
  createdAt: string;
  updatedAt: string;
  meetingMinutesCount: number;
  quotationCount: number;
  bookingCount: number;
  contactPerson?: string;
  mobile?: string;
  whatsapp?: string;
  assignedSalesPerson?: string;
  assignedSalesPersonId?: string;
  status?: LeadStatus;
  source?: LeadSource;
  potentialVolume?: string;
  potentialValue?: string;
  description?: string;
  notes?: string;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toDateOnly(value?: string | null): string {
  if (!value) return '';
  return String(value).split('T')[0];
}

function parseJsonField<T>(v: unknown, fallback: T): T {
  if (Array.isArray(v)) return v as unknown as T;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return fallback; }
  }
  return fallback;
}

function toMinute(row: SalesLeadMeetingMinuteRow): SalesLeadMeetingMinute {
  return {
    id: row.id,
    salesLeadId: row.sales_lead_id ?? '',
    partnerId: row.partner_id ?? '',
    partnerName: row.partner_trading_name ?? row.partner_name ?? undefined,
    salesAgent: row.sales_agent_full_name ?? row.sales_agent ?? '',
    salesAgentId: row.sales_agent_id ?? undefined,
    contactType: row.contact_type ?? 'Phone Call',
    meetingDate: toDateOnly(row.meeting_date),
    meetingTime: row.meeting_time ?? '',
    summary: row.summary ?? '',
    clientNeeds: row.client_needs ?? undefined,
    nextAction: row.next_action ?? 'Follow-Up Call',
    nextActionDate: toDateOnly(row.next_action_date),
    createdAt: row.created_at ?? '',
    createdBy: row.created_by ?? '',
    meetingType: row.meeting_type ?? undefined,
    location: row.location ?? undefined,
    durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : undefined,
    purpose: row.purpose ?? undefined,
    keyPoints: row.key_points ?? undefined,
    proposedSolutions: row.proposed_solutions ?? undefined,
    competitorsMentioned: row.competitors_mentioned ?? undefined,
    actionItems: parseJsonField<ActionItem[]>(row.action_items, []),
    communicationMethods: parseJsonField<string[]>(row.communication_methods, []),
    clientParticipants: parseJsonField<string[]>(row.client_participants, []),
    companyParticipants: parseJsonField<string[]>(row.company_participants, []),
    contactPerson: row.contact_person ?? undefined,
    status: row.status ?? 'draft',
  };
}

function toLead(row: SalesLeadRow): SalesLead {
  const assignedSalesAgentId =
    row.effective_assigned_sales_agent_id ?? row.assigned_sales_agent_id ?? row.partner_assigned_agent_id ?? '';

  return {
    id: row.id,
    leadId: row.lead_id,
    partnerId: row.partner_id,
    clientName: row.client_name ?? '',
    partnerCode: row.partner_code ?? '',
    preferredTrades: parseStringArray(row.preferred_trades),
    city: row.city ?? '',
    country: row.country ?? '',
    email: row.contact_email ?? '',
    phone: row.contact_phone ?? '',
    assignedSalesAgent: row.assigned_sales_agent ?? 'Unassigned',
    assignedSalesAgentId: assignedSalesAgentId,
    partnerStatus: row.partner_status === 'Active' ? 'Active' : 'Passive',
    leadStatus: row.lead_status ?? 'New',
    leadRanking: row.lead_ranking ?? 'Medium',
    lastContactDate: row.last_contact_date ? toDateOnly(row.last_contact_date) : null,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? row.created_at ?? '',
    meetingMinutesCount: Number(row.meeting_minutes_count ?? (Array.isArray(row.meetingMinutes) ? row.meetingMinutes.length : 0) ?? 0),
    quotationCount: 0,
    bookingCount: 0,
    contactPerson: row.contact_person ?? undefined,
    assignedSalesPerson: row.assigned_sales_agent ?? undefined,
    assignedSalesPersonId: assignedSalesAgentId || undefined,
    status: row.lead_status ?? 'New',
  };
}

function toLeadApiPayload(data: Partial<SalesLead>) {
  return {
    lead_id: data.leadId,
    partner_id: data.partnerId,
    assigned_sales_agent_id: data.assignedSalesAgentId ?? data.assignedSalesPersonId ?? null,
    lead_status: data.leadStatus ?? data.status ?? 'New',
    lead_ranking: data.leadRanking ?? 'Medium',
    last_contact_date: data.lastContactDate || null,
  };
}

function toMinuteApiPayload(data: Partial<SalesLeadMeetingMinute>) {
  return {
    partner_id: data.partnerId ?? null,
    sales_agent_id: data.salesAgentId ?? null,
    sales_agent: data.salesAgent ?? null,
    contact_type: data.contactType,
    meeting_date: data.meetingDate || null,
    meeting_time: data.meetingTime || null,
    summary: data.summary,
    client_needs: data.clientNeeds ?? null,
    next_action: data.nextAction,
    next_action_date: data.nextActionDate || null,
    created_by: data.createdBy ?? null,
    meeting_type: data.meetingType ?? null,
    location: data.location ?? null,
    duration_minutes: data.durationMinutes ?? null,
    purpose: data.purpose ?? null,
    key_points: data.keyPoints ?? null,
    proposed_solutions: data.proposedSolutions ?? null,
    competitors_mentioned: data.competitorsMentioned ?? null,
    action_items: data.actionItems ?? null,
    communication_methods: data.communicationMethods ?? null,
    client_participants: data.clientParticipants ?? null,
    company_participants: data.companyParticipants ?? null,
    contact_person: data.contactPerson ?? null,
    status: data.status ?? 'draft',
  };
}

export const salesLeadsApi = {
  getAll: async (): Promise<SalesLead[]> => {
    const rows = await api.get<SalesLeadRow[]>('/sales-leads');
    return rows.map(toLead);
  },
  getById: async (id: string): Promise<SalesLead & { meetingMinutes: SalesLeadMeetingMinute[] }> => {
    const row = await api.get<SalesLeadRow>(`/sales-leads/${id}`);
    return {
      ...toLead(row),
      meetingMinutes: Array.isArray(row.meetingMinutes) ? row.meetingMinutes.map(toMinute) : [],
    };
  },
  create: (data: Partial<SalesLead>) =>
    api.post<{ id: string; lead_id: string; message: string }>('/sales-leads', toLeadApiPayload(data)),
  update: (id: string, data: Partial<SalesLead>) =>
    api.put<{ message: string }>(`/sales-leads/${id}`, toLeadApiPayload(data)),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/sales-leads/${id}`),
  upsertFromPartner: (partnerId: string) =>
    api.post<{ id: string; lead_id: string; created: boolean }>(`/sales-leads/upsert-from-partner/${partnerId}`),
  // Bulk equivalent of upsertFromPartner — one request ensures every given
  // partner has a backing lead row (avoids one HTTP call per partner on load).
  syncFromPartners: (partnerIds: string[]) =>
    api.post<{ created: number }>(`/sales-leads/sync-from-partners`, { partnerIds }),
  getMinutes: async (leadId: string): Promise<SalesLeadMeetingMinute[]> => {
    const rows = await api.get<SalesLeadMeetingMinuteRow[]>(`/sales-leads/${leadId}/minutes`);
    return rows.map(toMinute);
  },
  createMinute: (leadId: string, data: Partial<SalesLeadMeetingMinute>) =>
    api.post<{ id: string; message: string }>(`/sales-leads/${leadId}/minutes`, toMinuteApiPayload(data)),
  getAllMinutes: async (): Promise<SalesLeadMeetingMinute[]> => {
    const rows = await api.get<SalesLeadMeetingMinuteRow[]>('/sales-leads/minutes');
    return rows.map(toMinute);
  },
  createStandaloneMinute: (data: Partial<SalesLeadMeetingMinute>) =>
    api.post<{ id: string; message: string }>('/sales-leads/minutes', toMinuteApiPayload(data)),
  updateMinute: (minuteId: string, data: Partial<SalesLeadMeetingMinute>) =>
    api.put<{ message: string }>(`/sales-leads/minutes/${minuteId}`, toMinuteApiPayload(data)),
  deleteMinute: (minuteId: string) =>
    api.delete<{ message: string }>(`/sales-leads/minutes/${minuteId}`),
};
