import { useEffect, useMemo, useState } from 'react';
import { X, Save, Plus, Trash2, Loader2, FileText } from 'lucide-react';
import { usePartners } from '../hooks/usePartners';
import { bookingsApi, Booking } from '../services/bookings';
import { servicesApi } from '../services/services';
import { Service } from '../types/service';
import {
  Invoice, InvoiceLine, InvoicePayload, InvoiceStatus, InvoiceType,
  invoicesApi,
} from '../services/invoices';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { isPartnerBuyer } from '../utils/partnerRoles';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  mode: 'new' | 'edit';
  onSaved: () => void;
  onCancel: () => void;
}

const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'AED'];
const STATUSES: InvoiceStatus[]  = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Void'];
const TYPES: InvoiceType[]       = ['Sales', 'Purchase', 'Credit Note'];

const inputClass = (err?: boolean) =>
  `w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
    err ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
  } focus:outline-none focus:ring-2 focus:ring-blue-500/30`;

function emptyLine(currency: string): InvoiceLine {
  return { description: '', quantity: 1, unitPrice: 0, vatRate: 0, currency };
}

export function InvoiceForm({ invoice, mode, onSaved, onCancel }: InvoiceFormProps) {
  const { user } = useAuth();
  const { baseCurrency } = useCompanySettings();
  const { partners } = usePartners();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const clients = partners.filter(
    (p) => p.status === 'Active' && isPartnerBuyer(p)
  );
  const currencyOptions = useMemo(() => {
    const set = new Set<string>([baseCurrency, ...COMMON_CURRENCIES].filter(Boolean));
    return Array.from(set);
  }, [baseCurrency]);

  const [form, setForm] = useState({
    invoiceNumber: invoice?.invoiceNumber || '',
    invoiceType:   (invoice?.invoiceType  || 'Sales') as InvoiceType,
    status:        (invoice?.status       || 'Draft') as InvoiceStatus,
    clientId:      invoice?.clientId  || '',
    bookingId:     invoice?.bookingId || '',
    invoiceDate:   invoice?.invoiceDate || today,
    dueDate:       invoice?.dueDate   || '',
    currency:      invoice?.currency  || baseCurrency,
    exchangeRate:  invoice?.exchangeRate ?? 1,
    amountPaid:    invoice?.amountPaid ?? 0,
    notes:         invoice?.notes     || '',
    paymentTerms:  invoice?.paymentTerms || '',
    bankDetails:   invoice?.bankDetails  || '',
  });
  const [lines, setLines] = useState<InvoiceLine[]>(
    invoice?.lines?.length ? invoice.lines : [emptyLine(invoice?.currency || baseCurrency)]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([bookingsApi.getAll(), servicesApi.getAll()])
      .then(([bks, svcs]) => { setBookings(bks); setServices(svcs); })
      .catch(() => {})
      .finally(() => setLoadingRef(false));
  }, []);

  // Generate invoice number for new invoices
  useEffect(() => {
    if (mode === 'new' && !form.invoiceNumber) {
      invoicesApi.getNextNumber()
        .then((n) => setForm((prev) => ({ ...prev, invoiceNumber: n })))
        .catch(() => {});
    }
  }, [mode]);

  const set = <K extends keyof typeof form>(field: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const setLine = (idx: number, patch: Partial<InvoiceLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const addLine = () => setLines((prev) => [...prev, emptyLine(form.currency)]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleBookingChange = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    setForm((prev) => ({
      ...prev,
      bookingId,
      clientId: booking?.clientId || prev.clientId,
      currency: booking?.currency || prev.currency || baseCurrency,
    }));
  };

  const totals = useMemo(() => {
    const subtotal  = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const vatAmount = lines.reduce((s, l) => s + l.quantity * l.unitPrice * l.vatRate, 0);
    return { subtotal, vatAmount, totalAmount: subtotal + vatAmount };
  }, [lines]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.invoiceNumber) next.invoiceNumber = 'Invoice number is required';
    if (!form.invoiceDate)   next.invoiceDate   = 'Invoice date is required';
    if (lines.length === 0)  next.lines         = 'At least one line is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (nextStatus: InvoiceStatus) => {
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);

    const payload: InvoicePayload = {
      invoiceNumber: form.invoiceNumber,
      invoiceType:   form.invoiceType,
      status:        nextStatus,
      clientId:      form.clientId  || undefined,
      bookingId:     form.bookingId || undefined,
      invoiceDate:   form.invoiceDate,
      dueDate:       form.dueDate   || undefined,
      currency:      form.currency,
      exchangeRate:  form.exchangeRate,
      subtotal:      totals.subtotal,
      vatAmount:     totals.vatAmount,
      totalAmount:   totals.totalAmount,
      amountPaid:    form.amountPaid,
      notes:         form.notes        || undefined,
      paymentTerms:  form.paymentTerms || undefined,
      bankDetails:   form.bankDetails  || undefined,
      lines,
    };

    try {
      if (mode === 'edit' && invoice?.id) {
        await invoicesApi.update(invoice.id, payload, user?.username);
      } else {
        await invoicesApi.create(payload, user?.username);
      }
      onSaved();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl text-gray-900 dark:text-gray-100">
                {mode === 'new' ? 'New Invoice' : `Edit Invoice — ${invoice?.invoiceNumber}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{form.invoiceNumber}</p>
            </div>
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
          <div className="p-6 space-y-6">
            {/* Top fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Invoice Number</label>
                  <input value={form.invoiceNumber} disabled className={inputClass()} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select value={form.invoiceType} onChange={(e) => set('invoiceType', e.target.value as InvoiceType)} className={inputClass()}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Client</label>
                  <select value={form.clientId} onChange={(e) => set('clientId', e.target.value)} className={inputClass()}>
                    <option value="">Select client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.tradingName || c.companyLegalName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Booking</label>
                  <select value={form.bookingId} onChange={(e) => handleBookingChange(e.target.value)} className={inputClass()}>
                    <option value="">No booking linked</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>{b.bookingNumber}{b.clientName ? ` — ${b.clientName}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.invoiceDate}
                    onChange={(e) => set('invoiceDate', e.target.value)}
                    className={inputClass(!!errors.invoiceDate)}
                  />
                  {errors.invoiceDate && <p className="text-xs text-red-500 mt-1">{errors.invoiceDate}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={inputClass()} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                    <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className={inputClass()}>
                      {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Exchange Rate</label>
                    <input
                      type="number" min="0" step="0.0001"
                      value={form.exchangeRate}
                      onChange={(e) => set('exchangeRate', parseFloat(e.target.value) || 1)}
                      className={inputClass()}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
                  <input
                    value={form.paymentTerms}
                    onChange={(e) => set('paymentTerms', e.target.value)}
                    placeholder="e.g. Net 30"
                    className={inputClass()}
                  />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm text-gray-700 dark:text-gray-300">Line Items</h3>
                {errors.lines && <span className="text-xs text-red-500">{errors.lines}</span>}
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 dark:text-gray-400">Service</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 dark:text-gray-400 w-52">Description</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400 w-20">Qty</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400 w-28">Unit Price</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400 w-20">VAT %</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400 w-28">Line Total</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {lines.map((line, idx) => (
                      <tr key={idx} className="bg-white dark:bg-gray-800">
                        <td className="px-3 py-2">
                          <select
                            value={line.serviceId || ''}
                            onChange={(e) => {
                              const svc = services.find((s) => s.id === e.target.value);
                              setLine(idx, {
                                serviceId: e.target.value || undefined,
                                description: svc ? svc.serviceName : line.description,
                              });
                            }}
                            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs"
                          >
                            <option value="">— Select —</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>{s.serviceName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={line.description}
                            onChange={(e) => setLine(idx, { description: e.target.value })}
                            placeholder="Description"
                            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min="0" step="1"
                            value={line.quantity}
                            onChange={(e) => setLine(idx, { quantity: parseFloat(e.target.value) || 1 })}
                            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs text-right"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min="0" step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => setLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs text-right"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min="0" max="1" step="0.01"
                            value={line.vatRate}
                            onChange={(e) => setLine(idx, { vatRate: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 tabular-nums text-xs">
                          {(line.quantity * line.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addLine}
                className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Plus className="w-4 h-4" />
                Add line
              </button>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{form.currency} {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>VAT</span>
                  <span className="tabular-nums">{form.currency} {totals.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 text-gray-900 dark:text-gray-100">
                  <span>Total</span>
                  <span className="tabular-nums">{form.currency} {totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between pt-2 gap-3">
                  <label className="text-gray-600 dark:text-gray-400 shrink-0">Amount Paid</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.amountPaid}
                    onChange={(e) => set('amountPaid', parseFloat(e.target.value) || 0)}
                    className="w-36 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className={`flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700 ${(totals.totalAmount - form.amountPaid) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  <span>Balance Due</span>
                  <span className="tabular-nums">
                    {form.currency} {(totals.totalAmount - form.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Client-facing notes"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Bank Details</label>
                <textarea
                  value={form.bankDetails}
                  onChange={(e) => set('bankDetails', e.target.value)}
                  rows={3}
                  placeholder="Bank account details for payment"
                  className={inputClass()}
                />
              </div>
            </div>

            {submitError && (
              <div className="text-sm text-red-600 dark:text-red-400">{submitError}</div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as InvoiceStatus)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('Draft')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(form.status === 'Draft' ? 'Sent' : form.status)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save & Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
