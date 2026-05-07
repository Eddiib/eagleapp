import { useState, useEffect } from 'react';
import { Download, Filter, Search, X, RefreshCw } from 'lucide-react';
import { bookingsApi, Booking } from '../services/bookings';

interface BookingDetailRow {
  bookingId: string;
  bookingNumber: string;
  clientName: string;
  carrierName: string;
  placeOfLoading: string;
  finalDestination: string;
  etd: string;
  eta: string;
  equipmentSummary: string;
  commodity: string;

  serviceCode: string;
  serviceName: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  notes: string;
}

type ColumnKey =
  | 'bookingNumber' | 'clientName' | 'carrierName' | 'placeOfLoading' | 'finalDestination'
  | 'etd' | 'eta' | 'equipmentSummary' | 'commodity'
  | 'serviceCode' | 'serviceName' | 'supplierName'
  | 'quantity' | 'unitPrice' | 'totalPrice' | 'currency' | 'notes';

interface BookingDetailsProps {
  onNavigateToBooking?: (bookingId: string) => void;
}

function summarizeEquipment(b: Booking): string {
  if (!b.equipment.length) return '—';
  return b.equipment
    .map(e => `${e.quantity}×${e.equipmentCode || e.equipmentName || '?'}`)
    .join('; ');
}

function buildRows(bookings: Booking[]): BookingDetailRow[] {
  const rows: BookingDetailRow[] = [];
  for (const b of bookings) {
    const base = {
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      clientName: b.clientName || '',
      carrierName: b.carrierName || '',
      placeOfLoading: b.origin || '',
      finalDestination: b.destination || '',
      etd: b.estimatedDeparture || '',
      eta: b.estimatedArrival || '',
      equipmentSummary: summarizeEquipment(b),
      commodity: b.commodity || '',
    };
    if (b.services.length === 0) {
      rows.push({
        ...base,
        serviceCode: '',
        serviceName: '',
        supplierName: '',
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        currency: b.currency || '',
        notes: '',
      });
    } else {
      for (const s of b.services) {
        rows.push({
          ...base,
          serviceCode: s.serviceCode || '',
          serviceName: s.serviceName || '',
          supplierName: s.supplierName || '',
          quantity: s.quantity,
          unitPrice: s.unitPrice,
          totalPrice: s.totalPrice,
          currency: s.currency,
          notes: s.notes || '',
        });
      }
    }
  }
  return rows;
}

