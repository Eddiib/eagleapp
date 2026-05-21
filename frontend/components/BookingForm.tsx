import { useEffect, useMemo, useState } from 'react';
import {
  Booking,
  BookingServiceType,
} from '../services/bookings';
import { usePartners } from '../hooks/usePartners';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { exchangeRatesApi } from '../services/exchangeRates';
import { countries, getCountryName } from '../data/countries';
import { isPartnerBuyer } from '../utils/partnerRoles';

const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CNY', 'JPY', 'CAD', 'AUD', 'SGD'];

interface BookingFormProps {
  draft: Booking;
  onChange: (patch: Partial<Booking>) => void;
  mode: 'view' | 'edit' | 'new';
  saving?: boolean;
  error?: string | null;
  onSave?: () => void;
  onCancel?: () => void;
  leadData?: any;
}

export function BookingForm({ draft, onChange, mode, error, leadData }: BookingFormProps) {
  const { user } = useAuth();
  const { baseCurrency } = useCompanySettings();
  const isViewMode = mode === 'view';
  const { partners } = usePartners();
  const CARRIER_TYPES = ['Shipping Line', 'Air Carrier', 'Trucking Company', 'Rail Operator'];
  const clients = partners.filter((p) =>
    p.status === 'Active' && isPartnerBuyer(p),
  );
  const carriers = partners.filter((p) =>
    p.status === 'Active' && (p.partnerClass === 'Carrier' || CARRIER_TYPES.includes(p.partnerType)),
  );

  const [knownCurrencies, setKnownCurrencies] = useState<string[]>([]);
  useEffect(() => {
    exchangeRatesApi.getAll()
      .then((rows) => {
        const set = new Set<string>();
        for (const r of rows) {
          if (r.from_currency) set.add(r.from_currency.toUpperCase());
          if (r.to_currency) set.add(r.to_currency.toUpperCase());
        }
        setKnownCurrencies(Array.from(set));
      })
      .catch(() => { /* fallback list */ });
  }, []);

  const currencyOptions = useMemo(() => {
    const set = new Set<string>(COMMON_CURRENCIES);
    if (baseCurrency) set.add(baseCurrency.toUpperCase());
    for (const c of knownCurrencies) set.add(c);
    return Array.from(set).sort();
  }, [baseCurrency, knownCurrencies]);

  const computedMargin = (draft.totalRevenue || 0) - (draft.totalCost || 0);

  const inputClass = (extra = '') =>
    `w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 ${extra}`;
  const labelClass = 'text-xs text-gray-500 dark:text-gray-400 block mb-0.5';
  const sectionTitleClass = 'text-xs uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {mode === 'new' && leadData && (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            Creating booking from Sales Lead: <strong>{leadData.businessName}</strong>
            {leadData.contactPerson && <span className="text-blue-600 dark:text-blue-400">• Contact: {leadData.contactPerson}</span>}
            {(leadData.city || leadData.country) && <span className="text-blue-600 dark:text-blue-400">• {leadData.city}, {getCountryName(leadData.country)}</span>}
          </div>
        </div>
      )}

      {!isViewMode && (
        <div className="px-6 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm text-gray-900 dark:text-gray-100">
            {mode === 'new' ? 'Create New Booking' : 'Edit Booking'}
          </h3>
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
        </div>
      )}

      <div className="px-6 py-3">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-3 space-y-3">
            <div>
              <h4 className={sectionTitleClass}>Basic Information</h4>
              <div className="space-y-2">
                <div>
                  <label className={labelClass}>Booking Number</label>
                  <input
                    type="text"
                    value={draft.bookingNumber}
                    onChange={(e) => onChange({ bookingNumber: e.target.value })}
                    disabled={mode !== 'edit'}
                    maxLength={30}
                    className={inputClass()}
                    placeholder={mode === 'edit' ? 'Booking number' : 'Auto-generated'}
                  />
                </div>
                <div>
                  <label className={labelClass}>Client <span className="text-red-500">*</span></label>
                  <select
                    autoFocus={mode === 'new'}
                    value={draft.clientId}
                    onChange={(e) => onChange({ clientId: e.target.value })}
                    disabled={isViewMode}
                    className={inputClass()}
                  >
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.tradingName || c.companyLegalName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Carrier</label>
                    <select value={draft.carrierId} onChange={(e) => onChange({ carrierId: e.target.value })} disabled={isViewMode} className={inputClass()}>
                      <option value="">—</option>
                      {carriers.map(c => <option key={c.id} value={c.id}>{c.tradingName || c.companyLegalName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Service Type</label>
                    <select value={draft.serviceType} onChange={(e) => onChange({ serviceType: e.target.value as BookingServiceType })} disabled={isViewMode} className={inputClass()}>
                      <option value="FCL">FCL</option>
                      <option value="LCL">LCL</option>
                      <option value="Air">Air</option>
                      <option value="Road">Road</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-3 space-y-3">
            <div>
              <h4 className={sectionTitleClass}>Routing Information</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Origin Country</label>
                    {isViewMode
                      ? <input type="text" value={getCountryName(draft.originCountry)} disabled className={inputClass()} />
                      : <select value={draft.originCountry} onChange={(e) => onChange({ originCountry: e.target.value })} className={inputClass()}>
                          <option value="">Select country…</option>
                          {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                    }
                  </div>
                  <div>
                    <label className={labelClass}>Destination Country</label>
                    {isViewMode
                      ? <input type="text" value={getCountryName(draft.destinationCountry)} disabled className={inputClass()} />
                      : <select value={draft.destinationCountry} onChange={(e) => onChange({ destinationCountry: e.target.value })} className={inputClass()}>
                          <option value="">Select country…</option>
                          {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                    }
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>ETD</label>
                    <input type="date" value={draft.estimatedDeparture} onChange={(e) => onChange({ estimatedDeparture: e.target.value })} disabled={isViewMode} className={inputClass()} />
                  </div>
                  <div>
                    <label className={labelClass}>ETA</label>
                    <input type="date" value={draft.estimatedArrival} onChange={(e) => onChange({ estimatedArrival: e.target.value })} disabled={isViewMode} className={inputClass()} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-3 space-y-3">
            <div>
              <h4 className={sectionTitleClass}>Cargo Information</h4>
              <div className="space-y-2">
                {/* Commodity lives in the header Cargo Details panel — shown here read-only for reference */}
                <div>
                  <label className={labelClass}>Commodity</label>
                  <input type="text" value={draft.commodity} disabled className={inputClass()} placeholder="Set in Cargo Details above" />
                </div>
                <div>
                  <label className={labelClass}>Notes / Special Instructions</label>
                  <textarea rows={3} value={draft.notes} onChange={(e) => onChange({ notes: e.target.value })} disabled={isViewMode} className={`${inputClass()} resize-y`} placeholder="Any special handling instructions..." />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-3 space-y-3">
            <div>
              <h4 className={sectionTitleClass}>Financials</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>Currency</label>
                    <input
                      type="text"
                      list="booking-currency-options"
                      maxLength={3}
                      value={draft.currency}
                      onChange={(e) => onChange({ currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
                      disabled={isViewMode}
                      placeholder={baseCurrency || 'EUR'}
                      className={inputClass()}
                    />
                    <datalist id="booking-currency-options">
                      {currencyOptions.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className={labelClass}>Revenue</label>
                    <input
                      type="text"
                      value={(draft.totalRevenue || 0).toFixed(2)}
                      disabled
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Cost</label>
                    <input
                      type="text"
                      value={(draft.totalCost || 0).toFixed(2)}
                      disabled
                      className={inputClass()}
                    />
                  </div>
                </div>
                <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                  Totals are derived from the agreed rates / costs entered on the Equipment tab.
                </p>
                {(draft.totalRevenue > 0 || draft.totalCost > 0) && (
                  <div className="px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                    Margin: <strong className={computedMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {draft.currency} {computedMargin.toFixed(2)}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className={sectionTitleClass}>Created By</h4>
              <input type="text" value={draft.createdBy || user?.username || ''} disabled className={inputClass()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
