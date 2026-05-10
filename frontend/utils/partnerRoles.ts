import { Partner, PartnerRole, PartnerType } from '../types/partner';

export const PARTNER_ROLE_OPTIONS: PartnerRole[] = ['Buyer', 'Seller'];

const LEGACY_BUYER_TYPES: PartnerType[] = ['Client', 'Buyer'];

export function derivePartnerRolesFromType(
  partnerType?: PartnerType,
  partnerCategory?: PartnerType,
): PartnerRole[] {
  const type = partnerType || partnerCategory;
  if (!type) return [];
  return LEGACY_BUYER_TYPES.includes(type) ? ['Buyer'] : ['Seller'];
}

export function normalizePartnerRoles(partner?: Partial<Partner> | null): PartnerRole[] {
  if (!partner) return [];
  if (Array.isArray(partner.partnerRoles)) {
    return PARTNER_ROLE_OPTIONS.filter((role) => partner.partnerRoles?.includes(role));
  }
  return derivePartnerRolesFromType(partner.partnerType, partner.partnerCategory);
}

export function hasPartnerRole(partner: Partial<Partner>, role: PartnerRole) {
  return normalizePartnerRoles(partner).includes(role);
}

export function isPartnerBuyer(partner: Partial<Partner>) {
  return hasPartnerRole(partner, 'Buyer');
}

export function isPartnerSeller(partner: Partial<Partner>) {
  return hasPartnerRole(partner, 'Seller');
}

export function samePartnerRoles(a: PartnerRole[], b: PartnerRole[]) {
  return a.length === b.length && a.every((role) => b.includes(role));
}