export function BookingDetails({ onNavigateToBooking }: BookingDetailsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Partial<Record<ColumnKey, string>>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<ColumnKey | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>({
    bookingNumber: 140,
    clientName: 180,
    carrierName: 160,
    placeOfLoading: 180,
    finalDestination: 180,
    etd: 110,
    eta: 110,
    equipmentSummary: 160,
    commodity: 140,
    serviceCode: 120,
    serviceName: 200,
    supplierName: 180,
    quantity: 80,
    unitPrice: 110,
    totalPrice: 110,
    currency: 90,
    notes: 160,
  });
  const [resizing, setResizing] = useState<ColumnKey | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await bookingsApi.getAll();
      const detailed = await Promise.all(list.map(b => bookingsApi.getById(b.id)));
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
      row.serviceName.toLowerCase().includes(needle) ||
      row.commodity.toLowerCase().includes(needle);
    const matchesColumnFilters = Object.entries(columnFilters).every(([key, value]) => {
      if (!value) return true;
      const cellValue = String(row[key as ColumnKey]).toLowerCase();
      return cellValue.includes(String(value).toLowerCase());
    });
    return matchesSearch && matchesColumnFilters;
  });

  const getUniqueValues = (key: ColumnKey) => {
    const values = rows.map(row => String(row[key]));
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

  const bookingCols: { key: ColumnKey; label: string; align?: 'right'; bgClass?: string }[] = [
    { key: 'bookingNumber', label: 'Booking Number' },
    { key: 'clientName', label: 'Client' },
    { key: 'carrierName', label: 'Carrier' },
    { key: 'placeOfLoading', label: 'Place of Loading' },
    { key: 'finalDestination', label: 'Final Destination' },
    { key: 'etd', label: 'ETD' },
    { key: 'eta', label: 'ETA' },
    { key: 'equipmentSummary', label: 'Equipment' },
    { key: 'commodity', label: 'Commodity', bgClass: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  const serviceCols: { key: ColumnKey; label: string; align?: 'right' }[] = [
    { key: 'serviceCode', label: 'Service Code' },
    { key: 'serviceName', label: 'Service' },
    { key: 'supplierName', label: 'Supplier' },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'unitPrice', label: 'Unit Price', align: 'right' },
    { key: 'totalPrice', label: 'Total', align: 'right' },
    { key: 'currency', label: 'Currency' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl text-gray-900 dark:text-gray-100">Booking Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Detailed breakdown of all services per booking and equipment
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
            placeholder="Search by booking number, client, service, or commodity..."
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
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                {bookingCols.map(({ key, label, align, bgClass }) => (
                  <th
                    key={key}
                    style={{ width: `${columnWidths[key]}px`, minWidth: `${columnWidths[key]}px` }}
                    className={`px-3 py-3 text-${align || 'left'} text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 ${bgClass || ''} relative group`}
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
                    className={`px-3 py-3 text-${align || 'left'} text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider ${
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
                  <td colSpan={bookingCols.length + serviceCols.length} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={bookingCols.length + serviceCols.length} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    {rows.length === 0 ? 'No bookings yet.' : 'No rows match your search.'}
                  </td>
                </tr>
              ) : filteredRows.map((row, idx) => (
                <tr key={`${row.bookingNumber}-${idx}`} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}>
                  <td
                    style={{ width: `${columnWidths.bookingNumber}px`, minWidth: `${columnWidths.bookingNumber}px` }}
                    className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-700"
                  >
                    <button
                      onClick={() => handleBookingClick(row.bookingId)}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {row.bookingNumber}
                    </button>
                  </td>
                  <td style={{ width: columnWidths.clientName }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">{row.clientName || '—'}</td>
                  <td style={{ width: columnWidths.carrierName }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">{row.carrierName || '—'}</td>
                  <td style={{ width: columnWidths.placeOfLoading }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">{row.placeOfLoading || '—'}</td>
                  <td style={{ width: columnWidths.finalDestination }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">{row.finalDestination || '—'}</td>
                  <td style={{ width: columnWidths.etd }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">{row.etd || '—'}</td>
                  <td style={{ width: columnWidths.eta }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">{row.eta || '—'}</td>
                  <td style={{ width: columnWidths.equipmentSummary }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">{row.equipmentSummary}</td>
                  <td style={{ width: columnWidths.commodity }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">{row.commodity || '—'}</td>

                  <td style={{ width: columnWidths.serviceCode }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">{row.serviceCode || '—'}</td>
                  <td style={{ width: columnWidths.serviceName }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">{row.serviceName || '—'}</td>
                  <td style={{ width: columnWidths.supplierName }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">{row.supplierName || '—'}</td>
                  <td style={{ width: columnWidths.quantity }} className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10 tabular-nums">{row.quantity}</td>
                  <td style={{ width: columnWidths.unitPrice }} className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10 tabular-nums">{row.unitPrice.toFixed(2)}</td>
                  <td style={{ width: columnWidths.totalPrice }} className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10 tabular-nums">{row.totalPrice.toFixed(2)}</td>
                  <td style={{ width: columnWidths.currency }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">{row.currency}</td>
                  <td style={{ width: columnWidths.notes }} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-green-50/50 dark:bg-green-900/10">{row.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              Showing {filteredRows.length} service {filteredRows.length === 1 ? 'entry' : 'entries'}
              {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active)`}
            </div>
            <div className="flex gap-6">
              <div className="text-gray-900 dark:text-gray-100">
                <span className="text-gray-600 dark:text-gray-400">Total:</span>{' '}
                <span className="font-semibold tabular-nums">
                  {filteredRows.reduce((sum, row) => sum + row.totalPrice, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
