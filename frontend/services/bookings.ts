import { api, API_BASE_URL, authHeader } from './client';

// ── UI model (single source of truth used by booking components) ──────────────
// Booking statuses are configured at runtime (Settings → Booking Statuses),
// so this is an open string rather than a fixed union.
export type BookingStatus = string;
export type BookingServiceType = 'FCL' | 'LCL' | 'Air' | 'Road';

export interface BookingServiceLine {
  id?: string;
  serviceId: string;
  serviceName?: string;
  serviceCode?: string;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  notes?: string;
}

export interface EquipmentServiceLine {
  id?: string;
  serviceId?: string;
  serviceName?: string;
  serviceCode?: string;
  equipmentId?: string;
  equipmentName?: string;
  equipmentCode?: string;
  invoicePartyId?: string;
  invoicePartyName?: string;
  agreedRate?: number | null;
  supplierId?: string;
  supplierName?: string;
  agreedCost?: number | null;
  plannedDate?: string | null;
}

export interface BookingEquipmentLine {
  id?: string;
  equipmentId: string;
  equipmentName?: string;
  equipmentCode?: string;
  category?: string;
  quantity: number;
  // Equipment matrix columns
  containerId?: string;
  typeSize?: string;
  carrierId?: string;
  carrierName?: string;
  placeOfLoading?: string;
  finalDestination?: string;
  etd?: string;
  eta?: string;
  grossWeightKg?: number | null;
  volumeM3?: number | null;
  packages?: number | null;
  commodity?: string;
  // Weight & Dimensions sub-panel
  netWeight?: number | null;
  netWeightUnit?: string;
  lengthVal?: number | null;
  widthVal?: number | null;
  heightVal?: number | null;
  dimensionUnit?: string;
  totalVolume?: number | null;
  totalDensity?: number | null;
  // Services sub-panel
  equipmentServices?: EquipmentServiceLine[];
}

export interface BookingPartySummary {
  shipperId: string;
  shipperName?: string;
}

export interface BookingAttachment {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType?: string;
  sizeBytes?: number;
  docType?: string;
  docDate?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  serviceType: BookingServiceType;

  // Parties
  clientId: string;
  clientName: string;
  carrierId: string;
  carrierName?: string;
  shipperId: string;          // primary shipper (legacy column, auto-synced from shippers[0])
  shipperName?: string;
  consigneeId: string;
  consigneeName?: string;
  notifyPartyId: string;
  notifyPartyName?: string;
  shippers: BookingPartySummary[];

  // Refs / BL
  carrierRef: string;
  supplierRef: string;
  masterBl: string;
  houseBl: string;
  blType: string;
  blStatus: string;
  freightTerms: string;

  // Routing
  originCountry: string;
  originPort: string;
  destinationCountry: string;
  destinationPort: string;
  placeOfLoadingCity: string;
  placeOfLoadingCountry: string;
  finalDestination: string;
  origin: string;       // display-only: "country / port"
  destination: string;  // display-only

  // Dates
  bookingDate: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  cargoReadinessDate: string;

  // Cargo
  commodity: string;
  cargoNature: string;
  incoterm: string;

  // Money
  currency: string;
  totalRevenue: number;
  totalCost: number;
  totalContainers: number;

  // Text panels
  notes: string;
  internalNotes: string;
  freeTextComments: string;

  createdBy: string;
  assignedAgentId?: string;
  assignedAgentName?: string;

  // Lineage — where this booking originated
  sourceSalesLeadId?: string;
  sourceQuotationId?: string;

  services: BookingServiceLine[];
  equipment: BookingEquipmentLine[];
  attachments: BookingAttachment[];
}

