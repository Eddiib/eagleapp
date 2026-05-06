// Service domain — UI-driven contract (MVP source of truth).
// Backend schema mirrors these fields via snake_case columns.

export type ServiceCategory =
  | 'Main Freight'
  | 'Local Charge (Origin)'
  | 'Local Charge (Destination)'
  | 'Documentation'
  | 'Handling / Terminal'
  | 'Trucking'
  | 'Warehouse'
  | 'Value-Added Service';

export type TransportMode = 'Sea' | 'Air' | 'Road' | 'Rail' | 'Parcel' | 'Multimodal' | 'Barge' | 'Any';

export type AppliesTo = 'FCL' | 'LCL' | 'FTL' | 'LTL' | 'Rail' | 'Air' | 'Other' | 'Parcel';

export type ChargeUnit =
  | 'Per Container'
  | 'Per TEU'
  | 'Per FFE'
  | 'Per Truck'
  | 'Per BL / AWB'
  | 'Per Shipment'
  | 'Per Booking'
  | 'Per CBM'
  | 'Per Ton'
  | 'Per KG'
  | 'Per Pallet'
  | 'Per Document'
  | 'Per Day'
  | 'Per Hour';

export type BuySellType = 'Buy' | 'Sell' | 'Both';

export type PriceBehavior = 'Fixed' | 'Tiered' | 'Formula-based' | 'Formula';

export type LocationType =
  | 'Not location-specific'
  | 'At Origin'
  | 'At Destination'
  | 'In Transit';

// Partner-facing labels on a Service mirror the partner taxonomy. Re-export the
// PartnerType from types/partner.ts so the dropdowns here stay in sync with the
// Partners module and the backend VALID_PARTNER_TYPES enum.
import type { PartnerType } from './partner';
export type { PartnerType };

// "Where used" describes the lifecycle stage at which a service applies.
// Kept intentionally narrow — synonyms ('Container' vs 'Equipment/Container Time',
// 'Customs/Border' vs 'Customs/Border Passing Point') were removed to avoid
// fragmenting the data.
export type WhereUsed =
  | 'Booking'
  | 'Leg'
  | 'Container'
  | 'Port / Terminal'
  | 'Customs / Border'
  | 'Warehouse / Handling'
  | 'Documentation'
  | 'Finance / Invoicing'
  | 'Any';

export interface ServiceGroup {
  id: string;
  groupCode: string;
  groupName: string;
  description: string;
  defaultWhereUsed: WhereUsed[];
  defaultModes: TransportMode[];
  isActive: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy?: string;
  modifiedDate?: string;
  /** Derived count from the backend — services that link to this group. */
  usedInServices?: number;
}

export interface Service {
  id: string;
  serviceCode: string;
  serviceName: string;
  serviceGroupId?: string | null;

  category: ServiceCategory;
  transportModes: TransportMode[];
  appliesTo: AppliesTo[];

  chargeUnit: ChargeUnit;
  defaultCurrency: string;
  buySellType: BuySellType;
  defaultVatRate: number;
  defaultGlCode?: string;

  priceBehavior: PriceBehavior;
  pricingModelId?: string;

  relatedPartnerTypes: PartnerType[];
  locationType: LocationType;
  documentationRequired: boolean;
  mandatoryForShipmentTypes: AppliesTo[];

  isActive: boolean;
  visibleToSales: boolean;
  visibleToMarketplace: boolean;
  notes?: string;

  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;

  // Usage tracking (derived, read-only)
  usedInPricing?: number;
  usedInInvoices?: number;
  usedInBookings?: number;
  usedInQuotations?: number;
}
