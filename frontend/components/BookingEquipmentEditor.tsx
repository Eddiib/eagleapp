import { useEffect, useState } from 'react';
import { Plus, Copy, Trash2, Calculator, ChevronRight, ChevronDown } from 'lucide-react';
import { equipmentApi } from '../services/equipment';
import { servicesApi } from '../services/services';
import { EquipmentType } from '../types/equipment';
import { Service } from '../types/service';
import { BookingEquipmentLine, EquipmentServiceLine } from '../services/bookings';
import { usePartners } from '../hooks/usePartners';
import { tableClasses } from './ui/table';
import { isPartnerSeller } from '../utils/partnerRoles';

interface Props {
  value: BookingEquipmentLine[];
  onChange: (lines: BookingEquipmentLine[]) => void;
  disabled?: boolean;
}

type ExpandTab = 'services' | 'dimensions';

function emptyLine(catalog: EquipmentType[]): BookingEquipmentLine {
  return {
    equipmentId: catalog[0]?.id || '',
    equipmentName: catalog[0]?.equipmentName,
    equipmentCode: catalog[0]?.equipmentCode,
    category: catalog[0]?.category,
    quantity: 1,
    containerId: '',
    typeSize: '',
    carrierId: '',
    placeOfLoading: '',
    finalDestination: '',
    etd: '',
    eta: '',
    grossWeightKg: null,
    volumeM3: null,
    packages: null,
    commodity: '',
    netWeight: null,
    netWeightUnit: 'kg',
    lengthVal: null,
    widthVal: null,
    heightVal: null,
    dimensionUnit: 'cm',
    totalVolume: null,
    totalDensity: null,
    equipmentServices: [],
  };
}

function emptyServiceLine(): EquipmentServiceLine {
  return { serviceId: '', equipmentId: '', invoicePartyId: '', agreedRate: null, supplierId: '', agreedCost: null, plannedDate: null };
}

// ── Weight & Dimensions sub-panel ─────────────────────────────────────────────
interface DimensionPanelProps {
  line: BookingEquipmentLine;
  onChange: (patch: Partial<BookingEquipmentLine>) => void;
  disabled?: boolean;
}

