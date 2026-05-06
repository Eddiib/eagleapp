import { ExchangeRateRow } from '../services/exchangeRates';

// Minimal FX converter.
// - Same-currency conversions short-circuit to identity.
// - Looks up the most recent rate on-or-before `asOfDate` (falls back to
//   the most recent rate overall if none match).
// - Amounts in an unknown currency pass through unchanged and get flagged
//   via the returned `missing` list so the caller can warn the user rather
//   than silently misreport totals.

export interface FxConversion {
  total: number;        // sum in base currency
  missing: string[];    // unique currencies with no rate to base
  base: string;
}

function pickRate(
  rows: ExchangeRateRow[],
  from: string,
  to: string,
  asOfDate?: string,
): number | null {
  if (from === to) return 1;
  const candidates = rows.filter(
    r => r.from_currency === from && r.to_currency === to,
  );
  if (candidates.length === 0) return null;
  if (!asOfDate) {
    candidates.sort((a, b) => b.effective_date.localeCompare(a.effective_date));
    return Number(candidates[0].rate);
  }
  const onOrBefore = candidates
    .filter(r => r.effective_date <= asOfDate)
    .sort((a, b) => b.effective_date.localeCompare(a.effective_date));
  if (onOrBefore.length) return Number(onOrBefore[0].rate);
  // Nothing on-or-before — fall back to the most recent available rate.
  candidates.sort((a, b) => b.effective_date.localeCompare(a.effective_date));
  return Number(candidates[0].rate);
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRateRow[],
  asOfDate?: string,
): number | null {
  const from = (fromCurrency || '').toUpperCase();
  const to = (toCurrency || '').toUpperCase();
  if (!from || !to) return null;
  const rate = pickRate(rates, from, to, asOfDate);
  return rate == null ? null : amount * rate;
}

export function sumToBase(
  items: Array<{ amount: number; currency: string; asOfDate?: string }>,
  baseCurrency: string,
  rates: ExchangeRateRow[],
): FxConversion {
  const base = baseCurrency.toUpperCase();
  const missing = new Set<string>();
  let total = 0;
  for (const item of items) {
    const converted = convertAmount(item.amount, item.currency, base, rates, item.asOfDate);
    if (converted == null) {
      missing.add((item.currency || '').toUpperCase() || 'UNKNOWN');
      continue;
    }
    total += converted;
  }
  return { total, missing: Array.from(missing), base };
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return amount.toLocaleString(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
