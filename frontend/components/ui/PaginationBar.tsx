import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  label?: string;
}

const DEFAULT_OPTIONS = [25, 50, 100];

export function PaginationBar({
  page, pageSize, total, onPageChange, onPageSizeChange,
  pageSizeOptions = DEFAULT_OPTIONS, label = 'rows',
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end   = Math.min(safePage * pageSize, total);

  const go = (p: number) => onPageChange(Math.min(Math.max(1, p), totalPages));

  const btn = 'p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
      <div>
        {total === 0 ? `No ${label}` : `Showing ${start}–${end} of ${total} ${label}`}
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <>
            <label className="text-xs">Rows per page:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </>
        )}
        <div className="flex items-center gap-1">
          <button onClick={() => go(1)}            disabled={safePage <= 1}          className={btn} aria-label="First page"><ChevronsLeft  className="w-3.5 h-3.5" /></button>
          <button onClick={() => go(safePage - 1)} disabled={safePage <= 1}          className={btn} aria-label="Previous page"><ChevronLeft   className="w-3.5 h-3.5" /></button>
          <span className="px-2 text-xs whitespace-nowrap">Page {safePage} of {totalPages}</span>
          <button onClick={() => go(safePage + 1)} disabled={safePage >= totalPages} className={btn} aria-label="Next page"><ChevronRight  className="w-3.5 h-3.5" /></button>
          <button onClick={() => go(totalPages)}   disabled={safePage >= totalPages} className={btn} aria-label="Last page"><ChevronsRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
