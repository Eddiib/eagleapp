// Partner taxonomy. The UI uses these specific values as the primary "partner type"
// filter in selectors (ClientSelector, PartnerSelector) and in lead/booking flows.
// The two high-level axes ('Carrier' | 'Non Carrier') are retained on `partnerClass`
// for backend reporting; `partnerType` is the granular category.
export type PartnerClass = 'Carrier' | 'Non Carrier';

export type PartnerType =
  | 'Client'
  | 'Buyer'
  | 'Shipping Line'
  | 'Air Carrier'
  | 'Trucking Company'
  | 'Rail Operator'
  | 'Overseas Agent'
  | 'Customs Broker'
  | 'Warehouse / Depot'
  | 'Insurance Company'
  | 'Surveyor / Inspector'
  | 'Special Services Provider'
  | 'Other';

export type PartnerCategory = PartnerType;

export type PartnerStatus = 'Active' | 'Suspended' | 'Blacklisted' | 'Archived';

export type PaymentTerms = 'Prepaid' | '15 Days' | '30 Days' | '60 Days';

export type DefaultServiceType = 'Sea' | 'Air' | 'Road' | 'Rail';

export interface PartnerContact {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface DeliveryAddress {
  id: string;
  addressName: string; // e.g., "IKEA Warehouse 2", "Distribution Center North"
  fullAddress: string;
  city: string;
  country: string;
  zipCode: string;
  contactPerson?: string;
  contactPhone?: string;
  isDefault: boolean;
}

export interface PartnerBankDetails {
  id: string;
  bankName: string;
  iban: string;
  swift: string;
  accountNumber?: string;
  currency: string;
  intermediaryBankName?: string;
  intermediarySwift?: string;
  isDefault: boolean;
}

export interface PartnerDocument {
  id: string;
  name: string;
  type: 'Contract' | 'LOA' | 'Certificate' | 'License' | 'Other';
  url: string;
  uploadedDate: string;
  uploadedBy: string;
}

// Future-proof structure for trade lane pairs (origin -> destination)
export interface TradeLanePair {
  origin: string; // Country code
  destination: string; // Country code
}

export interface LinkedBooking {
  id: string;
  bookingNumber: string;
  customer: string;
  origin: string;
  destination: string;
  status: string;
  createdDate: string;
}

export interface LinkedQuotation {
  id: string;
  quoteNumber: string;
  customer: string;
  validUntil: string;
  amount: number;
  currency: string;
  status: string;
}

export interface FinancialRecord {
  id: string;
  type: 'Payable' | 'Receivable';
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
}

export interface DisputeRecord {
  id: string;
  disputeNumber: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdDate: string;
  resolvedDate?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ActivityLog {
  id: string;
  action: 'Create' | 'Edit' | 'Status Change' | 'Delete' | 'Document Upload' | 'Note Added';
  description: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

export interface TradeMarketInfo {
  id: string;
  countryOfOrigin?: string; // Country code
  countryOfDestination?: string; // Country code
  placeOfLoading?: string; // Free text
  pol?: string; // Port of Loading - UN/LOCODE
  pod?: string; // Port of Discharge - UN/LOCODE
  finalDestination?: string; // Free text
  totalAnnualVolume?: string; // e.g., "500 TEU", "1,000 CBM"
  preferredCarrierId?: string; // Partner ID filtered by Partner Type = Carrier
  preferredCorridor?: string; // Free text
  modeOfTransport?: 'Sea' | 'Air' | 'Road' | 'Rail' | 'Intermodal';
  modeOfTrailer?: 'Curtain Sider' | 'Box Trailer' | 'Flatbed' | 'Reefer' | 'Tanker' | 'Lowbed';
}

export interface Partner {
  id: string;
  partnerCode: string;
  companyLegalName: string;
  tradingName: string;
  businessNumber?: string; // Company/Business Registration Number
  eoriNumber?: string; // EORI Number for EU customs
  partnerType: PartnerType;
  partnerClass?: PartnerClass; // High-level carrier/non-carrier axis
  partnerCategory?: PartnerCategory; // Back-compat alias for partnerType
  country: string;
  city: string;
  address: string;
  zipCode?: string;
  contacts: PartnerContact[];
  website?: string;
  taxNumber: string;
  registrationNumber: string;
  
  // Assigned Agent
  assignedAgentId?: string; // Employee ID from HR/Employees
  
  // Payment terms
  paymentTerms: PaymentTerms; // Keep for backward compatibility
  paymentTermsAsSupplier?: PaymentTerms; // When they are our supplier
  paymentTermsAsClient?: PaymentTerms; // When they are our client
  creditTerms?: string; // Additional credit terms details
  
  currency: string;
  bankDetails: PartnerBankDetails[]; // Changed to array for multiple banks
  deliveryAddresses?: DeliveryAddress[]; // Multiple delivery addresses
  defaultServiceType: DefaultServiceType;
  
  // Trade & Market Information
  mainTrades?: string[]; // Array of country codes representing preferred trade lanes
  // Future expansion: can support TradeLanePair[] for origin->destination matching
  tradeMarketInfo?: TradeMarketInfo[];
  
  notes: string;
  status: PartnerStatus;
  rating: number; // 1-5
  openBalance: number;
  creditLimit?: number;
  
  // Linked data
  linkedBookings?: LinkedBooking[];
  linkedQuotations?: LinkedQuotation[];
  financialRecords?: FinancialRecord[];
  disputes?: DisputeRecord[];
  documents?: PartnerDocument[];
  
  // Metadata
  createdDate: string;
  createdBy: string;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  lastActivityDate?: string;
  activityLog?: ActivityLog[];
}

export interface PartnerFilters {
  searchTerm: string;
  partnerType: PartnerType | 'All';
  status: PartnerStatus | 'All';
  country: string;
  rating: number | null;
  preferredTrade?: string; // Filter by main/preferred trade country
}