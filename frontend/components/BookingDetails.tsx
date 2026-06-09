import { useState, useEffect } from 'react';
import { Download, Filter, Search, X, RefreshCw } from 'lucide-react';
import { bookingsApi, Booking } from '../services/bookings';

// One row per service line: booking → equipment line → equipment service.
// Booking + equipment fields repeat across the rows so any single service is
// findable on its own line.
interface BookingDetailRow {
  bookingId: string;
  bookingNumber: string;
  clientName: string;
  container: string;
  typeSize: string;
  equipment: string;
  carrier: string;
  placeOfLoading: string;
  finalDestination: string;
  etd: string;
  eta: string;
  commodity: string;

  serviceType: string;
  plannedDate: string;
  supplier: string;
  rate: number | null;
  cost: number | null;
  currency: string;
}

type ColumnKey =
  | 'bookingNumber' | 'clientName' | 'container' | 'typeSize' | 'equipment' | 'carrier'
  | 'placeOfLoading' | 'finalDestination' | 'etd' | 'eta' | 'commodity'
  | 'serviceType' | 'plannedDate' | 'supplier' | 'rate' | 'cost' | 'currency';

interface BookingDetailsProps {
  onNavigateToBooking?: (bookingId: string) => void;
}

// Flatten every booking into one row per equipment service. Equipment lines
// with no services still produce a row (empty service columns); likewise
// bookings with no equipment.
function buildRows(bookings: Booking[]): BookingDetailRow[] {
  const rows: BookingDetailRow[] = [];
  for (const b of bookings) {
    const bookingBase = {
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      clientName: b.clientName || b.consigneeName || '',
      currency: b.currency || '',
    };
    const emptyEquipment = {
      container: '', typeSize: '', equipment: '', carrier: b.carrierName || '',
      placeOfLoading: '', finalDestination: '', etd: '', eta: '', commodity: b.commodity || '',
    };
    const emptyService = { serviceType: '', plannedDate: '', supplier: '', rate: null, cost: null };

    if (b.equipment.length === 0) {
      rows.push({ ...bookingBase, ...emptyEquipment, ...emptyService });
      continue;
    }

    for (const e of b.equipment) {
      const equipmentBase = {
        ...bookingBase,
        container: e.containerId || '',
        typeSize: e.typeSize || '',
        equipment: e.equipmentName || e.equipmentCode || '',
        carrier: e.carrierName || b.carrierName || '',
        placeOfLoading: e.placeOfLoading || '',
        finalDestination: e.finalDestination || '',
        etd: e.etd || '',
        eta: e.eta || '',
        commodity: e.commodity || b.commodity || '',
      };
      const services = e.equipmentServices || [];
      if (services.length === 0) {
        rows.push({ ...equipmentBase, ...emptyService });
      } else {
        for (const s of services) {
          rows.push({
            ...equipmentBase,
            serviceType: s.serviceName || s.serviceCode || '',
            plannedDate: s.plannedDate || '',
            supplier: s.supplierName || '',
            rate: s.agreedRate ?? null,
            cost: s.agreedCost ?? null,
          });
        }
      }
    }
  }
  return rows;
}

// Cell value as text — '—' for empty, 2dp for money.
function cellText(row: BookingDetailRow, key: ColumnKey): string {
  const v = row[key];
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toFixed(2);
  return String(v);
}

// Like cellText but blank (not '—') for empty — used for search/filter matching.
function filterText(row: BookingDetailRow, key: ColumnKey): string {
  const v = row[key];
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return v.toFixed(2);
  return String(v);
}

