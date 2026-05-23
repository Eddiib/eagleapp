import { useEffect, useMemo, useState } from 'react';
import { Search, X, RefreshCw } from 'lucide-react';
import { Partner } from '../types/partner';
import { usePartners } from '../hooks/usePartners';
import { getCountryName } from '../data/countries';

// A searchable partner table that pops up as a modal — used wherever a single
// partner has to be picked out of the full list (e.g. Consignee on a booking).
// The dropdown <select> doesn't scale once there are hundreds of partners.
interface PartnerPickerProps {
  open: boolean;
  title?: string;
  /** Highlight the currently-selected partner row, if any. */
  currentId?: string;
  /** Optional restriction (e.g. only Active partners). Defaults to all. */
  filter?: (partner: Partner) => boolean;
  onClose: () => void;
  onSelect: (partner: Partner) => void;
}

function primaryContact(p: Partner) {
  return p.contacts.find((c) => c.isPrimary) || p.contacts[0];
}

// Cap the rendered rows so very loose searches don't drop a 1300-row DOM at
// once. The footer tells the user to refine further if anything is hidden.
const RENDER_CAP = 300;

export function PartnerPicker({
  open,
  title = 'Select Partner',
  currentId,
  filter,
  onClose,
  onSelect,
}: PartnerPickerProps) {
  const { partners, loading } = usePartners();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Reset search every time the picker opens so a stale query doesn't carry over.
  useEffect(() => {
    if (open) {
      setSearch('');
      setDebouncedSearch('');
    }
  }, [open]);

  // Debounce so typing doesn't filter 1300 rows on every keystroke.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search, open]);

  // Escape closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    let list = partners;
    if (filter) list = list.filter(filter);
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const phone = primaryContact(p)?.phone || '';
        const fields = [
          p.partnerCode,
          p.tradingName,
          p.companyLegalName,
          p.taxNumber,
          p.businessNumber,
          p.address,
          p.city,
          getCountryName(p.country),
          phone,
        ];
        return fields.some((v) => (v || '').toString().toLowerCase().includes(q));
      });
    }
    // Sort by numeric part of partner code so 1000, 1001, 1002 appear in
    // order; falls back to lexical for codes like "PTR12345".
    return [...list].sort((a, b) => {
      const an = Number(String(a.partnerCode).replace(/\D/g, '')) || 0;
      const bn = Number(String(b.partnerCode).replace(/\D/g, '')) || 0;
      return an - bn || String(a.partnerCode).localeCompare(String(b.partnerCode));
    });
  }, [partners, filter, debouncedSearch]);

  const visible = filtered.slice(0, RENDER_CAP);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col"
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
              placeholder="Find by code, name, tax number, address, city, phone…"
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
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Trading Name</th>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Legal Name</th>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Tax Number</th>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Address</th>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">City</th>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Country</th>
                <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    <RefreshCw className="inline w-4 h-4 animate-spin mr-2" /> Loading partners…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    {partners.length === 0 ? 'No partners.' : 'No partners match.'}
                  </td>
                </tr>
              ) : visible.map((p) => {
                const c = primaryContact(p);
                const selected = p.id === currentId;
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelect(p)}
                    onDoubleClick={() => onSelect(p)}
                    className={`cursor-pointer ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <td className="px-3 py-2 text-blue-600 dark:text-blue-400 font-medium">{p.partnerCode}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.tradingName || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.companyLegalName || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.taxNumber || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.address || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.city || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{getCountryName(p.country) || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{c?.phone || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400">
          <div>
            {filtered.length === 0
              ? '0 partners'
              : `Showing ${visible.length} of ${filtered.length} partner${filtered.length === 1 ? '' : 's'}`}
            {filtered.length > RENDER_CAP && ' — refine the search to see more.'}
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
