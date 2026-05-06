import { useState, useEffect, useCallback } from 'react';
import { Partner } from '../types/partner';
import { partnersApi } from '../services/partners';

// Module-level cache so helper functions (getCarriers, getClients, etc.)
// always have access to the latest fetched data.
let partnersCache: Partner[] = [];
let cacheVersion = 0; // bump to force re-fetch across hook instances

export function invalidatePartnersCache() {
  partnersCache = [];
  cacheVersion++;
}

/** @deprecated Use usePartners() hook instead */
export function setPartnersData(partners: Partner[]) {
  partnersCache = partners;
}

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>(partnersCache);
  const [loading, setLoading] = useState(partnersCache.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(cacheVersion);

  const fetchPartners = useCallback(async (force = false) => {
    if (!force && partnersCache.length > 0) {
      setPartners(partnersCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await partnersApi.getAll();
      partnersCache = data;
      setPartners(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners, version]);

  const refresh = useCallback(() => {
    partnersCache = [];
    cacheVersion++;
    setVersion(v => v + 1);
  }, []);

  return { partners, loading, error, refresh };
}

// ── Helper functions (use cache, safe to call outside React) ──────────────

export function getPartnersByCategory(category: string | string[]) {
  const categories = Array.isArray(category) ? category : [category];
  return partnersCache.filter(p =>
    p.partnerCategory && categories.includes(p.partnerCategory)
  );
}

const CARRIER_TYPES = ['Shipping Line', 'Air Carrier', 'Trucking Company', 'Rail Operator'];
const CLIENT_TYPES = ['Client', 'Buyer'];

export function getCarriers() {
  return partnersCache.filter(p =>
    p.partnerClass === 'Carrier' ||
    CARRIER_TYPES.includes(p.partnerType) ||
    CARRIER_TYPES.includes(p.partnerCategory ?? '')
  );
}

export function getClients() {
  return partnersCache
    .filter(p =>
      CLIENT_TYPES.includes(p.partnerType) ||
      CLIENT_TYPES.includes(p.partnerCategory ?? '')
    )
    .map(client => ({
      value: client.id,
      label: `${client.tradingName} (${client.city}, ${client.country})`,
    }));
}

export function getSuppliers() {
  const supplierCategories = [
    'Shipping Line', 'Air Carrier', 'Trucking Company', 'Rail Operator',
    'Overseas Agent', 'Customs Broker', 'Warehouse / Depot',
    'Insurance Company', 'Surveyor / Inspector', 'Special Services Provider',
  ];
  return partnersCache
    .filter(p => p.partnerCategory && supplierCategories.includes(p.partnerCategory))
    .map(supplier => ({
      value: supplier.id,
      label: `${supplier.tradingName} - ${supplier.partnerCategory}`,
    }));
}

export function getShippers() {
  return getPartnersByCategory(['Client', 'Buyer', 'Overseas Agent']);
}

export function getNotifyParties() {
  return partnersCache;
}
