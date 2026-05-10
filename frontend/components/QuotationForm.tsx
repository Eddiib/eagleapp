import { useEffect, useMemo, useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { usePartners } from '../hooks/usePartners';
import { countries, getCountryName } from '../data/countries';
import {
  Quotation,
  QuotationPayload,
  QuotationServiceLine,
  QuotationStatus,
  generateQuoteNumber,
} from '../services/quotations';
import { QuotationServicesEditor } from './QuotationServicesEditor';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { isPartnerBuyer } from '../utils/partnerRoles';

interface QuotationFormProps {
  quotation?: Quotation | null;
  mode: 'new' | 'edit';
  onSave: (quotation: QuotationPayload) => Promise<void> | void;
  onCancel: () => void;
}

const MODE_OPTIONS = ['Sea', 'Air', 'Road', 'Rail', 'Multimodal'];
const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP'];

export function QuotationForm({ quotation, mode, onSave, onCancel }: QuotationFormProps) {
  const { partners } = usePartners();
  const { baseCurrency } = useCompanySettings();
  const currencyOptions = useMemo(() => {
    const set = new Set<string>([baseCurrency, ...COMMON_CURRENCIES].filter(Boolean));
    return Array.from(set);
  }, [baseCurrency]);
  const clients = partners.filter((partner) =>
    partner.status === 'Active' && isPartnerBuyer(partner)
  );

  const [form, setForm] = useState({
    quoteNumber: quotation?.quoteNumber || generateQuoteNumber(),
    clientId: quotation?.clientId || '',
    modeOfTransport: quotation?.modeOfTransport || 'Sea',
    originCountry: quotation?.originCountry || '',
    originPort: quotation?.originPort || '',
    destinationCountry: quotation?.destinationCountry || '',
    destinationPort: quotation?.destinationPort || '',
    validUntil: quotation?.validUntil || '',
    currency: quotation?.currency || baseCurrency,
    notes: quotation?.notes || '',
  });
  const [status, setStatus] = useState<QuotationStatus>(quotation?.status || 'Draft');
  const [services, setServices] = useState<QuotationServiceLine[]>(quotation?.services || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!quotation) return;
    setForm({
      quoteNumber: quotation.quoteNumber,
      clientId: quotation.clientId,
      modeOfTransport: quotation.modeOfTransport || 'Sea',
      originCountry: quotation.originCountry || '',
      originPort: quotation.originPort || '',
      destinationCountry: quotation.destinationCountry || '',
      destinationPort: quotation.destinationPort || '',
      validUntil: quotation.validUntil || '',
      currency: quotation.currency,
      notes: quotation.notes || '',
    });
    setStatus(quotation.status);
    setServices(quotation.services || []);
  }, [quotation]);

  const totals = useMemo(() => ({
    totalCost: services.reduce((sum, line) => sum + ((line.quantity || 0) * (line.costPrice || 0)), 0),
    totalSell: services.reduce((sum, line) => sum + ((line.quantity || 0) * (line.sellPrice || 0)), 0),
  }), [services]);

  const set = <K extends keyof typeof form>(field: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.clientId) nextErrors.clientId = 'Client is required';
    if (services.length === 0) nextErrors.services = 'At least one service line is required';
    if (services.some((line) => !line.serviceId)) nextErrors.services = 'Each service line requires a selected service';
    if (services.some((line) => (line.quantity || 0) <= 0)) nextErrors.services = 'Service quantities must be greater than zero';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const persist = async (nextStatus: QuotationStatus) => {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    const payload: QuotationPayload = {
      quoteNumber: form.quoteNumber,
      status: nextStatus,
      clientId: form.clientId,
      modeOfTransport: form.modeOfTransport,
      originCountry: form.originCountry || undefined,
      originPort: form.originPort || undefined,
      destinationCountry: form.destinationCountry || undefined,
      destinationPort: form.destinationPort || undefined,
      validUntil: form.validUntil || undefined,
      totalSell: totals.totalSell,
      totalCost: totals.totalCost,
      currency: form.currency,
      notes: form.notes || undefined,
      services,
    };

    try {
      await onSave(payload);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save quotation');
      setSaving(false);
      return;
    }

    setSaving(false);
  };

  const clientName = clients.find((partner) => partner.id === form.clientId)?.companyLegalName || 'Select a client';

  const inputClass = (hasError?: boolean) =>
    `w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
      hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl text-gray-900 dark:text-gray-100">
                {mode === 'new' ? 'New Quotation' : 'Edit Quotation'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {form.quoteNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Quote Number
                </label>
                <input value={form.quoteNumber} disabled className={inputClass()} />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.clientId}
                  onChange={(e) => set('clientId', e.target.value)}
                  className={inputClass(!!errors.clientId)}
                >
                  <option value="">Select client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.tradingName || client.companyLegalName}
                    </option>
                  ))}
                </select>
                {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Mode of Transport</label>
                <select
                  value={form.modeOfTransport}
                  onChange={(e) => set('modeOfTransport', e.target.value)}
                  className={inputClass()}
                >
                  {MODE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <input value={status} disabled className={inputClass()} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Origin Country</label>
                <select
                  value={form.originCountry}
                  onChange={(e) => set('originCountry', e.target.value)}
                  className={inputClass()}
                >
                  <option value="">Select country…</option>
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Origin Port</label>
                <input
                  value={form.originPort}
                  onChange={(e) => set('originPort', e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. Shanghai"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Destination Country</label>
                <select
                  value={form.destinationCountry}
                  onChange={(e) => set('destinationCountry', e.target.value)}
                  className={inputClass()}
                >
                  <option value="">Select country…</option>
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Destination Port</label>
                <input
                  value={form.destinationPort}
                  onChange={(e) => set('destinationPort', e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. Rotterdam"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => set('validUntil', e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm text-blue-900 dark:text-blue-100">
              Client: <strong>{clientName}</strong>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Route: {[form.originCountry ? getCountryName(form.originCountry) : form.originPort, form.destinationCountry ? getCountryName(form.destinationCountry) : form.destinationPort].filter(Boolean).join(' → ') || 'Not specified'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-gray-700 dark:text-gray-300">Quotation Service Lines</h3>
              {errors.services && <span className="text-xs text-red-500">{errors.services}</span>}
            </div>
            <QuotationServicesEditor
              value={services}
              onChange={setServices}
              defaultCurrency={form.currency}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Currency</div>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className={`${inputClass()} mt-2`}
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-xs text-red-600 dark:text-red-300 uppercase">Total Cost</div>
              <div className="text-2xl text-red-900 dark:text-red-100 mt-2">
                {form.currency} {totals.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-xs text-green-600 dark:text-green-300 uppercase">Total Sell</div>
              <div className="text-2xl text-green-900 dark:text-green-100 mt-2">
                {form.currency} {totals.totalSell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={inputClass()}
              rows={4}
              placeholder="Internal notes or context for this quotation"
            />
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
              type="button"
              disabled={saving}
              onClick={() => persist('Draft')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('Sent')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save & Mark Sent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
