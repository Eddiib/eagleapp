import { ArrowLeft, Edit, Save, X, ChevronDown, Loader2, FileText } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Booking, BookingPartySummary, BookingStatus } from '../services/bookings';
import { usePartners } from '../hooks/usePartners';
import { countries } from '../data/countries';
import { ports } from '../data/ports';

type Patch = Partial<Booking>;

interface BookingHeaderProps {
  bookingMode?: 'view' | 'edit' | 'new';
  onBack?: () => void;
  draft: Booking;
  onChange: (patch: Patch) => void;
  onEdit?: () => void;
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  error?: string | null;
  bookingNumberOverride?: string;
  onGenerateInvoice?: () => void;
}

const STATUSES: BookingStatus[] = ['Draft', 'Confirmed', 'In Transit', 'Delivered', 'Cancelled'];
const BL_TYPES = ['Bill of Lading', 'Telex Release', 'Seaway bill'];
const BL_STATUSES = ['Pending', 'Confirmed'];
const INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
const FREIGHT_TERMS = ['Prepaid', 'Collect', 'Prepaid & Collect'];
const CARGO_NATURES = ['General Cargo', 'IMO', 'Food Stuff', 'Reefer', 'Break Bulk'];

// Loose, real-world-friendly format checks for booking references.
const BL_RE  = /^[A-Z0-9-]{3,30}$/i;
const REF_RE = /^[A-Za-z0-9_\-./ ]{2,40}$/;
function flagInvalid(value: string | undefined, re: RegExp) {
  return value && value.trim() && !re.test(value.trim()) ? 'border-red-500' : '';
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Draft':      return 'bg-gray-900 text-white';
    case 'Confirmed':  return 'bg-blue-600 text-white';
    case 'In Transit': return 'bg-yellow-500 text-gray-900';
    case 'Delivered':  return 'bg-green-600 text-white';
    case 'Cancelled':  return 'bg-red-600 text-white';
    default:           return 'bg-gray-900 text-white';
  }
}

