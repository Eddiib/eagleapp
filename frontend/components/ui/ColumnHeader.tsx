import { useEffect, useRef, useState } from 'react';
import { Search, ListFilter, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

interface ColumnHeaderProps {
  label: string;
  align?: 'left' | 'right' | 'center';
  /** All distinct values for this column (used for the filter checkboxes). */
  values: string[];
  /** Selected filter values. undefined = no filter (all shown). */
  selected: string[] | undefined;
  onFilterChange: (next: string[] | undefined) => void;
  /** Current sort direction for THIS column, or null if not the active sort column. */
  sortDir: SortDir | null;
  /** Toggle sort. Pass null to clear sorting. */
  onSortChange: (dir: SortDir | null) => void;
  /** Hide the value filter section (e.g. for free-form columns). */
  filterable?: boolean;
  /** Hide the sort buttons. */
  sortable?: boolean;
}

/**
 * Excel-style column header: a label plus a dropdown offering A→Z / Z→A sorting
 * and per-value checkbox filtering. Shared across all list tables via useTableControls.
 */
export function ColumnHeader({
  label,
  align = 'left',
  values,
  selected,
  onFilterChange,
  sortDir,
  onSortChange,
  filterable = true,
  sortable = true,
}: ColumnHeaderProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filterActive = filterable && selected !== undefined && selected.length < values.length;
  const active = filterActive || sortDir !== null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isChecked = (v: string) => selected === undefined || selected.includes(v);

  const toggle = (v: string) => {
    const base = selected === undefined ? [...values] : [...selected];
    const next = base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
    onFilterChange(next.length === values.length ? undefined : next);
  };

  const visible = values.filter((v) => v.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative inline-block">
      <div
        className={`flex items-center gap-1 ${
          align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''
        }`}
      >
        <span>{label}</span>
        {sortDir === 'asc' && <ArrowDownAZ className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
        {sortDir === 'desc' && <ArrowUpAZ className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`p-0.5 rounded transition-colors ${
            active
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title={active ? 'Sort / filter active — click to edit' : 'Sort / filter'}
        >
          <ListFilter className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div
          className={`absolute z-30 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {sortable && (
            <div className="py-1 border-b border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => onSortChange(sortDir === 'asc' ? null : 'asc')}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm normal-case font-normal tracking-normal hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  sortDir === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <ArrowDownAZ className="w-4 h-4" />
                Sort A → Z
              </button>
              <button
                type="button"
                onClick={() => onSortChange(sortDir === 'desc' ? null : 'desc')}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm normal-case font-normal tracking-normal hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  sortDir === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                <ArrowUpAZ className="w-4 h-4" />
                Sort Z → A
              </button>
            </div>
          )}
          {filterable && (
            <>
              <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search values..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 normal-case font-normal tracking-normal"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-2 py-1 text-xs border-b border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => onFilterChange(undefined)}
                  className="text-blue-600 dark:text-blue-400 hover:underline normal-case font-normal tracking-normal"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange([])}
                  className="text-gray-500 dark:text-gray-400 hover:underline normal-case font-normal tracking-normal"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {visible.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400 normal-case font-normal tracking-normal">
                    No values
                  </div>
                ) : (
                  visible.map((v) => (
                    <label
                      key={v}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer normal-case font-normal tracking-normal text-gray-700 dark:text-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked(v)}
                        onChange={() => toggle(v)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">{v || '—'}</span>
                    </label>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
