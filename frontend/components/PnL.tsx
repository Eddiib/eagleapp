import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { invoicesApi, Invoice } from '../services/invoices';
import { costControlApi, CostEntry } from '../services/costControl';
import { exchangeRatesApi, ExchangeRateRow } from '../services/exchangeRates';
import { sumToBase, formatCurrency } from '../lib/fx';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { ColumnHeader } from './ui/ColumnHeader';
import { useTableControls, ColumnDef } from '../hooks/useTableControls';

// Revenue comes from Sales invoices that are no longer drafts and haven't been
// cancelled/voided. Cost comes from every cost_control entry (accrual basis —
// disputed/pending costs are still committed spend until the dispute resolves).
const REVENUE_INVOICE_TYPE = 'Sales';
const REVENUE_STATUSES: Array<Invoice['status']> = ['Sent', 'Paid', 'Overdue'];

interface PerBooking {
  bookingId: string;
  bookingNumber: string;
  clientName?: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  missing: string[];
}

function toIso(d: string | undefined | null): string {
  if (!d) return '';
  return String(d).split('T')[0];
}

function defaultFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

function defaultTo(): string {
  return new Date().toISOString().split('T')[0];
}

export function PnL() {
  const { baseCurrency: BASE_CURRENCY } = useCompanySettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [bookingOnly, setBookingOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      invoicesApi.getAll(),
      costControlApi.getAll(),
      exchangeRatesApi.getAll().catch(() => [] as ExchangeRateRow[]),
    ])
      .then(([inv, cc, rt]) => {
        setInvoices(inv);
        setCosts(cc);
        setRates(rt);
      })
      .catch(err => setError(err?.message || 'Failed to load P&L data'))
      .finally(() => setLoading(false));
  }, []);

  const { totals, perBooking, unassignedRevenue, unassignedCost, missingRates } = useMemo(() => {
    const fromD = from || '0000-01-01';
    const toD   = to   || '9999-12-31';

    const revenueItems = invoices
      .filter(inv =>
        inv.invoiceType === REVENUE_INVOICE_TYPE &&
        REVENUE_STATUSES.includes(inv.status) &&
        toIso(inv.invoiceDate) >= fromD &&
        toIso(inv.invoiceDate) <= toD,
      )
      .map(inv => ({
        bookingId: inv.bookingId,
        bookingNumber: inv.bookingNumber,
        clientName: inv.clientName,
        amount: inv.totalAmount,
        currency: inv.currency,
        asOfDate: toIso(inv.invoiceDate),
      }));

    const costItems = costs
      .filter(c => {
        const d = toIso(c.invoiceDate) || toIso(c.createdAt);
        return (!d || (d >= fromD && d <= toD));
      })
      .map(c => ({
        bookingId: c.bookingId,
        bookingNumber: c.bookingNumber,
        amount: c.amount * (c.quantity || 1),
        currency: c.currency,
        asOfDate: toIso(c.invoiceDate) || toIso(c.createdAt) || undefined,
      }));

    const revenueTotal = sumToBase(revenueItems, BASE_CURRENCY, rates);
    const costTotal    = sumToBase(costItems,    BASE_CURRENCY, rates);

    const byBooking = new Map<string, PerBooking>();
    const ensure = (id: string | undefined, num: string | undefined, client?: string): PerBooking | null => {
      if (!id || !num) return null;
      const existing = byBooking.get(id);
      if (existing) return existing;
      const fresh: PerBooking = {
        bookingId: id,
        bookingNumber: num,
        clientName: client,
        revenue: 0, cost: 0, profit: 0, margin: 0, missing: [],
      };
      byBooking.set(id, fresh);
      return fresh;
    };

    let unassignedRev = 0;
    let unassignedCst = 0;

    for (const item of revenueItems) {
      const row = ensure(item.bookingId, item.bookingNumber, item.clientName);
      const fx = sumToBase([{ amount: item.amount, currency: item.currency, asOfDate: item.asOfDate }], BASE_CURRENCY, rates);
      if (!row) {
        unassignedRev += fx.total;
        continue;
      }
      row.revenue += fx.total;
      if (!row.clientName && item.clientName) row.clientName = item.clientName;
      for (const m of fx.missing) if (!row.missing.includes(m)) row.missing.push(m);
    }

    for (const item of costItems) {
      const row = ensure(item.bookingId, item.bookingNumber);
      const fx = sumToBase([{ amount: item.amount, currency: item.currency, asOfDate: item.asOfDate }], BASE_CURRENCY, rates);
      if (!row) {
        unassignedCst += fx.total;
        continue;
      }
      row.cost += fx.total;
      for (const m of fx.missing) if (!row.missing.includes(m)) row.missing.push(m);
    }

    const perBooking = Array.from(byBooking.values()).map(r => {
      r.profit = r.revenue - r.cost;
      r.margin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
      return r;
    });
    perBooking.sort((a, b) => b.profit - a.profit);

    const missing = Array.from(new Set([...revenueTotal.missing, ...costTotal.missing]));

    return {
      totals: {
        revenue: revenueTotal.total,
        cost:    costTotal.total,
        profit:  revenueTotal.total - costTotal.total,
        margin:  revenueTotal.total > 0 ? ((revenueTotal.total - costTotal.total) / revenueTotal.total) * 100 : 0,
      },
      perBooking,
      unassignedRevenue: unassignedRev,
      unassignedCost: unassignedCst,
      missingRates: missing,
    };
  }, [invoices, costs, rates, from, to, BASE_CURRENCY]);

  const searchFiltered = bookingOnly ? perBooking.filter(r => r.revenue > 0 || r.cost > 0) : perBooking;

  // Column descriptors drive the header sort/filter dropdowns. Each `get` returns the
  // same display string shown in the cell; money/margin columns sort on raw numbers.
  const columnDefs = useMemo<ColumnDef<PerBooking>[]>(() => ([
    { key: 'bookingNumber', label: 'Booking', align: 'left', get: (r) => r.bookingNumber, filterable: false },
    { key: 'clientName', label: 'Client', align: 'left', get: (r) => r.clientName || '—' },
    { key: 'revenue', label: 'Revenue', align: 'right', get: (r) => formatCurrency(r.revenue, BASE_CURRENCY), sortValue: (r) => r.revenue ?? 0 },
    { key: 'cost', label: 'Cost', align: 'right', get: (r) => formatCurrency(r.cost, BASE_CURRENCY), sortValue: (r) => r.cost ?? 0 },
    { key: 'profit', label: 'Profit', align: 'right', get: (r) => formatCurrency(r.profit, BASE_CURRENCY), sortValue: (r) => r.profit ?? 0 },
    { key: 'margin', label: 'Margin', align: 'right', get: (r) => r.revenue > 0 ? `${r.margin.toFixed(1)}%` : '—', sortValue: (r) => r.margin ?? 0 },
  ]), [BASE_CURRENCY]);

  // Column-level Excel-style filters + AZ/ZA sorting (shared across all list tables).
  const {
    processed: displayedRows,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sortDirFor,
    toggleSort,
  } = useTableControls(searchFiltered, columnDefs);

  const kpiCard = (label: string, value: string, Icon: any, tone: 'neutral' | 'good' | 'bad' = 'neutral') => {
    const toneClass =
      tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' :
      tone === 'bad'  ? 'text-red-600 dark:text-red-400' :
                        'text-gray-900 dark:text-gray-100';
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</div>
          <Icon className={`w-4 h-4 ${toneClass}`} />
        </div>
        <div className={`mt-2 text-xl tabular-nums ${toneClass}`}>{value}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-gray-100">Profit &amp; Loss</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Revenue from Sales invoices (Sent / Paid / Overdue) vs. all cost-control entries, normalized to {BASE_CURRENCY} using the exchange rates table. Drafts, voided and cancelled invoices are excluded.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={bookingOnly} onChange={e => setBookingOnly(e.target.checked)} />
              Hide zero-activity bookings
            </label>
            {activeColumnFilterCount > 0 && (
              <button
                onClick={clearAllColumnFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                title="Clear all column filters"
              >
                Clear filters ({activeColumnFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {missingRates.length > 0 && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-3 flex items-start gap-2 text-sm text-yellow-900 dark:text-yellow-100">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            Totals exclude rows priced in <strong>{missingRates.join(', ')}</strong> — no FX rate to {BASE_CURRENCY} configured.
            Add rates under Financials → Exchange Rates.
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading P&amp;L…
        </div>
      ) : error ? (
        <div className="py-12 flex items-center justify-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {kpiCard('Revenue', formatCurrency(totals.revenue, BASE_CURRENCY), DollarSign)}
            {kpiCard('Cost',    formatCurrency(totals.cost,    BASE_CURRENCY), DollarSign)}
            {kpiCard('Profit',  formatCurrency(totals.profit,  BASE_CURRENCY),
                     totals.profit >= 0 ? TrendingUp : TrendingDown,
                     totals.profit >= 0 ? 'good' : 'bad')}
            {kpiCard('Margin',  `${totals.margin.toFixed(1)}%`, Percent,
                     totals.margin >= 0 ? 'good' : 'bad')}
          </div>

          {(unassignedRevenue !== 0 || unassignedCost !== 0) && (
            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 text-xs text-gray-600 dark:text-gray-400">
              Unassigned to any booking in the selected period —
              revenue: <span className="tabular-nums">{formatCurrency(unassignedRevenue, BASE_CURRENCY)}</span>,
              cost: <span className="tabular-nums">{formatCurrency(unassignedCost, BASE_CURRENCY)}</span>.
              These are included in the totals above but not in the per-booking table.
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {displayedRows.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                No bookings with activity in the selected period.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {columnDefs.map(def => (
                      <th key={def.key} className={`px-4 py-3 text-xs text-gray-500 uppercase tracking-wider ${def.align === 'right' ? 'text-right' : 'text-left'}`}>
                        <ColumnHeader
                          label={def.label}
                          align={def.align}
                          values={columnValues[def.key] || []}
                          selected={columnFilters[def.key]}
                          onFilterChange={(next) => setColumnFilter(def.key, next)}
                          sortDir={sortDirFor(def.key)}
                          onSortChange={(dir) => toggleSort(def.key, dir)}
                          filterable={def.filterable}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {displayedRows.map(r => (
                    <tr key={r.bookingId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {r.bookingNumber}
                        {r.missing.length > 0 && (
                          <span className="ml-2 inline-flex items-center text-xs text-yellow-700 dark:text-yellow-400" title={`Missing FX to ${BASE_CURRENCY}: ${r.missing.join(', ')}`}>
                            <AlertCircle className="w-3 h-3 mr-0.5" />
                            FX
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.clientName || '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(r.revenue, BASE_CURRENCY)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(r.cost, BASE_CURRENCY)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${r.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(r.profit, BASE_CURRENCY)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums ${r.margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {r.revenue > 0 ? `${r.margin.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