// ── Backend row shape (read-only) ─────────────────────────────────────────────
interface BookingRow {
  id: string;
  booking_number: string;
  status: string;
  mode_of_transport?: string;
  client_id?: string;
  client_name?: string;
  carrier_id?: string;
  carrier_name?: string;
  shipper_id?: string;
  shipper_name?: string;
  consignee_id?: string;
  consignee_name?: string;
  notify_party_id?: string;
  notify_party_name?: string;
  origin_country?: string;
  origin_port?: string;
  destination_country?: string;
  destination_port?: string;
  place_of_loading_city?: string;
  place_of_loading_country?: string;
  final_destination?: string;
  booking_date?: string;
  etd?: string;
  eta?: string;
  cargo_readiness_date?: string;
  commodity?: string;
  cargo_nature?: string;
  incoterm?: string;
  carrier_ref?: string;
  supplier_ref?: string;
  master_bl?: string;
  house_bl?: string;
  bl_type?: string;
  bl_status?: string;
  freight_terms?: string;
  total_revenue?: number | string;
  total_cost?: number | string;
  currency?: string;
  notes?: string;
  internal_notes?: string;
  free_text_comments?: string;
  source_sales_lead_id?: string | null;
  source_quotation_id?: string | null;
  created_date?: string;
  created_by?: string;
  assigned_agent_id?: string | null;
  assigned_agent_name?: string | null;
  services?: any[];
  equipment?: any[];
  shippers?: any[];
  attachments?: any[];
}

interface NextBookingNumberRow {
  booking_number: string;
}

function mapServiceLine(row: any): BookingServiceLine {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name ?? undefined,
    serviceCode: row.service_code ?? undefined,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? undefined,
    quantity: Number(row.quantity ?? 1),
    unitPrice: Number(row.unit_price ?? 0),
    totalPrice: Number(row.total_price ?? 0),
    currency: row.currency ?? 'EUR',
    notes: row.notes ?? undefined,
  };
}

function mapEquipmentServiceLine(row: any): EquipmentServiceLine {
  return {
    id: row.id,
    serviceId: row.service_id ?? undefined,
    serviceName: row.service_name ?? undefined,
    serviceCode: row.service_code ?? undefined,
    equipmentId: row.equipment_id ?? undefined,
    equipmentName: row.equipment_name ?? undefined,
    equipmentCode: row.equipment_code ?? undefined,
    invoicePartyId: row.invoice_party_id ?? undefined,
    invoicePartyName: row.invoice_party_name ?? undefined,
    agreedRate: row.agreed_rate != null ? Number(row.agreed_rate) : null,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? undefined,
    agreedCost: row.agreed_cost != null ? Number(row.agreed_cost) : null,
    plannedDate: row.planned_date ? String(row.planned_date).slice(0, 10) : null,
  };
}

function mapEquipmentLine(row: any): BookingEquipmentLine {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment_name ?? undefined,
    equipmentCode: row.equipment_code ?? undefined,
    category: row.category ?? undefined,
    quantity: Number(row.quantity ?? 1),
    containerId: row.container_id ?? undefined,
    typeSize: row.type_size ?? undefined,
    carrierId: row.carrier_id ?? undefined,
    carrierName: row.carrier_name ?? undefined,
    placeOfLoading: row.place_of_loading ?? undefined,
    finalDestination: row.final_destination ?? undefined,
    etd: dateOnly(row.etd) || undefined,
    eta: dateOnly(row.eta) || undefined,
    grossWeightKg: row.gross_weight_kg != null ? Number(row.gross_weight_kg) : null,
    volumeM3: row.volume_m3 != null ? Number(row.volume_m3) : null,
    packages: row.packages != null ? Number(row.packages) : null,
    commodity: row.commodity ?? undefined,
    netWeight: row.net_weight != null ? Number(row.net_weight) : null,
    netWeightUnit: row.net_weight_unit ?? 'kg',
    lengthVal: row.length_val != null ? Number(row.length_val) : null,
    widthVal: row.width_val != null ? Number(row.width_val) : null,
    heightVal: row.height_val != null ? Number(row.height_val) : null,
    dimensionUnit: row.dimension_unit ?? 'cm',
    totalVolume: row.total_volume != null ? Number(row.total_volume) : null,
    totalDensity: row.total_density != null ? Number(row.total_density) : null,
    equipmentServices: (row.equipmentServices || []).map(mapEquipmentServiceLine),
  };
}

