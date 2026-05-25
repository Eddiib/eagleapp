import { useEffect, useMemo, useState } from 'react';
import { Search, X, RefreshCw } from 'lucide-react';
import { Port } from '../services/ports';
import { usePorts } from '../hooks/usePorts';
import { getCountryName } from '../data/countries';

// Single-select port picker modal — same UX as PartnerPicker, used by
// the POL/POD fields on the booking header where a long <select> is awkward
// once the port catalog grows.
interface PortPickerProps {
  open: boolean;
  title?: string;
  currentCode?: string;
  onClose: () => void;
  onSelect: (port: Port) => void;
}

const RENDER_CAP = 300;

export function PortPicker({ open, title = 'Select Port', currentCode, onClose, onSelect }: PortPickerProps) {
  const { ports, loading, error, refresh } = usePorts();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (open) {
      setSearch('');
      setDebouncedSearch('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return ports;
    return ports.filter((p) => {
      const fields = [p.code, p.name, p.country, getCountryName(p.country)];
      return fields.some((v) => (v || '').toString().toLowerCase().includes(q));
    });
  }, [ports, debouncedSearch]);

  const visible = filtered.slice(0, RENDER_CAP);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find by code, name or country…"
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Code</th>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    <RefreshCw className="inline w-4 h-4 animate-spin mr-2" /> Loading ports…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-red-700 dark:text-red-400">
                    <div>{error}</div>
                    <button
                      type="button"
                      onClick={refresh}
                      className="mt-3 inline-flex items-center gap-1.5 rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    {ports.length === 0 ? 'No ports yet.' : 'No ports match.'}
                  </td>
                </tr>
              ) : visible.map((p) => {
                const highlighted = p.code === currentCode;
                return (
                  <tr
                    key={p.code}
                    onClick={() => onSelect(p)}
                    onDoubleClick={() => onSelect(p)}
                    className={`cursor-pointer ${
                      highlighted
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <td className="px-3 py-2 text-blue-600 dark:text-blue-400 font-medium">{p.code}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {getCountryName(p.country) || p.country}
                      <span className="ml-2 text-xs text-gray-400">{p.country}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400">
          <div>
            {error
              ? 'Unable to load ports'
              : filtered.length === 0
              ? '0 ports'
              : `Showing ${visible.length} of ${filtered.length} port${filtered.length === 1 ? '' : 's'}`}
            {!error && filtered.length > RENDER_CAP && ' — refine the search to see more.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
