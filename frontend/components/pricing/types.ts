// Pricing Department Type Definitions

export type TransportMode = 
  | 'FCL' 
  | 'LCL' 
  | 'FTL' 
  | 'LTL' 
  | 'AIR' 
  | 'PARCEL' 
  | 'RAIL' 
  | 'BULK' 
  | 'SPECIAL';

export type LoadStatus = 
  | 'Open' 
  | 'Quoting' 
  | 'Offers Received' 
  | 'Rate Selected' 
  | 'Closed';

export type QuoteStatus = 
  | 'Received' 
  | 'Declined' 
  | 'Accepted' 
  | 'Expired';

export interface Load {
  id: string;
  loadNumber: string;
  
  // Client Information
  clientName: string;
  salesPerson?: string;
  relatedQuotationId?: string;
  relatedBookingId?: string;
  
  // Load Specifications
  mode: TransportMode;
  origin: string;
  destination: string;
  transshipment?: string;
  
  // Equipment/Service Details
  equipmentType: string; // Container size, Truck type, ULD, etc.
  quantity: number;
  volume?: number; // CBM
  weight?: number; // KG
  weightUnit?: 'kg' | 'ton' | 'lbs';
  
  // Cargo Details
  cargoNature: string;
  hazardous?: boolean;
  temperature?: string; // For reefer
  
  // Requirements
  incoterm?: string;
  requiredDate: string;
  transitTime?: number; // days
  
  // Status & Tracking
  status: LoadStatus;
  postedDate?: string;
  closedDate?: string;
  
  // Notes
  salesNotes?: string;
  pricingNotes?: string;
  
  // Supplier Quotes
  quotes?: SupplierQuote[];
  selectedQuoteId?: string;
  
  // Audit
  createdDate: string;
  lastUpdated: string;
  createdBy?: string;
}

export interface SupplierQuote {
  id: string;
  loadId: string;
  
  // Supplier Information
  supplierId: string;
  supplierName: string;
  carrierName?: string; // Added for carrier information
  
  // Quote Details
  mode: TransportMode;
  offeredRate: number;
  currency: string;
  
  // Service Details
  transitTime?: number; // days
  validityDate: string;
  equipmentAvailableDate?: string; // Added for equipment availability
  
  // Costs Breakdown
  baseRate: number;
  surcharges?: Surcharge[];
  totalRate: number;
  
  // Additional Info
  remarks?: string;
  attachments?: string[]; // File paths or URLs
  
  // Status
  status: QuoteStatus;
  declineReason?: string;
  
  // Audit
  receivedDate: string;
  respondedDate?: string;
  respondedBy?: string;
}

export interface Surcharge {
  id: string;
  name: string;
  amount: number;
  currency: string;
  unit?: string; // per container, per CBM, per kg, etc.
  mandatory: boolean;
}

export interface BuyRateContract {
  id: string;
  contractNumber: string;
  
  // Supplier & Mode
  supplierId: string;
  supplierName: string;
  mode: TransportMode;
  
  // Routing
  origin: string;
  destination: string;
  
  // Service Type
  equipmentType: string;
  serviceLevel?: string; // Standard, Express, Economy
  
  // Rates
  baseRate: number;
  currency: string;
  surcharges?: Surcharge[];
  totalRate: number;
  
  // Validity
  validFrom: string;
  validTo: string;
  
  // Service Details
  transitTime?: number;
  frequency?: string; // Daily, Weekly, etc.
  
  // Contract Info
  contractFile?: string;
  notes?: string;
  
  // Status
  isActive: boolean;
  
  // Audit
  createdDate: string;
  lastUpdated: string;
  createdBy?: string;
}

export interface PricingModel {
  id: string;
  modelName: string;
  mode: TransportMode;
  
  // Calculation Rules
  calculationType: 'per_unit' | 'per_weight' | 'per_volume' | 'whichever_greater' | 'custom';
  baseUnit: string; // container, kg, cbm, pallet, etc.
  
  // Formula Components
  baseRateFormula?: string;
  surchargeRules?: SurchargeRule[];
  
  // Special Rules
  minimumCharge?: number;
  roundingRule?: 'up' | 'down' | 'nearest';
  roundingIncrement?: number;
  
  // Validity
  defaultValidityDays: number;
  
  // Usage
  isActive: boolean;
  description?: string;
  
  // Audit
  createdDate: string;
  lastUpdated: string;
}

export interface SurchargeRule {
  id: string;
  name: string;
  applicableWhen?: string; // Condition description
  calculationMethod: 'fixed' | 'percentage' | 'per_unit' | 'tiered';
  value: number;
  currency?: string;
}

export interface RFQRequest {
  loadId: string;
  supplierIds: string[];
  offerDeadline: string;
  notes?: string;
  publishPublicly: boolean;
}

export interface SupplierInfo {
  id: string;
  name: string;
  type: 'carrier' | 'freight_forwarder' | 'broker' | 'warehouse' | 'other';
  specializations: TransportMode[];
  
  // Contact
  contactPerson?: string;
  email?: string;
  phone?: string;
  
  // Service Coverage
  servicedRoutes?: Route[];
  servicedCountries?: string[];
  
  // Performance Metrics
  rating?: number; // 1-5
  onTimePerformance?: number; // percentage
  responseTime?: number; // hours
  
  // Status
  isActive: boolean;
  portalAccess: boolean; // Future: Can log in to submit quotes
  
  // Audit
  createdDate: string;
  lastUpdated: string;
}

export interface Route {
  origin: string;
  destination: string;
  modes: TransportMode[];
}