function mapShipper(row: any): BookingPartySummary {
  return {
    shipperId: row.shipper_id,
    shipperName: row.shipper_name ?? undefined,
  };
}

function mapAttachment(row: any): BookingAttachment {
  return {
    id: row.id,
    filename: row.filename,
    originalFilename: row.original_filename,
    mimeType: row.mime_type ?? undefined,
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : undefined,
    docType: row.doc_type ?? undefined,
    docDate: dateOnly(row.doc_date) || undefined,
    uploadedBy: row.uploaded_by ?? undefined,
    uploadedAt: row.uploaded_at ?? undefined,
  };
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function dateOnly(v?: string): string {
  if (!v) return '';
  const raw = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.split('T')[0];
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toBooking(row: BookingRow): Booking {
  const services = (row.services || []).map(mapServiceLine);
  const equipment = (row.equipment || []).map(mapEquipmentLine);
  const shippersFromRows = (row.shippers || []).map(mapShipper);
  const shippers = shippersFromRows.length > 0
    ? shippersFromRows
    : row.shipper_id
      ? [{ shipperId: row.shipper_id, shipperName: row.shipper_name ?? undefined }]
      : [];
  const attachments = (row.attachments || []).map(mapAttachment);
  const totalContainers = equipment.reduce((n, e) => n + (e.quantity || 0), 0);
  const originCountry = row.origin_country ?? '';
  const originPort = row.origin_port ?? '';
  const destinationCountry = row.destination_country ?? '';
  const destinationPort = row.destination_port ?? '';
  const status = (row.status || 'Draft') as BookingStatus;
  const serviceType = (row.mode_of_transport || 'FCL') as BookingServiceType;
  return {
    id: row.id,
    bookingNumber: row.booking_number,
    status,
    serviceType,
    clientId: row.client_id ?? '',
    clientName: row.client_name ?? '',
    carrierId: row.carrier_id ?? '',
    carrierName: row.carrier_name ?? '',
    shipperId: row.shipper_id ?? '',
    shipperName: row.shipper_name ?? '',
    consigneeId: row.consignee_id ?? '',
    consigneeName: row.consignee_name ?? '',
    notifyPartyId: row.notify_party_id ?? '',
    notifyPartyName: row.notify_party_name ?? '',
    shippers,
    carrierRef: row.carrier_ref ?? '',
    supplierRef: row.supplier_ref ?? '',
    masterBl: row.master_bl ?? '',
    houseBl: row.house_bl ?? '',
    blType: row.bl_type ?? '',
    blStatus: row.bl_status ?? '',
    freightTerms: row.freight_terms ?? '',
    originCountry,
    originPort,
    destinationCountry,
    destinationPort,
    placeOfLoadingCity: row.place_of_loading_city ?? '',
    placeOfLoadingCountry: row.place_of_loading_country ?? '',
    finalDestination: row.final_destination ?? '',
    origin: [originCountry, originPort].filter(Boolean).join(' / '),
    destination: [destinationCountry, destinationPort].filter(Boolean).join(' / '),
    bookingDate: dateOnly(row.booking_date) || dateOnly(row.created_date),
    estimatedDeparture: dateOnly(row.etd),
    estimatedArrival: dateOnly(row.eta),
    cargoReadinessDate: dateOnly(row.cargo_readiness_date),
    commodity: row.commodity ?? '',
    cargoNature: row.cargo_nature ?? '',
    incoterm: row.incoterm ?? '',
    notes: row.notes ?? '',
    internalNotes: row.internal_notes ?? '',
    freeTextComments: row.free_text_comments ?? '',
    currency: row.currency ?? 'EUR',
    totalRevenue: toNum(row.total_revenue),
    totalCost: toNum(row.total_cost),
    totalContainers,
    createdBy: row.created_by ?? '',
    assignedAgentId: row.assigned_agent_id ?? undefined,
    assignedAgentName: row.assigned_agent_name ?? undefined,
    sourceSalesLeadId: row.source_sales_lead_id ?? undefined,
    sourceQuotationId: row.source_quotation_id ?? undefined,
    services,
    equipment,
    attachments,
  };
}

export interface BookingPayload {
  bookingNumber?: string;
  status: BookingStatus;
  serviceType: BookingServiceType;

  clientId: string;
  carrierId?: string;
  shipperId?: string;
  consigneeId?: string;
  notifyPartyId?: string;
  shippers?: BookingPartySummary[];

  carrierRef?: string;
  supplierRef?: string;
  masterBl?: string;
  houseBl?: string;
  blType?: string;
  blStatus?: string;
  freightTerms?: string;

  originCountry?: string;
  originPort?: string;
  destinationCountry?: string;
  destinationPort?: string;
  placeOfLoadingCity?: string;
  placeOfLoadingCountry?: string;
  finalDestination?: string;

  bookingDate?: string;
  estimatedDeparture?: string;
  estimatedArrival?: string;
  cargoReadinessDate?: string;

  commodity?: string;
  cargoNature?: string;
  incoterm?: string;

  notes?: string;
  internalNotes?: string;
  freeTextComments?: string;

  currency?: string;
  totalRevenue?: number;
  totalCost?: number;

  sourceSalesLeadId?: string;
  sourceQuotationId?: string;
  assignedAgentId?: string;

  services: BookingServiceLine[];
  equipment: BookingEquipmentLine[];
}

// booking_number is intentionally omitted from create payloads — the backend
// auto-assigns the next sequential number (ESH0001, ESH0002, …) from the DB.
// It is only included when the caller explicitly wants to override (via `extra`).
function toApiPayload(p: BookingPayload, extra: Record<string, any> = {}) {
  return {
    status: p.status,
    mode_of_transport: p.serviceType,
    client_id: p.clientId || null,
    carrier_id: p.carrierId || null,
    shipper_id: p.shipperId || null,
    consignee_id: p.consigneeId || null,
    notify_party_id: p.notifyPartyId || null,

    carrier_ref: p.carrierRef || null,
    supplier_ref: p.supplierRef || null,
    master_bl: p.masterBl || null,
    house_bl: p.houseBl || null,
    bl_type: p.blType || null,
    bl_status: p.blStatus || null,
    freight_terms: p.freightTerms || null,

    origin_country: p.originCountry || null,
    origin_port: p.originPort || null,
    destination_country: p.destinationCountry || null,
    destination_port: p.destinationPort || null,
    place_of_loading_city: p.placeOfLoadingCity || null,
    place_of_loading_country: p.placeOfLoadingCountry || null,
    final_destination: p.finalDestination || null,

    booking_date: p.bookingDate || null,
    etd: p.estimatedDeparture || null,
    eta: p.estimatedArrival || null,
    cargo_readiness_date: p.cargoReadinessDate || null,

    commodity: p.commodity || null,
    cargo_nature: p.cargoNature || null,
    incoterm: p.incoterm || null,

    notes: p.notes || null,
    internal_notes: p.internalNotes || null,
    free_text_comments: p.freeTextComments || null,

    currency: p.currency || 'EUR',
    total_revenue: p.totalRevenue ?? 0,
    total_cost: p.totalCost ?? 0,

    source_sales_lead_id: p.sourceSalesLeadId || null,
    source_quotation_id: p.sourceQuotationId || null,
    assigned_agent_id: p.assignedAgentId || null,

    shippers: (p.shippers || []).map(s => ({ shipper_id: s.shipperId })),

    services: p.services.map(s => ({
      service_id: s.serviceId,
      supplier_id: s.supplierId || null,
      quantity: s.quantity,
      unit_price: s.unitPrice,
      total_price: s.totalPrice,
      currency: s.currency,
      notes: s.notes || null,
    })),
    equipment: p.equipment.map(e => ({
      equipment_id: e.equipmentId,
      quantity: e.quantity,
      container_id: e.containerId || null,
      type_size: e.typeSize || null,
      carrier_id: e.carrierId || null,
      place_of_loading: e.placeOfLoading || null,
      final_destination: e.finalDestination || null,
      etd: e.etd || null,
      eta: e.eta || null,
      gross_weight_kg: e.grossWeightKg ?? null,
      volume_m3: e.volumeM3 ?? null,
      packages: e.packages ?? null,
      commodity: e.commodity || null,
      net_weight: e.netWeight ?? null,
      net_weight_unit: e.netWeightUnit || 'kg',
      length_val: e.lengthVal ?? null,
      width_val: e.widthVal ?? null,
      height_val: e.heightVal ?? null,
      dimension_unit: e.dimensionUnit || 'cm',
      total_volume: e.totalVolume ?? null,
      total_density: e.totalDensity ?? null,
      equipment_services: (e.equipmentServices || []).map(s => ({
        id: s.id || undefined,
        service_id: s.serviceId || null,
        equipment_id: s.equipmentId || null,
        invoice_party_id: s.invoicePartyId || null,
        agreed_rate: s.agreedRate ?? null,
        supplier_id: s.supplierId || null,
        agreed_cost: s.agreedCost ?? null,
        planned_date: s.plannedDate || null,
      })),
    })),
    ...extra,
  };
}

export const bookingsApi = {
  getAll: async (): Promise<Booking[]> => {
    const rows = await api.get<BookingRow[]>('/bookings');
    return rows.map(toBooking);
  },
  getNextNumber: async (): Promise<string> => {
    const row = await api.get<NextBookingNumberRow>('/bookings/next-number');
    return row.booking_number;
  },
  getById: async (id: string): Promise<Booking> => {
    const row = await api.get<BookingRow>(`/bookings/${id}`);
    return toBooking(row);
  },
  create: (data: BookingPayload, createdBy?: string) =>
    api.post<{ id: string; message: string }>('/bookings', toApiPayload(data, { created_by: createdBy })),
  update: (id: string, data: BookingPayload, updatedBy?: string) =>
    api.put<{ message: string }>(`/bookings/${id}`, toApiPayload(data, {
      updated_by: updatedBy,
      booking_number: data.bookingNumber || undefined,
    })),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/bookings/${id}`),
  saveNotes: (id: string, internalNotes: string, freeTextComments: string) =>
    api.patch<{ message: string }>(`/bookings/${id}/notes`, {
      internal_notes: internalNotes || null,
      free_text_comments: freeTextComments || null,
    }),
};

export interface UploadAttachmentInput {
  file: File;
  docType?: string;
  docDate?: string;
  uploadedBy?: string;
}

export const bookingAttachmentsApi = {
  list: async (bookingId: string): Promise<BookingAttachment[]> => {
    const rows = await api.get<any[]>(`/bookings/${bookingId}/attachments`);
    return rows.map(mapAttachment);
  },
  upload: async (bookingId: string, input: UploadAttachmentInput): Promise<BookingAttachment> => {
    const form = new FormData();
    form.append('file', input.file);
    if (input.docType) form.append('doc_type', input.docType);
    if (input.docDate) form.append('doc_date', input.docDate);
    if (input.uploadedBy) form.append('uploaded_by', input.uploadedBy);
    const row = await api.postForm<any>(`/bookings/${bookingId}/attachments`, form);
    return mapAttachment(row);
  },
  delete: (bookingId: string, attachmentId: string) =>
    api.delete<{ message: string }>(`/bookings/${bookingId}/attachments/${attachmentId}`),
  // Download URL (auth header is added by <a> click handler — see Sidebar)
  downloadUrl: (bookingId: string, attachmentId: string) =>
    `${API_BASE_URL}/bookings/${bookingId}/attachments/${attachmentId}`,
  downloadHeaders: authHeader,
};

export function formatBookingNumber(sequence: number): string {
  return `ESH${String(Math.max(1, sequence)).padStart(4, '0')}`;
}

export function generateBookingNumber(sequence = 1): string {
  return formatBookingNumber(sequence);
}

export function emptyBooking(initialBookingNumber?: string, currency = 'EUR'): Booking {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: '',
    bookingNumber: initialBookingNumber || '',
    status: 'Pending',
    serviceType: 'FCL',
    clientId: '',
    clientName: '',
    carrierId: '',
    carrierName: '',
    shipperId: '',
    shipperName: '',
    consigneeId: '',
    consigneeName: '',
    notifyPartyId: '',
    notifyPartyName: '',
    shippers: [],
    carrierRef: '',
    supplierRef: '',
    masterBl: '',
    houseBl: '',
    blType: '',
    blStatus: '',
    freightTerms: '',
    originCountry: '',
    originPort: '',
    destinationCountry: '',
    destinationPort: '',
    placeOfLoadingCity: '',
    placeOfLoadingCountry: '',
    finalDestination: '',
    origin: '',
    destination: '',
    bookingDate: today,
    estimatedDeparture: '',
    estimatedArrival: '',
    cargoReadinessDate: '',
    commodity: '',
    cargoNature: '',
    incoterm: '',
    notes: '',
    internalNotes: '',
    freeTextComments: '',
    currency: currency.toUpperCase(),
    totalRevenue: 0,
    totalCost: 0,
    totalContainers: 0,
    createdBy: '',
    assignedAgentId: undefined,
    assignedAgentName: undefined,
    services: [],
    equipment: [],
    attachments: [],
  };
}

export function bookingToPayload(
  b: Booking,
  services: BookingServiceLine[],
  equipment: BookingEquipmentLine[]
): BookingPayload {
  return {
    // bookingNumber is carried through so edits can save a changed code.
    // App.tsx strips it from the create payload — new bookings are
    // auto-numbered by the backend.
    bookingNumber: b.bookingNumber,
    status: b.status,
    serviceType: b.serviceType,
    // The consignee is treated as the client — keep client_id mirrored to it.
    clientId: b.consigneeId || b.clientId,
    carrierId: b.carrierId || undefined,
    shipperId: b.shipperId || undefined,
    consigneeId: b.consigneeId || undefined,
    notifyPartyId: b.notifyPartyId || undefined,
    shippers: b.shippers,
    carrierRef: b.carrierRef,
    supplierRef: b.supplierRef,
    masterBl: b.masterBl,
    houseBl: b.houseBl,
    blType: b.blType,
    blStatus: b.blStatus,
    freightTerms: b.freightTerms,
    originCountry: b.originCountry,
    originPort: b.originPort,
    destinationCountry: b.destinationCountry,
    destinationPort: b.destinationPort,
    placeOfLoadingCity: b.placeOfLoadingCity,
    placeOfLoadingCountry: b.placeOfLoadingCountry,
    finalDestination: b.finalDestination,
    bookingDate: b.bookingDate || undefined,
    estimatedDeparture: b.estimatedDeparture || undefined,
    estimatedArrival: b.estimatedArrival || undefined,
    cargoReadinessDate: b.cargoReadinessDate || undefined,
    commodity: b.commodity,
    cargoNature: b.cargoNature,
    incoterm: b.incoterm,
    notes: b.notes,
    internalNotes: b.internalNotes,
    freeTextComments: b.freeTextComments,
    currency: b.currency,
    totalRevenue: b.totalRevenue,
    totalCost: b.totalCost,
    sourceSalesLeadId: b.sourceSalesLeadId,
    sourceQuotationId: b.sourceQuotationId,
    assignedAgentId: b.assignedAgentId,
    services,
    equipment,
  };
}
