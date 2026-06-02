import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

export interface CatalogPickerItem {
  id: string;
  label: string;
  sublabel?: string;
}

// A lightweight searchable single-select modal — the same picker UX as
// PartnerPicker, but for plain catalog lists (service types, equipment, …).
interface CatalogPickerProps {
  open: boolean;
  title?: string;
  items: CatalogPickerItem[];
  currentId?: string;
  searchPlaceholder?: string;
  onClose: () => void;
  onSelect: (item: CatalogPickerItem) => void;
}

export function CatalogPicker({
  open,
  title = 'Select',
  items,
  currentId,
  searchPlaceholder = 'Search…',
  onClose,
  onSelect,
}: CatalogPickerProps) {
  const [search, setSearch] = useState('');

  useEffect(() => { if (open) setSearch(''); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || (i.sublabel || '').toLowerCase().includes(q),
    );
  }, [items, search]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg h-[70vh] flex flex-col"
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
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">No matches.</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`w-full text-left px-5 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      item.id === currentId ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <div className="text-gray-900 dark:text-gray-100">{item.label}</div>
                    {item.sublabel && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.sublabel}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400">
          <div>{filtered.length} item{filtered.length === 1 ? '' : 's'}</div>
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
