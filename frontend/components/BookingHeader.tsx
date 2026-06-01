import { ArrowLeft, Edit, Save, X, ChevronDown, Loader2, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Booking, BookingPartySummary, BookingStatus } from '../services/bookings';
import { Partner } from '../types/partner';
import { usePartners } from '../hooks/usePartners';
import { countries } from '../data/countries';
import { usePorts } from '../hooks/usePorts';
import { PartnerPicker } from './PartnerPicker';
import { PortPicker } from './PortPicker';
import { employeesApi } from '../services/employees';
import { Employee } from './EmployeesModule';
import { useAuth } from '../context/AuthContext';
import { useBookingStatuses } from '../context/BookingStatusesContext';
import { FALLBACK_COLOR, readableTextColor } from './ui/StatusBadge';

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

  const { user, can } = useAuth();
  const { activeStatuses, colorFor } = useBookingStatuses();
  const canReassignAgent = can('edit:booking-agent-assignment');
  const agentFieldDisabled = isViewMode || !canReassignAgent;
  const statusMissingFromActive =
    !isNewMode && draft.status && !activeStatuses.some((s) => s.name === draft.status);

  const [employees, setEmployees] = useState<Employee[]>([]);
  useEffect(() => {
    employeesApi.getAll().then((rows) => setEmployees(rows.filter((e) => e.isActive))).catch(() => {});
  }, []);

  // New bookings default the agent to the current user's linked employee so
  // the dropdown mirrors what the backend will save when permission is absent.
  useEffect(() => {
    if (isNewMode && !draft.assignedAgentId && user?.employee_id) {
      onChange({ assignedAgentId: user.employee_id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewMode, user?.employee_id]);

  const formatEmployeeName = (e: Employee) => `${e.firstName} ${e.surname}`.trim() || e.employeeCode;

  const { partners } = usePartners();
  const { ports } = usePorts();
  const activePartners = useMemo(() => partners.filter(p => p.status === 'Active'), [partners]);
  const partyOptions = activePartners;

  const [consigneePickerOpen, setConsigneePickerOpen] = useState(false);
  const [shipperPickerOpen, setShipperPickerOpen] = useState(false);
  const [notifyPickerOpen, setNotifyPickerOpen] = useState(false);
  const [polPickerOpen, setPolPickerOpen] = useState(false);
  const [podPickerOpen, setPodPickerOpen] = useState(false);

  const polDisplay = useMemo(() => {
    if (!draft.originPort) return '';
    const p = ports.find((x) => x.code === draft.originPort);
    return p ? `${p.code} - ${p.name}` : draft.originPort;
  }, [draft.originPort, ports]);

  const podDisplay = useMemo(() => {
    if (!draft.destinationPort) return '';
    const p = ports.find((x) => x.code === draft.destinationPort);
    return p ? `${p.code} - ${p.name}` : draft.destinationPort;
  }, [draft.destinationPort, ports]);

  // Names to show in the read-only fields — prefer what the API gave us,
  // fall back to a lookup against the loaded partner list.
  const consigneeDisplayName = useMemo(() => {
    if (draft.consigneeName) return draft.consigneeName;
    if (!draft.consigneeId) return '';
    const p = partyOptions.find((x) => x.id === draft.consigneeId);
    return p?.tradingName || p?.companyLegalName || '';
  }, [draft.consigneeName, draft.consigneeId, partyOptions]);

  const notifyDisplayName = useMemo(() => {
    if (draft.notifyPartyName) return draft.notifyPartyName;
    if (!draft.notifyPartyId) return '';
    const p = partyOptions.find((x) => x.id === draft.notifyPartyId);
    return p?.tradingName || p?.companyLegalName || '';
  }, [draft.notifyPartyName, draft.notifyPartyId, partyOptions]);

  const applyShippers = (chosen: Partner[]) => {
    const next: BookingPartySummary[] = chosen.map((p) => ({
      shipperId: p.id,
      shipperName: p.tradingName || p.companyLegalName,
    }));
    const primaryShipperId = next[0]?.shipperId ?? '';
    onChange({ shippers: next, shipperId: primaryShipperId });
  };

  const removeShipper = (partnerId: string) => {
    const next = draft.shippers.filter((s) => s.shipperId !== partnerId);
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
                <span
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: colorFor(draft.status) || FALLBACK_COLOR,
                    color: readableTextColor(colorFor(draft.status) || FALLBACK_COLOR),
                  }}
                >
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
                    value={isNewMode ? (activeStatuses[0]?.name ?? '') : draft.status}
                    onChange={(e) => onChange({ status: e.target.value as BookingStatus })}
                  >
                    {statusMissingFromActive && (
                      <option value={draft.status}>{draft.status} (inactive)</option>
                    )}
                    {activeStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  {isNewMode && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Locked to {activeStatuses[0]?.name ?? 'the first status'} until first save.
                    </p>
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
              <div>
                <label className={labelCls}>
                  Assigned Agent
                  {!canReassignAgent && !isViewMode && (
                    <span className="ml-1 text-[10px] text-gray-400">(view only)</span>
                  )}
                </label>
                <select
                  className={inputCls}
                  disabled={agentFieldDisabled}
                  value={draft.assignedAgentId || ''}
                  onChange={(e) => onChange({ assignedAgentId: e.target.value || undefined })}
                >
                  <option value="">{draft.assignedAgentName || 'Unassigned'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{formatEmployeeName(emp)}</option>
                  ))}
                </select>
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setConsigneePickerOpen(true)}
                    disabled={isViewMode}
                    className={`${inputCls} text-left truncate ${
                      consigneeDisplayName ? '' : 'text-gray-400 dark:text-gray-500'
                    } disabled:cursor-not-allowed`}
                  >
                    {consigneeDisplayName || 'Select consignee…'}
                  </button>
                  {!isViewMode && draft.consigneeId && (
                    <button
                      type="button"
                      onClick={() => onChange({ consigneeId: '', consigneeName: '' })}
                      title="Clear consignee"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Shipper</label>
                <div
                  className={`w-full px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded focus-within:ring-1 focus-within:ring-blue-500 bg-white dark:bg-gray-700 min-h-[50px] ${
                    isViewMode ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  onClick={() => !isViewMode && setShipperPickerOpen(true)}
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
              </div>
              <div>
                <label className={labelCls}>Notify</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNotifyPickerOpen(true)}
                    disabled={isViewMode}
                    className={`${inputCls} text-left truncate ${
                      notifyDisplayName ? '' : 'text-gray-400 dark:text-gray-500'
                    } disabled:cursor-not-allowed`}
                  >
                    {notifyDisplayName || 'Select notify party…'}
                  </button>
                  {!isViewMode && draft.notifyPartyId && (
                    <button
                      type="button"
                      onClick={() => onChange({ notifyPartyId: '', notifyPartyName: '' })}
                      title="Clear notify party"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPolPickerOpen(true)}
                      disabled={isViewMode}
                      className={`${inputCls} text-left truncate ${
                        polDisplay ? '' : 'text-gray-400 dark:text-gray-500'
                      } disabled:cursor-not-allowed`}
                    >
                      {polDisplay || 'Select UN/LOCODE…'}
                    </button>
                    {!isViewMode && draft.originPort && (
                      <button
                        type="button"
                        onClick={() => onChange({ originPort: '' })}
                        title="Clear POL"
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>POD (UN/LOCODE)</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPodPickerOpen(true)}
                      disabled={isViewMode}
                      className={`${inputCls} text-left truncate ${
                        podDisplay ? '' : 'text-gray-400 dark:text-gray-500'
                      } disabled:cursor-not-allowed`}
                    >
                      {podDisplay || 'Select UN/LOCODE…'}
                    </button>
                    {!isViewMode && draft.destinationPort && (
                      <button
                        type="button"
                        onClick={() => onChange({ destinationPort: '' })}
                        title="Clear POD"
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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

      <PartnerPicker
        open={consigneePickerOpen}
        title="Select Consignee"
        currentId={draft.consigneeId || undefined}
        filter={(p) => p.status === 'Active'}
        onClose={() => setConsigneePickerOpen(false)}
        onSelect={(p) => {
          onChange({
            consigneeId: p.id,
            consigneeName: p.tradingName || p.companyLegalName,
          });
          setConsigneePickerOpen(false);
        }}
      />

      <PartnerPicker
        open={shipperPickerOpen}
        title="Select Shippers"
        mode="multi"
        selectedIds={draft.shippers.map((s) => s.shipperId)}
        filter={(p) => p.status === 'Active'}
        onClose={() => setShipperPickerOpen(false)}
        onConfirm={applyShippers}
      />

      <PartnerPicker
        open={notifyPickerOpen}
        title="Select Notify Party"
        currentId={draft.notifyPartyId || undefined}
        filter={(p) => p.status === 'Active'}
        onClose={() => setNotifyPickerOpen(false)}
        onSelect={(p) => {
          onChange({
            notifyPartyId: p.id,
            notifyPartyName: p.tradingName || p.companyLegalName,
          });
          setNotifyPickerOpen(false);
        }}
      />

      <PortPicker
        open={polPickerOpen}
        title="Select Port of Loading"
        currentCode={draft.originPort || undefined}
        onClose={() => setPolPickerOpen(false)}
        onSelect={(p) => {
          onChange({ originPort: p.code });
          setPolPickerOpen(false);
        }}
      />

      <PortPicker
        open={podPickerOpen}
        title="Select Port of Discharge"
        currentCode={draft.destinationPort || undefined}
        onClose={() => setPodPickerOpen(false)}
        onSelect={(p) => {
          onChange({ destinationPort: p.code });
          setPodPickerOpen(false);
        }}
      />
    </div>
  );
}
