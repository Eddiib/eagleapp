import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, ChevronRight, ChevronDown, FilterX } from 'lucide-react';
import { auditLogApi, AuditEntry, AuditAction } from '../services/auditLog';
import { ColumnHeader } from './ui/ColumnHeader';
import { useTableControls, ColumnDef } from '../hooks/useTableControls';

const AUDITED_TABLES = ['bookings', 'invoices', 'cost_control', 'partners'];
const ACTIONS: AuditAction[] = ['INSERT', 'UPDATE', 'DELETE'];

interface DiffField {
  key: string;
  before: unknown;
  after: unknown;
}

function diffRows(before: Record<string, unknown> | null, after: Record<string, unknown> | null): DiffField[] {
  const keys = new Set<string>([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changed: DiffField[] = [];
  for (const key of keys) {
    const b = before?.[key] ?? null;
    const a = after?.[key]  ?? null;
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changed.push({ key, before: b, after: a });
    }
  }
  changed.sort((x, y) => x.key.localeCompare(y.key));
  return changed;
}

function formatValue(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function actionBadge(action: AuditAction) {
  const colorClass =
    action === 'INSERT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
    action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  return <span className={`inline-block text-xs uppercase tracking-wide px-1.5 py-0.5 rounded ${colorClass}`}>{action}</span>;
}

function tableLabel(t: string): string {
  return ({ bookings: 'Booking', invoices: 'Invoice', cost_control: 'Cost entry', partners: 'Partner' } as Record<string, string>)[t] || t;
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [table, setTable] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [rowId, setRowId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState(100);

  const load = () => {
    setLoading(true);
    setError(null);
    auditLogApi.list({
      table: table || undefined,
      action: (action as AuditAction) || undefined,
      row_id: rowId.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
      limit,
    })
      .then(setEntries)
      .catch(err => setError(err?.message || 'Failed to load audit log'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // initial load

  // Column descriptors for the Excel-style header sort/filter dropdowns.
  // Each `get` returns the same display string shown in the row.
  const columnDefs = useMemo<ColumnDef<AuditEntry>[]>(() => ([
    { key: 'action', label: 'Action', align: 'left', get: (e) => e.action },
    { key: 'table_name', label: 'Table', align: 'left', get: (e) => tableLabel(e.table_name) },
    { key: 'row_id', label: 'Row ID', align: 'left', get: (e) => e.row_id },
    { key: 'actor_name', label: 'User', align: 'left', get: (e) => e.actor_name || 'system' },
    { key: 'changed_at', label: 'When', align: 'right', get: (e) => new Date(e.changed_at).toLocaleString(), sortValue: (e) => e.changed_at || '' },
  ]), []);

  // Column-level Excel-style filters + AZ/ZA sorting (shared across all list tables).
  const {
    processed: visibleEntries,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sortDirFor,
    toggleSort,
  } = useTableControls(entries, columnDefs);

  const clearFilters = () => {
    setTable(''); setAction(''); setRowId(''); setFrom(''); setTo(''); setLimit(100);
  };

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const inputClass  = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-gray-100">Audit Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Row-level history for bookings, invoices and cost-control entries. Captures who changed what and when, with before/after snapshots.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Table</label>
            <select value={table} onChange={e => setTable(e.target.value)} className={inputClass + ' w-full'}>
              <option value="">Any</option>
              {AUDITED_TABLES.map(t => <option key={t} value={t}>{tableLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Action</label>
            <select value={action} onChange={e => setAction(e.target.value)} className={inputClass + ' w-full'}>
              <option value="">Any</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Row ID</label>
            <input value={rowId} onChange={e => setRowId(e.target.value)} placeholder="UUID" className={inputClass + ' w-full'} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputClass + ' w-full'} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputClass + ' w-full'} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Limit</label>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))} className={inputClass + ' w-full'}>
              {[50, 100, 250, 500].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={load} disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
            {loading ? 'Loading…' : 'Apply filters'}
          </button>
          <button onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
            <FilterX className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading audit entries…
          </div>
        ) : error ? (
          <div className="py-12 flex items-center justify-center text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No audit entries match these filters.
          </div>
        ) : (
          <>
            {activeColumnFilterCount > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-end">
                <button
                  onClick={clearAllColumnFilters}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="Clear all column filters"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  Clear filters ({activeColumnFilterCount})
                </button>
              </div>
            )}
            {/* Column header row mirrors the per-row layout below for sort/filter controls. */}
            <div className="flex items-center gap-3 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="w-4 flex-shrink-0" />
              <div className="flex-shrink-0 w-20">
                <ColumnHeader
                  label="Action" align="left"
                  values={columnValues['action'] || []}
                  selected={columnFilters['action']}
                  onFilterChange={(next) => setColumnFilter('action', next)}
                  sortDir={sortDirFor('action')}
                  onSortChange={(dir) => toggleSort('action', dir)}
                />
              </div>
              <div className="w-28">
                <ColumnHeader
                  label="Table" align="left"
                  values={columnValues['table_name'] || []}
                  selected={columnFilters['table_name']}
                  onFilterChange={(next) => setColumnFilter('table_name', next)}
                  sortDir={sortDirFor('table_name')}
                  onSortChange={(dir) => toggleSort('table_name', dir)}
                />
              </div>
              <div className="flex-1">
                <ColumnHeader
                  label="Row ID" align="left"
                  values={columnValues['row_id'] || []}
                  selected={columnFilters['row_id']}
                  onFilterChange={(next) => setColumnFilter('row_id', next)}
                  sortDir={sortDirFor('row_id')}
                  onSortChange={(dir) => toggleSort('row_id', dir)}
                />
              </div>
              <div className="w-48">
                <ColumnHeader
                  label="User" align="left"
                  values={columnValues['actor_name'] || []}
                  selected={columnFilters['actor_name']}
                  onFilterChange={(next) => setColumnFilter('actor_name', next)}
                  sortDir={sortDirFor('actor_name')}
                  onSortChange={(dir) => toggleSort('actor_name', dir)}
                />
              </div>
              <div className="w-40">
                <ColumnHeader
                  label="When" align="right"
                  values={columnValues['changed_at'] || []}
                  selected={columnFilters['changed_at']}
                  onFilterChange={(next) => setColumnFilter('changed_at', next)}
                  sortDir={sortDirFor('changed_at')}
                  onSortChange={(dir) => toggleSort('changed_at', dir)}
                />
              </div>
            </div>
            {visibleEntries.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                No audit entries match these column filters.
              </div>
            ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {visibleEntries.map(e => {
              const isOpen = expanded.has(e.id);
              const diff = e.action === 'UPDATE' ? diffRows(e.before_data, e.after_data) : [];
              return (
                <li key={e.id} className="text-xs">
                  <button onClick={() => toggle(e.id)}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    <div className="flex-shrink-0 w-20">{actionBadge(e.action)}</div>
                    <div className="w-28 text-gray-700 dark:text-gray-300">{tableLabel(e.table_name)}</div>
                    <div className="flex-1 font-mono text-xs text-gray-500 dark:text-gray-400 truncate">{e.row_id}</div>
                    <div className="w-48 text-gray-700 dark:text-gray-300 truncate">{e.actor_name || <span className="text-gray-400">system</span>}</div>
                    <div className="w-40 text-gray-500 dark:text-gray-400 text-xs text-right tabular-nums">
                      {new Date(e.changed_at).toLocaleString()}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-12 pb-4 pt-1 text-xs">
                      {e.action === 'UPDATE' ? (
                        diff.length === 0 ? (
                          <div className="text-gray-500 italic">No tracked field differences.</div>
                        ) : (
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-gray-500 dark:text-gray-400">
                                <th className="px-2 py-1 w-48">Field</th>
                                <th className="px-2 py-1">Before</th>
                                <th className="px-2 py-1">After</th>
                              </tr>
                            </thead>
                            <tbody>
                              {diff.map(d => (
                                <tr key={d.key} className="border-t border-gray-100 dark:border-gray-700">
                                  <td className="px-2 py-1 font-mono text-gray-700 dark:text-gray-300">{d.key}</td>
                                  <td className="px-2 py-1 text-red-600 dark:text-red-400 break-all">{formatValue(d.before)}</td>
                                  <td className="px-2 py-1 text-emerald-600 dark:text-emerald-400 break-all">{formatValue(d.after)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      ) : (
                        <pre className="bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto text-gray-700 dark:text-gray-300">
{JSON.stringify(e.action === 'INSERT' ? e.after_data : e.before_data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
