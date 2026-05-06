import { useState, useEffect } from 'react';
import { X, Save, Calculator, Loader2 } from 'lucide-react';
import { usePartners } from '../hooks/usePartners';
import { bookingsApi, Booking } from '../services/bookings';
import { servicesApi } from '../services/services';
import { Service } from '../types/service';
import { CostEntry, CostEntryPayload, CostEntryStatus, costControlApi } from '../services/costControl';
import { useAuth } from '../context/AuthContext';

interface CostControlFormProps {
  entry?: CostEntry | null;
  mode: 'add' | 'edit';
  onSaved: () => void;
  onCancel: () => void;
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'AED', 'CNY', 'JPY', 'CHF'];
const STATUSES: CostEntryStatus[] = ['Pending', 'Approved', 'Paid', 'Disputed'];

const inputClass = (hasError?: boolean) =>
  `w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm ${
    hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
  } focus:outline-none focus:ring-2 focus:ring-blue-500/30`;

export function CostControlForm({ entry, mode, onSaved, onCancel }: CostControlFormProps) {
  const { user } = useAuth();
  const { partners } = usePartners();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  const CLIENT_TYPES = ['Client', 'Buyer'];
  const clients = partners.filter(
    (p) => p.status === 'Active' &&
      (CLIENT_TYPES.includes(p.partnerType) || CLIENT_TYPES.includes(p.partnerCategory ?? ''))
  );
  const suppliers = partners.filter((p) => p.status === 'Active');

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    bookingId: entry?.bookingId || '',
    serviceId: entry?.serviceId || '',
    supplierId: entry?.supplierId || '',
    clientId: entry?.clientId || '',
    description: entry?.description || '',
    // Buying side
    amount: entry?.amount ?? 0,
    currency: entry?.currency || 'USD',
    buyingExchangeRate: entry?.buyingExchangeRate ?? 1,
    invoiceNumber: entry?.invoiceNumber || '',
    invoiceDate: entry?.invoiceDate || today,
    dueDate: entry?.dueDate || '',
    status: (entry?.status || 'Pending') as CostEntryStatus,
    // Selling side
    sellingPrice: entry?.sellingPrice ?? 0,
    sellingCurrency: entry?.sellingCurrency || 'USD',
    sellingExchangeRate: entry?.sellingExchangeRate ?? 1,
    sellingInvoiceNumber: entry?.sellingInvoiceNumber || '',
    sellingInvoiceDate: entry?.sellingInvoiceDate || '',
    quantity: entry?.quantity ?? 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([bookingsApi.getAll(), servicesApi.getAll()])
      .then(([bks, svcs]) => {
        setBookings(bks);
        setServices(svcs);
      })
      .catch(() => {})
      .finally(() => setLoadingRef(false));
  }, []);

  const set = <K extends keyof typeof form>(field: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Derived calculated values
  const buyingEUR = form.amount * form.buyingExchangeRate;
  const sellingEUR = form.sellingPrice * form.sellingExchangeRate;
  const profitLoss = sellingEUR - buyingEUR;
  const profitMargin = buyingEUR !== 0 ? (profitLoss / buyingEUR) * 100 : 0;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.bookingId) next.bookingId = 'Booking is required';
    if (!form.serviceId) next.serviceId = 'Service is required';
    if (form.amount < 0) next.amount = 'Amount cannot be negative';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    const payload: CostEntryPayload = {
      bookingId: form.bookingId,
      serviceId: form.serviceId,
      supplierId: form.supplierId || undefined,
      clientId: form.clientId || undefined,
      description: form.description || undefined,
      amount: form.amount,
      currency: form.currency,
      buyingExchangeRate: form.buyingExchangeRate,
      invoiceNumber: form.invoiceNumber || undefined,
      invoiceDate: form.invoiceDate || undefined,
      dueDate: form.dueDate || undefined,
      status: form.status,
      sellingPrice: form.sellingPrice,
      sellingCurrency: form.sellingCurrency,
      sellingExchangeRate: form.sellingExchangeRate,
      sellingInvoiceNumber: form.sellingInvoiceNumber || undefined,
      sellingInvoiceDate: form.sellingInvoiceDate || undefined,
      quantity: form.quantity,
    };

    try {
      if (mode === 'edit' && entry?.id) {
        await costControlApi.update(entry.id, payload, user?.username);
      } else {
        await costControlApi.create(payload, user?.username);
      }
      onSaved();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save cost entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl text-gray-900 dark:text-gray-100">
              {mode === 'add' ? 'New Cost Entry' : 'Edit Cost Entry'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Buying and selling side with auto-calculated P&amp;L
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingRef ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Reference fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Booking <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.bookingId}
                  onChange={(e) => set('bookingId', e.target.value)}
                  className={inputClass(!!errors.bookingId)}
                >
                  <option value="">Select booking…</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} {b.clientName ? `— ${b.clientName}` : ''}
                    </option>
                  ))}
                </select>
                {errors.bookingId && <p className="text-xs text-red-500 mt-1">{errors.bookingId}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Service <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.serviceId}
                  onChange={(e) => set('serviceId', e.target.value)}
                  className={inputClass(!!errors.serviceId)}
                >
                  <option value="">Select service…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.serviceCode ? `[${s.serviceCode}] ` : ''}{s.serviceName}
                    </option>
                  ))}
                </select>
                {errors.serviceId && <p className="text-xs text-red-500 mt-1">{errors.serviceId}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={(e) => set('quantity', parseFloat(e.target.value) || 1)}
                  className={inputClass()}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as CostEntryStatus)}
                  className={inputClass()}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Optional internal note"
                  className={inputClass()}
                />
              </div>
            </div>

            {/* Buying side */}
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10 p-4 space-y-4">
              <h3 className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Buying Side (Cost)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                  <select
                    value={form.supplierId}
                    onChange={(e) => set('supplierId', e.target.value)}
                    className={inputClass()}
                  >
                    <option value="">Select supplier…</option>
                    {suppliers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.tradingName || p.companyLegalName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Invoice Number</label>
                  <input
                    value={form.invoiceNumber}
                    onChange={(e) => set('invoiceNumber', e.target.value)}
                    placeholder="e.g. INV-001"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={form.invoiceDate}
                    onChange={(e) => set('invoiceDate', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => set('dueDate', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Buying Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
                    className={inputClass(!!errors.amount)}
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => set('currency', e.target.value)}
                    className={inputClass()}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Exchange Rate → EUR</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={form.buyingExchangeRate}
                    onChange={(e) => set('buyingExchangeRate', parseFloat(e.target.value) || 1)}
                    className={inputClass()}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Cost in EUR</label>
                    <input
                      value={`€${buyingEUR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    />
                  </div>
                  <Calculator className="w-5 h-5 text-gray-400 mb-2 shrink-0" />
                </div>
              </div>
            </div>

            {/* Selling side */}
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10 p-4 space-y-4">
              <h3 className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                Selling Side (Revenue)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Client</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => set('clientId', e.target.value)}
                    className={inputClass()}
                  >
                    <option value="">Select client…</option>
                    {clients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.tradingName || p.companyLegalName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Sales Invoice Number</label>
                  <input
                    value={form.sellingInvoiceNumber}
                    onChange={(e) => set('sellingInvoiceNumber', e.target.value)}
                    placeholder="e.g. SALE-001"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Sales Invoice Date</label>
                  <input
                    type="date"
                    value={form.sellingInvoiceDate}
                    onChange={(e) => set('sellingInvoiceDate', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(e) => set('sellingPrice', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select
                    value={form.sellingCurrency}
                    onChange={(e) => set('sellingCurrency', e.target.value)}
                    className={inputClass()}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Exchange Rate → EUR</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={form.sellingExchangeRate}
                    onChange={(e) => set('sellingExchangeRate', parseFloat(e.target.value) || 1)}
                    className={inputClass()}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Revenue in EUR</label>
                    <input
                      value={`€${sellingEUR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    />
                  </div>
                  <Calculator className="w-5 h-5 text-gray-400 mb-2 shrink-0" />
                </div>
              </div>
            </div>

            {/* P&L summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 border ${profitLoss >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Profit / Loss (EUR)</div>
                <div className={`text-2xl ${profitLoss >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  €{profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`rounded-lg p-4 border ${profitMargin >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Profit Margin</div>
                <div className={`text-2xl ${profitMargin >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {profitMargin.toFixed(2)}%
                </div>
              </div>
            </div>

            {submitError && (
              <div className="text-sm text-red-600 dark:text-red-400">{submitError}</div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : mode === 'add' ? 'Create Entry' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