export function BookingDetails({ onNavigateToBooking }: BookingDetailsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Partial<Record<ColumnKey, string>>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<ColumnKey | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>({
    bookingNumber: 130,
    clientName: 170,
    container: 130,
    typeSize: 110,
    equipment: 150,
    carrier: 150,
    placeOfLoading: 160,
    finalDestination: 160,
    etd: 100,
    eta: 100,
    commodity: 140,
    serviceType: 170,
    plannedDate: 120,
    supplier: 160,
    rate: 100,
    cost: 100,
    currency: 90,
  });
  const [resizing, setResizing] = useState<ColumnKey | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const detailed = await bookingsApi.getAllDetailed();
      setBookings(detailed);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const rows = buildRows(bookings);

  const handleMouseDown = (e: React.MouseEvent, columnKey: ColumnKey) => {
    setResizing(columnKey);
    setStartX(e.pageX);
    setStartWidth(columnWidths[columnKey]);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const diff = e.pageX - startX;
        const newWidth = Math.max(80, startWidth + diff);
        setColumnWidths(prev => ({ ...prev, [resizing]: newWidth }));
      }
    };
    const handleMouseUp = () => setResizing(null);
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, startX, startWidth]);

  const filteredRows = rows.filter(row => {
    const needle = searchTerm.toLowerCase();
    const matchesSearch = needle === '' ||
      row.bookingNumber.toLowerCase().includes(needle) ||
      row.clientName.toLowerCase().includes(needle) ||
      row.serviceType.toLowerCase().includes(needle) ||
      row.container.toLowerCase().includes(needle) ||
      row.equipment.toLowerCase().includes(needle) ||
      row.commodity.toLowerCase().includes(needle);
    const matchesColumnFilters = Object.entries(columnFilters).every(([key, value]) => {
      if (!value) return true;
      return filterText(row, key as ColumnKey).toLowerCase().includes(String(value).toLowerCase());
    });
    return matchesSearch && matchesColumnFilters;
  });

  const getUniqueValues = (key: ColumnKey) => {
    const values = rows.map(row => filterText(row, key));
    return Array.from(new Set(values)).filter(v => v !== '').sort();
  };

  const handleFilterChange = (columnKey: ColumnKey, value: string) =>
    setColumnFilters(prev => ({ ...prev, [columnKey]: value }));
  const clearFilter = (columnKey: ColumnKey) =>
    setColumnFilters(prev => { const n = { ...prev }; delete n[columnKey]; return n; });
  const clearAllFilters = () => setColumnFilters({});

  const handleBookingClick = (bookingId: string) => {
    if (onNavigateToBooking) onNavigateToBooking(bookingId);
  };

  const FilterDropdown = ({ columnKey, label }: { columnKey: ColumnKey; label: string }) => {
    const uniqueValues = getUniqueValues(columnKey);
    const isActive = activeFilterColumn === columnKey;
    const hasFilter = !!columnFilters[columnKey];
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setActiveFilterColumn(isActive ? null : columnKey)}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            hasFilter ? 'text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          <Filter className="w-3 h-3" />
        </button>
        {isActive && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]">
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <input
                type="text"
                value={columnFilters[columnKey] || ''}
                onChange={(e) => handleFilterChange(columnKey, e.target.value)}
                placeholder={`Filter ${label}...`}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {uniqueValues.map(value => (
                <button
                  key={value}
                  onClick={() => { handleFilterChange(columnKey, value); setActiveFilterColumn(null); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {value}
                </button>
              ))}
            </div>
            {hasFilter && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => { clearFilter(columnKey); setActiveFilterColumn(null); }}
                  className="w-full px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const activeFiltersCount = Object.keys(columnFilters).length;

  // Booking + equipment columns (left, plain); commodity tinted blue.
  const mainCols: { key: ColumnKey; label: string; align?: 'right'; bgClass?: string }[] = [
    { key: 'bookingNumber', label: 'Booking Number' },
    { key: 'clientName', label: 'Client' },
    { key: 'container', label: 'Container' },
    { key: 'typeSize', label: 'Type / Size' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'carrier', label: 'Carrier' },
    { key: 'placeOfLoading', label: 'Place of Loading' },
    { key: 'finalDestination', label: 'Final Destination' },
    { key: 'etd', label: 'ETD' },
    { key: 'eta', label: 'ETA' },
    { key: 'commodity', label: 'Commodity', bgClass: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  // Service-line columns (right, tinted green).
  const serviceCols: { key: ColumnKey; label: string; align?: 'right' }[] = [
    { key: 'serviceType', label: 'Service Type' },
    { key: 'plannedDate', label: 'Planned Date' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'rate', label: 'Rate', align: 'right' },
    { key: 'cost', label: 'Cost', align: 'right' },
    { key: 'currency', label: 'Currency' },
  ];

  const totalCols = mainCols.length + serviceCols.length;
  const totalRate = filteredRows.reduce((sum, row) => sum + (row.rate ?? 0), 0);
  const totalCost = filteredRows.reduce((sum, row) => sum + (row.cost ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl text-gray-900 dark:text-gray-100">Booking Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              One row per service — every container and service across all bookings
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadBookings}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Clear All Filters ({activeFiltersCount})
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by booking number, client, service, container, equipment, or commodity..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>

        {error && (
          <div className="mt-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error} — <button onClick={loadBookings} className="underline">Retry</button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                {mainCols.map(({ key, label, align, bgClass }) => (
                  <th
                    key={key}
                    style={{ width: `${columnWidths[key]}px`, minWidth: `${columnWidths[key]}px` }}
                    className={`px-2 py-1.5 text-${align || 'left'} text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 ${bgClass || ''} relative group`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{label}</span>
                      <FilterDropdown columnKey={key} label={label} />
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleMouseDown(e, key)}
                    />
                  </th>
                ))}
                {serviceCols.map(({ key, label, align }, idx) => (
                  <th
                    key={key}
                    style={{ width: `${columnWidths[key]}px`, minWidth: `${columnWidths[key]}px` }}
                    className={`px-2 py-1.5 text-${align || 'left'} text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider ${
                      idx === serviceCols.length - 1 ? '' : 'border-r border-gray-200 dark:border-gray-700'
                    } bg-green-50 dark:bg-green-900/20 relative group`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{label}</span>
                      <FilterDropdown columnKey={key} label={label} />
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleMouseDown(e, key)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={totalCols} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    {rows.length === 0 ? 'No bookings yet.' : 'No rows match your search.'}
                  </td>
                </tr>
              ) : filteredRows.map((row, idx) => (
                <tr key={`${row.bookingId}-${idx}`} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}>
                  {mainCols.map(({ key, align, bgClass }) => (
                    <td
                      key={key}
                      style={{ width: `${columnWidths[key]}px`, minWidth: `${columnWidths[key]}px` }}
                      className={`px-2 py-1.5 text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 ${
                        align === 'right' ? 'text-right tabular-nums' : ''
                      } ${bgClass ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      {key === 'bookingNumber' ? (
                        <button
                          onClick={() => handleBookingClick(row.bookingId)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {row.bookingNumber}
                        </button>
                      ) : (
                        cellText(row, key)
                      )}
                    </td>
                  ))}
                  {serviceCols.map(({ key, align }, sIdx) => (
                    <td
                      key={key}
                      style={{ width: `${columnWidths[key]}px`, minWidth: `${columnWidths[key]}px` }}
                      className={`px-2 py-1.5 text-gray-900 dark:text-gray-100 bg-green-50/50 dark:bg-green-900/10 ${
                        sIdx === serviceCols.length - 1 ? '' : 'border-r border-gray-200 dark:border-gray-700'
                      } ${align === 'right' ? 'text-right tabular-nums' : ''}`}
                    >
                      {cellText(row, key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              Showing {filteredRows.length} service {filteredRows.length === 1 ? 'row' : 'rows'}
              {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active)`}
            </div>
            <div className="flex gap-6">
              <div className="text-gray-900 dark:text-gray-100">
                <span className="text-gray-600 dark:text-gray-400">Total Rate:</span>{' '}
                <span className="font-semibold tabular-nums">{totalRate.toFixed(2)}</span>
              </div>
              <div className="text-gray-900 dark:text-gray-100">
                <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>{' '}
                <span className="font-semibold tabular-nums">{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
