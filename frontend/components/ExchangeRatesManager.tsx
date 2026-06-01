import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, Save, Filter } from 'lucide-react';
import { exchangeRatesApi, ExchangeRateRow } from '../services/exchangeRates';
import { useConfirm } from '../context/ConfirmDialog';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { ColumnHeader } from './ui/ColumnHeader';
import { useTableControls, ColumnDef } from '../hooks/useTableControls';

const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'AED', 'TRY', 'ALL'];

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function ExchangeRatesManager() {
  const confirmDialog = useConfirm();
  const { baseCurrency } = useCompanySettings();
  const currencyOptions = Array.from(new Set([baseCurrency, ...COMMON_CURRENCIES].filter(Boolean)));
  const [rates, setRates] = useState<ExchangeRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    from_currency:  baseCurrency === 'USD' ? 'EUR' : 'USD',
    to_currency:    baseCurrency,
    rate:           '',
    effective_date: todayIso(),
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      to_currency: baseCurrency,
      from_currency: prev.from_currency === baseCurrency ? (baseCurrency === 'USD' ? 'EUR' : 'USD') : prev.from_currency,
    }));
  }, [baseCurrency]);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    exchangeRatesApi.getAll()
      .then(setRates)
      .catch(err => setLoadError(err.message || 'Failed to load rates'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async () => {
    const rate = Number(form.rate);
    if (!form.from_currency || !form.to_currency || !Number.isFinite(rate) || rate <= 0 || !form.effective_date) {
      setSaveError('Fill every field with a positive rate.');
      return;
    }
    if (form.from_currency === form.to_currency) {
      setSaveError('From and To currencies must differ (identity rates are implicit).');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await exchangeRatesApi.upsert({
        from_currency:  form.from_currency.toUpperCase(),
        to_currency:    form.to_currency.toUpperCase(),
        rate,
        effective_date: form.effective_date,
      });
      setForm(f => ({ ...f, rate: '' }));
      load();
    } catch (err: any) {
      setSaveError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ExchangeRateRow) => {
    const ok = await confirmDialog({
      title: 'Delete exchange rate?',
      message: `Remove ${row.from_currency}→${row.to_currency} @ ${row.rate} (effective ${row.effective_date})?`,
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await exchangeRatesApi.delete(row.id);
      setRates(prev => prev.filter(r => r.id !== row.id));
    } catch (err: any) {
      setLoadError(err?.message || 'Delete failed');
    }
  };

  const selectClass = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100';
  const inputClass  = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100';

  // Column descriptors drive the per-column sort/filter dropdowns.
  // Each `get` returns the same display string shown in the corresponding table cell.
  const columnDefs = useMemo<ColumnDef<ExchangeRateRow>[]>(() => ([
    { key: 'from_currency', label: 'From', align: 'left', get: (r) => r.from_currency },
    { key: 'to_currency', label: 'To', align: 'left', get: (r) => r.to_currency },
    { key: 'rate', label: 'Rate', align: 'right', get: (r) => Number(r.rate).toLocaleString(undefined, { maximumFractionDigits: 6 }), sortValue: (r) => Number(r.rate) || 0 },
    { key: 'effective_date', label: 'Effective Date', align: 'left', get: (r) => r.effective_date, sortValue: (r) => r.effective_date || '' },
    { key: 'updated', label: 'Updated', align: 'left', get: (r) => r.updated_at ? String(r.updated_at).split('T')[0] : '—', sortValue: (r) => r.updated_at ? String(r.updated_at) : '' },
  ]), []);

  // Column-level Excel-style filters + AZ/ZA sorting (shared across all list tables).
  const {
    processed: processedRates,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sortDirFor,
    toggleSort,
  } = useTableControls(rates, columnDefs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-gray-100">Exchange Rates</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Used by dashboard aggregations and the upcoming P&amp;L view to normalize multi-currency totals.
          Identity rates ({baseCurrency}→{baseCurrency}, EUR→EUR, …) are implicit and don't need rows.
        </p>
      </div>

      {/* Add / upsert form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm text-gray-900 dark:text-gray-100">Add or update a rate</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
            <select className={selectClass + ' w-full'}
              value={form.from_currency}
              onChange={e => setForm({ ...form, from_currency: e.target.value })}>
              {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
            <select className={selectClass + ' w-full'}
              value={form.to_currency}
              onChange={e => setForm({ ...form, to_currency: e.target.value })}>
              {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Rate</label>
            <input type="number" step="0.000001" min="0" className={inputClass + ' w-full'}
              value={form.rate}
              onChange={e => setForm({ ...form, rate: e.target.value })}
              placeholder="e.g. 0.925" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Effective date</label>
            <input type="date" className={inputClass + ' w-full'}
              value={form.effective_date}
              onChange={e => setForm({ ...form, effective_date: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
        {saveError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4" />
            {saveError}
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Saving the same (From, To, Effective date) triple overwrites the existing rate.
        </p>
      </div>

      {/* Rates table */}
      {activeColumnFilterCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={clearAllColumnFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
            title="Clear all column filters"
          >
            <Filter className="w-4 h-4" />
            Clear filters ({activeColumnFilterCount})
          </button>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading rates…
          </div>
        ) : loadError ? (
          <div className="py-12 flex items-center justify-center text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            {loadError}
          </div>
        ) : rates.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No rates configured yet. Add one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {columnDefs.map((def) => (
                  <th key={def.key} className={`px-4 py-3 ${def.align === 'right' ? 'text-right' : 'text-left'} text-xs text-gray-500 uppercase tracking-wider`}>
                    <ColumnHeader
                      label={def.label}
                      align={def.align}
                      values={columnValues[def.key] || []}
                      selected={columnFilters[def.key]}
                      onFilterChange={(next) => setColumnFilter(def.key, next)}
                      sortDir={sortDirFor(def.key)}
                      onSortChange={(dir) => toggleSort(def.key, dir)}
                    />
                  </th>
                ))}
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {processedRates.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.from_currency}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.to_currency}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-gray-100">{Number(r.rate).toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.effective_date}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.updated_at ? String(r.updated_at).split('T')[0] : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(r)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