function DimensionPanel({ line, onChange, disabled }: DimensionPanelProps) {
  const inp = (extra = '') =>
    `px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-blue-500 ${extra}`;
  const unitSel = `px-1.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500`;

  const calcVolume = (l: BookingEquipmentLine) => {
    const len = l.lengthVal ?? 0;
    const wid = l.widthVal ?? 0;
    const hgt = l.heightVal ?? 0;
    if (!len || !wid || !hgt) return null;
    const unit = l.dimensionUnit || 'cm';
    const factor = unit === 'm' ? 1 : unit === 'in' ? 0.0254 : unit === 'ft' ? 0.3048 : 0.01;
    return parseFloat((len * factor * wid * factor * hgt * factor).toFixed(6));
  };

  const calcDensity = (l: BookingEquipmentLine) => {
    const gw = l.grossWeightKg ?? 0;
    const vol = l.totalVolume ?? calcVolume(l) ?? 0;
    if (!gw || !vol) return null;
    return parseFloat((gw / vol).toFixed(4));
  };

  const handleDimChange = (patch: Partial<BookingEquipmentLine>) => {
    const next = { ...line, ...patch };
    const vol = calcVolume(next);
    if (vol !== null) next.totalVolume = vol;
    next.totalDensity = calcDensity(next);
    onChange(next);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-7 gap-3">
        {/* Net Weight */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Net Weight</label>
          <div className="flex gap-1">
            <input
              type="number" min={0} step={0.01}
              value={line.netWeight ?? ''}
              onChange={e => handleDimChange({ netWeight: e.target.value === '' ? null : parseFloat(e.target.value) })}
              disabled={disabled}
              placeholder="0.00"
              className={inp('w-24')}
            />
            <select
              value={line.netWeightUnit || 'kg'}
              onChange={e => handleDimChange({ netWeightUnit: e.target.value })}
              disabled={disabled}
              className={unitSel}
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
              <option value="t">t</option>
            </select>
          </div>
        </div>

        {/* Gross Weight — stored in kg; the unit label is fixed. */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Gross Weight</label>
          <div className="flex gap-1 items-center">
            <input
              type="number" min={0} step={0.01}
              value={line.grossWeightKg ?? ''}
              onChange={e => handleDimChange({ grossWeightKg: e.target.value === '' ? null : parseFloat(e.target.value) })}
              disabled={disabled}
              placeholder="0.00"
              className={inp('w-24')}
            />
            <span className="px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400">kg</span>
          </div>
        </div>

        {/* Length */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Length</label>
          <div className="flex gap-1">
            <input
              type="number" min={0} step={0.001}
              value={line.lengthVal ?? ''}
              onChange={e => handleDimChange({ lengthVal: e.target.value === '' ? null : parseFloat(e.target.value) })}
              disabled={disabled}
              placeholder="0.00"
              className={inp('w-24')}
            />
            <select
              value={line.dimensionUnit || 'cm'}
              onChange={e => handleDimChange({ dimensionUnit: e.target.value })}
              disabled={disabled}
              className={unitSel}
            >
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
          </div>
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Width</label>
          <div className="flex gap-1">
            <input
              type="number" min={0} step={0.001}
              value={line.widthVal ?? ''}
              onChange={e => handleDimChange({ widthVal: e.target.value === '' ? null : parseFloat(e.target.value) })}
              disabled={disabled}
              placeholder="0.00"
              className={inp('w-24')}
            />
            <select
              value={line.dimensionUnit || 'cm'}
              onChange={e => handleDimChange({ dimensionUnit: e.target.value })}
              disabled={disabled}
              className={unitSel}
            >
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
          </div>
        </div>

        {/* Height */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Height</label>
          <div className="flex gap-1">
            <input
              type="number" min={0} step={0.001}
              value={line.heightVal ?? ''}
              onChange={e => handleDimChange({ heightVal: e.target.value === '' ? null : parseFloat(e.target.value) })}
              disabled={disabled}
              placeholder="0.00"
              className={inp('w-24')}
            />
            <select
              value={line.dimensionUnit || 'cm'}
              onChange={e => handleDimChange({ dimensionUnit: e.target.value })}
              disabled={disabled}
              className={unitSel}
            >
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
          </div>
        </div>

        {/* Total Volume */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Total Volume</label>
          <input
            type="number" min={0} step={0.001}
            value={line.totalVolume ?? ''}
            onChange={e => {
              const vol = e.target.value === '' ? null : parseFloat(e.target.value);
              const density = vol && (line.grossWeightKg ?? 0) ? parseFloat(((line.grossWeightKg ?? 0) / vol).toFixed(4)) : null;
              onChange({ totalVolume: vol, totalDensity: density });
            }}
            disabled={disabled}
            placeholder="0.00"
            className={inp('w-full')}
          />
        </div>

        {/* Total Density */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Total Density</label>
          <input
            type="number" min={0} step={0.0001}
            value={line.totalDensity ?? ''}
            onChange={e => onChange({ totalDensity: e.target.value === '' ? null : parseFloat(e.target.value) })}
            disabled={disabled}
            placeholder="0.00"
            className={inp('w-full')}
          />
        </div>
      </div>
    </div>
  );
}

// ── Equipment Services sub-panel ──────────────────────────────────────────────
interface ServicesPanelProps {
  rowIndex: number;
  services: EquipmentServiceLine[];
  onChange: (services: EquipmentServiceLine[]) => void;
  disabled?: boolean;
  catalog: EquipmentType[];
  servicesCatalog: Service[];
  partners: any[];
}

function ServicesPanel({ rowIndex, services, onChange, disabled, catalog, servicesCatalog, partners }: ServicesPanelProps) {
  const inp = (extra = '') =>
    `w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-blue-500 ${extra}`;
  const activePartners = partners.filter(p => p.status === 'Active');
  const supplierPartners = activePartners.filter(isPartnerSeller);

  const setService = (idx: number, patch: Partial<EquipmentServiceLine>) => {
    onChange(services.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const addService = () => onChange([...services, emptyServiceLine()]);
  const removeService = (idx: number) => onChange(services.filter((_, i) => i !== idx));

  const [bulkDate, setBulkDate] = useState('');
  const applyBulkDate = () => {
    if (!bulkDate) return;
    onChange(services.map((s) => ({ ...s, plannedDate: bulkDate })));
  };

  const thBase = `${tableClasses.denseHead} text-gray-500 dark:text-gray-400`;
  const th = `${thBase} text-left`;
  const thRight = `${thBase} text-right`;
  const td = tableClasses.denseCell;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Bulk apply planned date */}
      <div className="flex items-end gap-2 mb-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Planned Date (apply to all)</label>
          <input
            type="date"
            value={bulkDate}
            onChange={e => setBulkDate(e.target.value)}
            disabled={disabled || services.length === 0}
            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={applyBulkDate}
          disabled={disabled || !bulkDate || services.length === 0}
          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          title="Set this date as the planned completion date for every service below. You can still change each row individually."
        >
          Apply to all
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className={th} style={{ width: 60 }}>Equip. ID</th>
            <th className={th} style={{ width: 140 }}>Planned Date</th>
            <th className={th}>Service Type</th>
            <th className={th}>Equipment</th>
            <th className={th}>Invoice Party</th>
            <th className={thRight} style={{ width: 120 }}>Agreed Rate</th>
            <th className={th}>Supplier</th>
            <th className={thRight} style={{ width: 120 }}>Agreed Cost</th>
            <th className={`${th} w-8`}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {services.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                No services added for this equipment row.
              </td>
            </tr>
          ) : services.map((svc, idx) => (
            <tr key={idx}>
              <td className={td}>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{rowIndex + 1}</span>
              </td>
              <td className={td}>
                <input
                  type="date"
                  value={svc.plannedDate ?? ''}
                  onChange={e => setService(idx, { plannedDate: e.target.value || null })}
                  disabled={disabled}
                  className={inp()}
                />
              </td>
              <td className={td}>
                <select
                  value={svc.serviceId ?? ''}
                  onChange={e => {
                    const svcObj = servicesCatalog.find(s => s.id === e.target.value);
                    setService(idx, {
                      serviceId: e.target.value,
                      serviceName: svcObj?.serviceName,
                      serviceCode: svcObj?.serviceCode,
                    });
                  }}
                  disabled={disabled}
                  className={inp()}
                >
                  <option value="">Select Service Type...</option>
                  {servicesCatalog.map(s => (
                    <option key={s.id} value={s.id}>{s.serviceName}</option>
                  ))}
                </select>
              </td>
              <td className={td}>
                <select
                  value={svc.equipmentId ?? ''}
                  onChange={e => {
                    const eq = catalog.find(c => c.id === e.target.value);
                    setService(idx, {
                      equipmentId: e.target.value,
                      equipmentName: eq?.equipmentName,
                      equipmentCode: eq?.equipmentCode,
                    });
                  }}
                  disabled={disabled}
                  className={inp()}
                >
                  <option value="">—</option>
                  {catalog.map(c => (
                    <option key={c.id} value={c.id}>{c.equipmentName} ({c.equipmentCode})</option>
                  ))}
                </select>
              </td>
              <td className={td}>
                <select
                  value={svc.invoicePartyId ?? ''}
                  onChange={e => {
                    const p = partners.find(p => p.id === e.target.value);
                    setService(idx, { invoicePartyId: e.target.value, invoicePartyName: p?.companyLegalName });
                  }}
                  disabled={disabled}
                  className={inp()}
                >
                  <option value="">Select Invoice Party...</option>
                  {activePartners.map(p => (
                    <option key={p.id} value={p.id}>{p.tradingName || p.companyLegalName}</option>
                  ))}
                </select>
              </td>
              <td className={td}>
                <input
                  type="number" min={0} step={0.01}
                  value={svc.agreedRate ?? ''}
                  onChange={e => setService(idx, { agreedRate: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  disabled={disabled}
                  placeholder="0.00"
                  className={inp('text-right')}
                />
              </td>
              <td className={td}>
                <select
                  value={svc.supplierId ?? ''}
                  onChange={e => {
                    const p = partners.find(p => p.id === e.target.value);
                    setService(idx, { supplierId: e.target.value, supplierName: p?.companyLegalName });
                  }}
                  disabled={disabled}
                  className={inp()}
                >
                  <option value="">Select Supplier...</option>
                  {supplierPartners.map(p => (
                    <option key={p.id} value={p.id}>{p.tradingName || p.companyLegalName}</option>
                  ))}
                </select>
              </td>
              <td className={td}>
                <input
                  type="number" min={0} step={0.01}
                  value={svc.agreedCost ?? ''}
                  onChange={e => setService(idx, { agreedCost: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  disabled={disabled}
                  placeholder="0.00"
                  className={inp('text-right')}
                />
              </td>
              <td className={td}>
                <button
                  type="button"
                  onClick={() => removeService(idx)}
                  disabled={disabled}
                  className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addService}
        disabled={disabled}
        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Service
      </button>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────
export function BookingEquipmentEditor({ value, onChange, disabled }: Props) {
  const [catalog, setCatalog] = useState<EquipmentType[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<Service[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Map<number, ExpandTab>>(new Map());
  const { partners } = usePartners();

  const CARRIER_TYPES = ['Shipping Line', 'Air Carrier', 'Trucking Company', 'Rail Operator'];
  const carriers = partners.filter(p =>
    p.status === 'Active' &&
    (p.partnerClass === 'Carrier' ||
     CARRIER_TYPES.includes(p.partnerType) ||
     CARRIER_TYPES.includes(p.partnerCategory ?? ''))
  );

  useEffect(() => {
    equipmentApi.getAll()
      .then(list => setCatalog(list.filter(e => e.isActive)))
      .catch(err => setLoadError(err.message || 'Failed to load equipment'));
    servicesApi.getAll()
      .then(list => setServicesCatalog(list.filter((s: Service) => s.isActive !== false)))
      .catch(() => {});
  }, []);

  const setLine = (idx: number, patch: Partial<BookingEquipmentLine>) => {
    onChange(value.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...patch };
      if (patch.equipmentId !== undefined) {
        const eq = catalog.find(c => c.id === patch.equipmentId);
        merged.equipmentCode = eq?.equipmentCode;
        merged.equipmentName = eq?.equipmentName;
        merged.category = eq?.category;
      }
      return merged;
    }));
  };

  const addRow = () => {
    onChange([...value, emptyLine(catalog)]);
  };

  const duplicateRow = () => {
    if (selected.size === 0) {
      if (value.length === 0) return;
      onChange([...value, { ...value[value.length - 1], id: undefined }]);
      return;
    }
    const dupes: BookingEquipmentLine[] = [];
    selected.forEach(idx => dupes.push({ ...value[idx], id: undefined }));
    onChange([...value, ...dupes]);
    setSelected(new Set());
  };

  const deleteRows = () => {
    if (selected.size === 0) return;
    const next = value.filter((_, i) => !selected.has(i));
    // shift expanded indices
    const newExpanded = new Map<number, ExpandTab>();
    let offset = 0;
    value.forEach((_, i) => {
      if (selected.has(i)) { offset++; return; }
      if (expanded.has(i)) newExpanded.set(i - offset, expanded.get(i)!);
    });
    onChange(next);
    setSelected(new Set());
    setExpanded(newExpanded);
  };

  const autoCalcTotals = () => {
    onChange(value.map(l => ({
      ...l,
      grossWeightKg: l.grossWeightKg ?? 0,
      volumeM3: l.volumeM3 ?? 0,
      packages: l.packages ?? 0,
    })));
  };

  const toggleSelect = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === value.length) setSelected(new Set());
    else setSelected(new Set(value.map((_, i) => i)));
  };

  const toggleExpand = (idx: number, tab: ExpandTab = 'services') => {
    const cur = expanded.get(idx);
    const next = new Map(expanded);
    if (cur === tab) next.delete(idx);
    else next.set(idx, tab);
    setExpanded(next);
  };

  const totalGW = value.reduce((s, l) => s + (l.grossWeightKg ?? 0), 0);
  const totalVol = value.reduce((s, l) => s + (l.volumeM3 ?? 0), 0);
  const totalPkgs = value.reduce((s, l) => s + (l.packages ?? 0), 0);

  const thBase = `${tableClasses.denseHead} text-gray-500 dark:text-gray-400`;
  const th = `${thBase} text-left`;
  const thRight = `${thBase} text-right`;
  const td = tableClasses.denseCell;
  const inp = (extra = '') =>
    `w-full px-1.5 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${extra}`;

  const COL_COUNT = 13;

  return (
    <div className="space-y-3">
      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">Failed to load equipment catalog: {loadError}</div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[1400px] text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-2 py-2 w-8">
                <input type="checkbox"
                  checked={value.length > 0 && selected.size === value.length}
                  onChange={toggleSelectAll}
                  disabled={disabled || value.length === 0}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              <th className="px-2 py-2 w-6"></th>
              <th className={th}>Container ID</th>
              <th className={th}>Type / Size</th>
              <th className={th}>Carrier</th>
              <th className={th}>Place of Loading</th>
              <th className={th}>Final Destination</th>
              <th className={th}>ETD</th>
              <th className={th}>ETA</th>
              <th className={thRight}>Gross Weight (KG)</th>
              <th className={thRight}>Volume (M³)</th>
              <th className={thRight}>Packages</th>
              <th className={th}>Commodity</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {value.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  No equipment rows yet. Click <strong>Add Row</strong> below to begin.
                </td>
              </tr>
            ) : value.map((line, idx) => {
              const isExpanded = expanded.has(idx);
              const activeTab = expanded.get(idx) ?? 'services';
              return (
                <>
                  {/* Main row */}
                  <tr
                    key={`row-${idx}`}
                    className={selected.has(idx)
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }
                  >
                    <td className={`${td} w-8`}>
                      <input type="checkbox"
                        checked={selected.has(idx)}
                        onChange={() => toggleSelect(idx)}
                        disabled={disabled}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className={`${td} w-6`}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(idx)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded transition-transform"
                        title={isExpanded ? 'Collapse' : 'Expand row details'}
                      >
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />
                        }
                      </button>
                    </td>

                    <td className={td}>
                      <input type="text"
                        value={line.containerId ?? ''}
                        onChange={e => setLine(idx, { containerId: e.target.value })}
                        disabled={disabled}
                        placeholder="MSKU1234567"
                        className={inp('w-32')}
                      />
                    </td>
                    <td className={td}>
                      <input type="text"
                        value={line.typeSize ?? ''}
                        onChange={e => setLine(idx, { typeSize: e.target.value })}
                        disabled={disabled}
                        placeholder="40HC"
                        className={inp('w-20')}
                      />
                    </td>
                    <td className={td}>
                      <select
                        value={line.carrierId ?? ''}
                        onChange={e => setLine(idx, { carrierId: e.target.value })}
                        disabled={disabled}
                        className={inp('w-36')}
                      >
                        <option value="">—</option>
                        {carriers.map(c => (
                          <option key={c.id} value={c.id}>{c.tradingName || c.companyLegalName}</option>
                        ))}
                      </select>
                    </td>
                    <td className={td}>
                      <input type="text"
                        value={line.placeOfLoading ?? ''}
                        onChange={e => setLine(idx, { placeOfLoading: e.target.value })}
                        disabled={disabled}
                        placeholder="Port / city"
                        className={inp('w-36')}
                      />
                    </td>
                    <td className={td}>
                      <input type="text"
                        value={line.finalDestination ?? ''}
                        onChange={e => setLine(idx, { finalDestination: e.target.value })}
                        disabled={disabled}
                        placeholder="Port / city"
                        className={inp('w-36')}
                      />
                    </td>
                    <td className={td}>
                      <input type="date"
                        value={line.etd ?? ''}
                        onChange={e => setLine(idx, { etd: e.target.value })}
                        disabled={disabled}
                        className={inp('w-32')}
                      />
                    </td>
                    <td className={td}>
                      <input type="date"
                        value={line.eta ?? ''}
                        onChange={e => setLine(idx, { eta: e.target.value })}
                        disabled={disabled}
                        className={inp('w-32')}
                      />
                    </td>
                    <td className={td}>
                      <input type="number" min={0} step={0.01}
                        value={line.grossWeightKg ?? ''}
                        onChange={e => setLine(idx, { grossWeightKg: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        disabled={disabled}
                        placeholder="0.00"
                        className={inp('w-28 text-right')}
                      />
                    </td>
                    <td className={td}>
                      <input type="number" min={0} step={0.001}
                        value={line.volumeM3 ?? ''}
                        onChange={e => setLine(idx, { volumeM3: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        disabled={disabled}
                        placeholder="0.000"
                        className={inp('w-24 text-right')}
                      />
                    </td>
                    <td className={td}>
                      <input type="number" min={0} step={1}
                        value={line.packages ?? ''}
                        onChange={e => setLine(idx, { packages: e.target.value === '' ? null : parseInt(e.target.value) })}
                        disabled={disabled}
                        placeholder="0"
                        className={inp('w-20 text-right')}
                      />
                    </td>
                    <td className={td}>
                      <input type="text"
                        value={line.commodity ?? ''}
                        onChange={e => setLine(idx, { commodity: e.target.value })}
                        disabled={disabled}
                        placeholder="Description"
                        className={inp('w-40')}
                      />
                    </td>
                  </tr>

                  {/* Expandable panel */}
                  {isExpanded && (
                    <tr key={`expand-${idx}`}>
                      <td colSpan={COL_COUNT} className="p-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        {/* Tab bar */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4">
                          {(['services', 'dimensions'] as ExpandTab[]).map(tab => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => toggleExpand(idx, tab)}
                              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab
                                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                              }`}
                            >
                              {tab === 'services' ? 'Services' : 'Weight & Dimensions'}
                            </button>
                          ))}
                        </div>

                        {activeTab === 'services' ? (
                          <ServicesPanel
                            rowIndex={idx}
                            services={line.equipmentServices || []}
                            onChange={svcs => setLine(idx, { equipmentServices: svcs })}
                            disabled={disabled}
                            catalog={catalog}
                            servicesCatalog={servicesCatalog}
                            partners={partners}
                          />
                        ) : (
                          <DimensionPanel
                            line={line}
                            onChange={patch => setLine(idx, patch)}
                            disabled={disabled}
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>

          {value.length > 0 && (
            <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
              <tr>
                <td colSpan={10} className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">
                  Totals
                </td>
                <td className="px-2 py-2 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">
                  {totalGW > 0 ? totalGW.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                </td>
                <td className="px-2 py-2 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">
                  {totalVol > 0 ? totalVol.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                </td>
                <td className="px-2 py-2 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">
                  {totalPkgs > 0 ? totalPkgs.toLocaleString() : '—'}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={addRow} disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Plus className="w-4 h-4" /> Add Row
        </button>
        <button type="button" onClick={duplicateRow} disabled={disabled || value.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors">
          <Copy className="w-4 h-4" /> Duplicate Row
        </button>
        <button type="button" onClick={deleteRows} disabled={disabled || selected.size === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 disabled:opacity-50 transition-colors">
          <Trash2 className="w-4 h-4" /> Delete Row
        </button>
        <button type="button" onClick={autoCalcTotals} disabled={disabled || value.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors">
          <Calculator className="w-4 h-4" /> Auto-calc Totals
        </button>
        {value.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {value.length} row{value.length !== 1 ? 's' : ''}
            {selected.size > 0 && ` · ${selected.size} selected`}
          </span>
        )}
      </div>
    </div>
  );
}
