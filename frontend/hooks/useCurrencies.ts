import { useCallback, useEffect, useMemo, useState } from 'react';
import { Currency, currenciesApi } from '../services/currencies';
import { useCompanySettings } from '../context/CompanySettingsContext';

// Safety net when the currencies endpoint ERRORS (network down, 500) — the
// union of the lists that used to be hardcoded per component before
// migration 027. Never used while the first fetch is merely in flight, so a
// deactivated currency can't flicker into dropdowns.
const FALLBACK_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'ALL', 'CNY', 'JPY', 'AED', 'TRY', 'CAD', 'AUD', 'SGD'];

// Module-level cache so multiple components reuse a single fetch. The list
// changes rarely (admin-managed), so a long-lived cache is fine. `fetched`
// distinguishes a legitimately empty table from "never loaded", and the
// shared in-flight promise ensures N simultaneous mounts issue one request.
let currenciesCache: Currency[] = [];
let cacheFetched = false;
let cacheVersion = 0;
let inflight: Promise<Currency[]> | null = null;
const currencyCacheListeners = new Set<() => void>();

export function invalidateCurrenciesCache() {
  currenciesCache = [];
  cacheFetched = false;
  inflight = null;
  cacheVersion++;
  currencyCacheListeners.forEach((listener) => listener());
}

function loadCurrenciesShared(): Promise<Currency[]> {
  if (!inflight) {
    inflight = currenciesApi.getAll()
      .then((data) => {
        currenciesCache = data;
        cacheFetched = true;
        return data;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>(currenciesCache);
  const [loading, setLoading] = useState(!cacheFetched);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(cacheVersion);

  const fetchCurrencies = useCallback(async () => {
    if (cacheFetched) {
      setCurrencies(currenciesCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await loadCurrenciesShared();
      setCurrencies(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load currencies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurrencies(); }, [fetchCurrencies, version]);

  useEffect(() => {
    const listener = () => setVersion(cacheVersion);
    currencyCacheListeners.add(listener);
    return () => { currencyCacheListeners.delete(listener); };
  }, []);

  const refresh = useCallback(() => {
    invalidateCurrenciesCache();
  }, []);

  return { currencies, loading, error, refresh };
}

/**
 * Dropdown options for currency selects: active currencies in admin-defined
 * order, with the company base currency pinned first. Pass `extra` values
 * (e.g. the currency already stored on the record being edited) so a
 * deactivated currency still renders instead of silently changing the value.
 *
 * While the list is loading, only the base currency plus extras are offered
 * (never the static fallback) so an admin-deactivated currency can't be
 * picked during the fetch window. The fallback applies only on fetch error.
 */
export function useCurrencyOptions(extra?: Array<string | null | undefined>): string[] {
  const { currencies, loading, error } = useCurrencies();
  const { baseCurrency } = useCompanySettings();
  const extraKey = (extra || []).filter(Boolean).join(',');

  return useMemo(() => {
    const active = currencies.filter((c) => c.isActive).map((c) => c.code);
    const pool = active.length > 0 ? active : (error && loading === false ? FALLBACK_CURRENCIES : []);
    const set = new Set<string>([baseCurrency, ...pool]);
    for (const code of extraKey.split(',')) {
      if (code) set.add(code.toUpperCase());
    }
    return Array.from(set).filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencies, loading, error, baseCurrency, extraKey]);
}
