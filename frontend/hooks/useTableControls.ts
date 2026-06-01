import { useMemo, useState } from 'react';
import type { SortDir } from '../components/ui/ColumnHeader';

export interface ColumnDef<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  /** Display string for this column — used for both filtering and (by default) sorting. */
  get: (row: T) => string;
  /** Optional sort key when the display string isn't the right thing to sort on (numbers, dates). */
  sortValue?: (row: T) => string | number;
  /** Set false to hide the value-filter checkboxes for this column. Default true. */
  filterable?: boolean;
  /** Set false to hide the A→Z / Z→A buttons for this column. Default true. */
  sortable?: boolean;
}

interface SortState {
  key: string;
  dir: SortDir;
}

/**
 * Shared filter + AZ/ZA sort engine for list tables.
 *
 * Pass the already-search-filtered rows and the column descriptors; get back the
 * processed rows plus everything the <ColumnHeader> dropdowns need. Column filters
 * are Excel-style (per-value checkboxes); sorting is single-column A→Z / Z→A.
 */
export function useTableControls<T>(rows: T[], columns: ColumnDef<T>[]) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<SortState | null>(null);

  // Distinct values per column, computed from the full dataset so options stay stable.
  const columnValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const def of columns) {
      if (def.filterable === false) continue;
      const set = new Set<string>();
      for (const row of rows) set.add(def.get(row));
      map[def.key] = Array.from(set).sort((a, z) =>
        a.localeCompare(z, undefined, { numeric: true, sensitivity: 'base' }),
      );
    }
    return map;
  }, [rows, columns]);

  const setColumnFilter = (key: string, next: string[] | undefined) => {
    setColumnFilters((prev) => {
      const copy = { ...prev };
      if (next === undefined) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  };

  const clearAllColumnFilters = () => setColumnFilters({});
  const activeColumnFilterCount = Object.keys(columnFilters).length;

  const toggleSort = (key: string, dir: SortDir | null) => {
    setSort(dir === null ? null : { key, dir });
  };

  const processed = useMemo(() => {
    let out = rows.filter((row) =>
      columns.every((def) => {
        const allowed = columnFilters[def.key];
        return !allowed || allowed.includes(def.get(row));
      }),
    );

    if (sort) {
      const def = columns.find((c) => c.key === sort.key);
      if (def) {
        const valueOf = def.sortValue ?? def.get;
        out = [...out].sort((a, b) => {
          const av = valueOf(a);
          const bv = valueOf(b);
          let cmp: number;
          if (typeof av === 'number' && typeof bv === 'number') {
            cmp = av - bv;
          } else {
            cmp = String(av).localeCompare(String(bv), undefined, {
              numeric: true,
              sensitivity: 'base',
            });
          }
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }

    return out;
  }, [rows, columns, columnFilters, sort]);

  const sortDirFor = (key: string): SortDir | null => (sort?.key === key ? sort.dir : null);

  return {
    processed,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sort,
    toggleSort,
    sortDirFor,
  };
}