export function BookingHeader({
  bookingMode = 'view',
  onBack,
  draft,
  onChange,
  onEdit,
  onSave,
  onCancel,
  saving = false,
  error,
  bookingNumberOverride,
  onGenerateInvoice,
}: BookingHeaderProps) {
  const isViewMode = bookingMode === 'view';
  const isEditMode = bookingMode === 'edit';
  const isNewMode = bookingMode === 'new';

  const { partners } = usePartners();
  const activePartners = useMemo(() => partners.filter(p => p.status === 'Active'), [partners]);
  const partyOptions = activePartners;

  const [isShipperDropdownOpen, setIsShipperDropdownOpen] = useState(false);
  const [shipperSearch, setShipperSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Reset the filter text whenever the shipper dropdown closes.
  useEffect(() => {
    if (!isShipperDropdownOpen) setShipperSearch('');
  }, [isShipperDropdownOpen]);

  const filteredShipperOptions = useMemo(() => {
    const q = shipperSearch.trim().toLowerCase();
    if (!q) return partyOptions;
    return partyOptions.filter(p =>
      (p.tradingName || p.companyLegalName || '').toLowerCase().includes(q),
    );
  }, [partyOptions, shipperSearch]);

  useEffect(() => {
    if (!isShipperDropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsShipperDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isShipperDropdownOpen]);

  const selectedShipperIds = new Set(draft.shippers.map(s => s.shipperId));

  const toggleShipper = (partnerId: string, partnerName: string) => {
    const next: BookingPartySummary[] = selectedShipperIds.has(partnerId)
      ? draft.shippers.filter(s => s.shipperId !== partnerId)
      : [...draft.shippers, { shipperId: partnerId, shipperName: partnerName }];
    const primaryShipperId = next[0]?.shipperId ?? '';
    onChange({ shippers: next, shipperId: primaryShipperId });
  };

  const removeShipper = (partnerId: string) => {
    const next = draft.shippers.filter(s => s.shipperId !== partnerId);
    const primaryShipperId = next[0]?.shipperId ?? '';
    onChange({ shippers: next, shipperId: primaryShipperId });
  };

  const displayBookingNumber = draft.bookingNumber || bookingNumberOverride || 'New Booking';

  const inputCls = 'w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100';
  const labelCls = 'text-xs text-gray-500 dark:text-gray-400 block mb-0.5';

  return (
    <div className="border-b border-gray-200 bg-white dark:border-[#374151] dark:bg-[#262626] 2xl:sticky 2xl:top-[57px] z-30">
      <div className="px-4 py-3 sm:px-6">
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {/* Column 1 - BOOKING INFO */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-6 h-6 rounded-full bg-black dark:bg-gray-900 flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                  aria-label="Back to Bookings List"
                >
                  <ArrowLeft className="w-3 h-3 text-white" />
                </button>
              )}
              <h3 className="text-xs uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Booking Info
              </h3>
              {isEditMode ? (
                <input
                  type="text"
                  value={draft.bookingNumber}
                  onChange={(e) => onChange({ bookingNumber: e.target.value })}
                  maxLength={30}
                  placeholder="Booking #"
                  aria-label="Booking number"
                  className="px-2 py-0.5 w-32 rounded text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(draft.status)}`}>
                  {displayBookingNumber}
                </span>
              )}
              {isViewMode && onEdit && (
                <div className="flex items-center gap-1 ml-auto">
                  {onGenerateInvoice && (
                    <button
                      onClick={onGenerateInvoice}
                      className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
                      title="Create a draft sales invoice from this booking"
                    >
                      <FileText className="w-3 h-3" />
                      Generate Invoice
                    </button>
                  )}
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                </div>
              )}
              {(isEditMode || isNewMode) && (
                <div className="flex items-center gap-1 ml-auto flex-wrap justify-end">
                  {error && (
                    <span className="text-xs text-red-600 dark:text-red-400 max-w-[180px] text-right leading-tight">
                      {error}
                    </span>
                  )}
                  {onCancel && (
                    <button
                      onClick={() => onCancel()}
                      disabled={saving}
                      className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  )}
                  {onSave && (
                    <button
                      onClick={() => onSave()}
                      disabled={saving}
                      className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Booking Status</label>
                  <select
                    className={inputCls}
                    disabled={isViewMode || isNewMode}
                    value={isNewMode ? 'Draft' : draft.status}
                    onChange={(e) => onChange({ status: e.target.value as BookingStatus })}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {isNewMode && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Locked to Draft until first save.</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Booking Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={draft.bookingDate}
                    onChange={(e) => onChange({ bookingDate: e.target.value })}
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Carrier Ref</label>
                  <input
                    type="text"
                    className={`${inputCls} ${flagInvalid(draft.carrierRef, REF_RE)}`}
                    placeholder="Carrier ref"
                    value={draft.carrierRef}
                    onChange={(e) => onChange({ carrierRef: e.target.value })}
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className={labelCls}>Supplier Ref</label>
                  <input
                    type="text"
                    className={`${inputCls} ${flagInvalid(draft.supplierRef, REF_RE)}`}
                    placeholder="Supplier ref"
                    value={draft.supplierRef}
                    onChange={(e) => onChange({ supplierRef: e.target.value })}
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Master B/L</label>
                  <input
                    type="text"
                    className={`${inputCls} ${flagInvalid(draft.masterBl, BL_RE)}`}
                    placeholder="MAEU123456789"
                    value={draft.masterBl}
                    onChange={(e) => onChange({ masterBl: e.target.value.toUpperCase() })}
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className={labelCls}>House B/L</label>
                  <input
                    type="text"
                    className={`${inputCls} ${flagInvalid(draft.houseBl, BL_RE)}`}
                    placeholder="House B/L"
                    value={draft.houseBl}
                    onChange={(e) => onChange({ houseBl: e.target.value.toUpperCase() })}
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>B/L Type</label>
                  <select
                    className={inputCls}
                    disabled={isViewMode}
                    value={draft.blType}
                    onChange={(e) => onChange({ blType: e.target.value })}
                  >
                    <option value="">—</option>
                    {BL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>B/L Status</label>
                  <select
                    className={inputCls}
                    disabled={isViewMode}
                    value={draft.blStatus}
                    onChange={(e) => onChange({ blStatus: e.target.value })}
                  >
                    <option value="">—</option>
                    {BL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Incoterms</label>
                  <select
                    className={inputCls}
                    disabled={isViewMode}
                    value={draft.incoterm}
                    onChange={(e) => onChange({ incoterm: e.target.value })}
                  >
                    <option value="">—</option>
                    {INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Freight Terms</label>
                  <select
                    className={inputCls}
                    disabled={isViewMode}
                    value={draft.freightTerms}
                    onChange={(e) => onChange({ freightTerms: e.target.value })}
                  >
                    <option value="">—</option>
                    {FREIGHT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 - INVOLVED PARTIES */}
          <div className="min-w-0">
            <h3 className="text-xs uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
              Involved Parties
            </h3>
            <div className="space-y-2">
              <div>
                <label className={labelCls}>Consignee</label>
                <select
                  className={inputCls}
                  disabled={isViewMode}
                  value={draft.consigneeId}
                  onChange={(e) => onChange({ consigneeId: e.target.value })}
                >
                  <option value="">Select consignee</option>
                  {partyOptions.map(p => (
                    <option key={p.id} value={p.id}>{p.tradingName || p.companyLegalName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Shipper</label>
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="w-full px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded focus-within:ring-1 focus-within:ring-blue-500 bg-white dark:bg-gray-700 min-h-[50px] cursor-pointer"
                    onClick={() => !isViewMode && setIsShipperDropdownOpen(v => !v)}
                  >
                    <div className="flex gap-1 flex-wrap items-center">
                      {draft.shippers.length === 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Select shippers…</span>
                      )}
                      {draft.shippers.map((s) => (
                        <span
                          key={s.shipperId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded whitespace-nowrap"
                        >
                          {s.shipperName || s.shipperId}
                          {!isViewMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeShipper(s.shipperId);
                              }}
                              className="hover:text-blue-900 dark:hover:text-blue-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                      {!isViewMode && (
                        <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400 ml-auto" />
                      )}
                    </div>
                  </div>

                  {isShipperDropdownOpen && !isViewMode && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg">
                      <div className="p-1.5 border-b border-gray-200 dark:border-gray-600">
                        <input
                          type="text"
                          autoFocus
                          value={shipperSearch}
                          onChange={(e) => setShipperSearch(e.target.value)}
                          placeholder="Type to filter shippers…"
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredShipperOptions.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                            No shippers match “{shipperSearch}”.
                          </div>
                        ) : filteredShipperOptions.map((p) => {
                          const label = p.tradingName || p.companyLegalName;
                          const checked = selectedShipperIds.has(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleShipper(p.id, label)}
                                className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Notify</label>
                <select
                  className={inputCls}
                  disabled={isViewMode}
                  value={draft.notifyPartyId}
                  onChange={(e) => onChange({ notifyPartyId: e.target.value })}
                >
                  <option value="">Select notify party</option>
                  {partyOptions.map(p => (
                    <option key={p.id} value={p.id}>{p.tradingName || p.companyLegalName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Column 3 - ROUTING AND EQUIPMENT */}
          <div className="min-w-0">
            <h3 className="text-xs uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
              Routing and Equipment
            </h3>
            <div className="space-y-2">
              <div>
                <label className={labelCls}>Place of Loading (City, Country)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="City"
                    value={draft.placeOfLoadingCity}
                    onChange={(e) => onChange({ placeOfLoadingCity: e.target.value })}
                    disabled={isViewMode}
                  />
                  <select
                    className={inputCls}
                    value={draft.placeOfLoadingCountry}
                    onChange={(e) => onChange({ placeOfLoadingCountry: e.target.value })}
                    disabled={isViewMode}
                  >
                    <option value="">Country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className={labelCls}>POL (UN/LOCODE)</label>
                  <select
                    className={inputCls}
                    value={draft.originPort}
                    onChange={(e) => onChange({ originPort: e.target.value })}
                    disabled={isViewMode}
                  >
                    <option value="">Select UN/LOCODE…</option>
                    {ports.map((port) => (
                      <option key={port.code} value={port.code}>
                        {port.code} - {port.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>POD (UN/LOCODE)</label>
                  <select
                    className={inputCls}
                    value={draft.destinationPort}
                    onChange={(e) => onChange({ destinationPort: e.target.value })}
                    disabled={isViewMode}
                  >
                    <option value="">Select UN/LOCODE…</option>
                    {ports.map((port) => (
                      <option key={port.code} value={port.code}>
                        {port.code} - {port.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Final Destination</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Enter final destination"
                  value={draft.finalDestination}
                  onChange={(e) => onChange({ finalDestination: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          {/* Column 4 - CARGO DETAILS */}
          <div className="min-w-0">
            <h3 className="text-xs uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
              Cargo Details
            </h3>
            <div className="space-y-2">
              <div>
                <label className={labelCls}>Cargo Readiness Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={draft.cargoReadinessDate}
                  onChange={(e) => onChange({ cargoReadinessDate: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
              <div>
                <label className={labelCls}>Cargo Nature</label>
                <select
                  className={inputCls}
                  disabled={isViewMode}
                  value={draft.cargoNature}
                  onChange={(e) => onChange({ cargoNature: e.target.value })}
                >
                  <option value="">—</option>
                  {CARGO_NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Commodity</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Electronics"
                  value={draft.commodity}
                  onChange={(e) => onChange({ commodity: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
