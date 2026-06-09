import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle, TrendingDown, Clock, CheckCircle, Filter } from 'lucide-react';
import { CostEntry, CostEntryStatus, costControlApi } from '../services/costControl';
import { ColumnHeader } from './ui/ColumnHeader';
import { useTableControls, ColumnDef } from '../hooks/useTableControls';

const STATUS_COLORS: Record<CostEntryStatus, string> = {
  Pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Paid:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Disputed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export function Payables() {
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    costControlApi.getAll()
      .then((all) => setEntries(all.filter((e) => e.status !== 'Paid')))
      .catch((err) => setError(err.message || 'Failed to load payables'))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const pending  = entries.filter((e) => e.status === 'Pending');
  const approved = entries.filter((e) => e.status === 'Approved');
  const overdue  = entries.filter((e) => e.dueDate && e.dueDate < today && e.status !== 'Paid');
  const disputed = entries.filter((e) => e.status === 'Disputed');

  const totalPending  = pending.reduce((s, e) => s + e.amount, 0);
  const totalApproved = approved.reduce((s, e) => s + e.amount, 0);
  const totalOverdue  = overdue.reduce((s, e) => s + e.amount, 0);

  // Column descriptors drive the header sort/filter dropdowns; each `get` mirrors the cell text.
  const columnDefs = useMemo<ColumnDef<CostEntry>[]>(() => ([
    { key: 'bookingNumber', label: 'Booking', align: 'left', get: (e) => e.bookingNumber || '—' },
    { key: 'serviceName', label: 'Service', align: 'left', get: (e) => e.serviceName || '—' },
    { key: 'supplierName', label: 'Supplier', align: 'left', get: (e) => e.supplierName || '—' },
    { key: 'invoiceNumber', label: 'Invoice #', align: 'left', get: (e) => e.invoiceNumber || 'Missing' },
    { key: 'invoiceDate', label: 'Invoice Date', align: 'left', get: (e) => e.invoiceDate || '—', sortValue: (e) => e.invoiceDate || '' },
    { key: 'dueDate', label: 'Due Date', align: 'left', get: (e) => e.dueDate || '—', sortValue: (e) => e.dueDate || '' },
    { key: 'amount', label: 'Amount', align: 'right', get: (e) => `${e.currency} ${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sortValue: (e) => e.amount },
    { key: 'status', label: 'Status', align: 'left', get: (e) => e.status || '—' },
  ]), []);

  // Column-level Excel-style filters + AZ/ZA sorting (shared across all list tables).
  const {
    processed,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sortDirFor,
    toggleSort,
  } = useTableControls(entries, columnDefs);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading payables…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Payables</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Outstanding supplier cost entries</p>
        </div>
        {activeColumnFilterCount > 0 && (
          <button
            onClick={clearAllColumnFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            title="Clear all column filters"
          >
            <Filter className="w-4 h-4" />
            Clear filters ({activeColumnFilterCount})
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Pending</div>
              <div className="text-2xl text-yellow-600 dark:text-yellow-400">
                ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">{pending.length} entr{pending.length !== 1 ? 'ies' : 'y'}</div>
            </div>
            <Clock className="w-8 h-8 text-yellow-400 dark:text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Approved</div>
              <div className="text-2xl text-blue-600 dark:text-blue-400">
                ${totalApproved.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">{approved.length} entr{approved.length !== 1 ? 'ies' : 'y'}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-400 dark:text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Overdue</div>
              <div className="text-2xl text-red-600 dark:text-red-400">
                ${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">{overdue.length} entr{overdue.length !== 1 ? 'ies' : 'y'}</div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400 dark:text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Disputed</div>
              <div className="text-2xl text-gray-700 dark:text-gray-300">
                {disputed.length}
              </div>
              <div className="text-xs text-gray-400 mt-1">entr{disputed.length !== 1 ? 'ies' : 'y'}</div>
            </div>
            <TrendingDown className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-16 text-center">
          <TrendingDown className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No outstanding payables. All supplier invoices are paid.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {columnDefs.map((def) => (
                  <th key={def.key} className={`px-2 py-1.5 ${def.align === 'right' ? 'text-right' : 'text-left'} text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {processed.map((e) => {
                const isOverdue = e.dueDate && e.dueDate < today && e.status !== 'Paid';
                return (
                  <tr key={e.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300">{e.bookingNumber || <span className="text-gray-400">—</span>}</td>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300">{e.serviceName || <span className="text-gray-400">—</span>}</td>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300">{e.supplierName || <span className="text-gray-400">—</span>}</td>
                    <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400">{e.invoiceNumber || <span className="text-gray-300 dark:text-gray-600">Missing</span>}</td>
                    <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400">{e.invoiceDate || '—'}</td>
                    <td className={`px-2 py-1.5 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {e.dueDate || '—'}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-900 dark:text-gray-100">
                      {e.currency} {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${STATUS_COLORS[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
