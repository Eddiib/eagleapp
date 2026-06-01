import { useMemo, useState } from 'react';
import { Search, Filter, Eye, Edit2, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import { Service } from '../types/service';
import { ColumnHeader } from './ui/ColumnHeader';
import { useTableControls, ColumnDef } from '../hooks/useTableControls';

interface ServicesTableProps {
  services: Service[];
  serviceGroups: { id: string; groupName: string }[];
  onView: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDuplicate: (service: Service) => void;
  onToggleActive: (service: Service) => void;
}

export function ServicesTable({
  services,
  serviceGroups,
  onView,
  onEdit,
  onDuplicate,
  onToggleActive,
}: ServicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const groupNameById = useMemo(
    () => new Map(serviceGroups.map((g) => [g.id, g.groupName])),
    [serviceGroups],
  );

  // Column descriptors drive the header sort/filter dropdowns and the filtering logic.
  // Each `get` returns the same display string shown in the corresponding table cell.
  const columnDefs = useMemo<ColumnDef<Service>[]>(() => ([
    { key: 'serviceCode', label: 'Code', align: 'left', get: (s) => s.serviceCode },
    { key: 'serviceName', label: 'Name', align: 'left', get: (s) => s.serviceName },
    { key: 'group', label: 'Group', align: 'left', get: (s) => (s.serviceGroupId ? groupNameById.get(s.serviceGroupId) || '—' : '—') },
    { key: 'category', label: 'Category', align: 'left', get: (s) => s.category },
    { key: 'modes', label: 'Modes', align: 'left', get: (s) => s.transportModes.join(', ') },
    { key: 'chargeUnit', label: 'Charge Unit', align: 'left', get: (s) => s.chargeUnit },
    { key: 'status', label: 'Status', align: 'left', get: (s) => (s.isActive ? 'Active' : 'Inactive') },
  ]), [groupNameById]);

  const searchFiltered = services.filter((service) =>
    service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.serviceCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Column-level Excel-style filters + AZ/ZA sorting (shared across all list tables).
  const {
    processed: filteredServices,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sortDirFor,
    toggleSort,
  } = useTableControls(searchFiltered, columnDefs);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
        {activeColumnFilterCount > 0 && (
          <button
            onClick={clearAllColumnFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Clear all column filters"
          >
            <Filter className="h-4 w-4" />
            Clear filters ({activeColumnFilterCount})
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columnDefs.map((def) => (
                <th key={def.key} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
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
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {services.length === 0 ? 'No services yet. Click “New Service” to add one.' : 'No services match your search.'}
                </td>
              </tr>
            )}
            {filteredServices.map((s, index) => (
              <tr
                key={s.id}
                onClick={() => onView(s)}
                className={`cursor-pointer border-b border-gray-200 dark:border-gray-700 ${
                  index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                } hover:bg-gray-50 dark:hover:bg-gray-700`}
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-300">{s.serviceCode}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{s.serviceName}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-400">
                  {s.serviceGroupId ? groupNameById.get(s.serviceGroupId) || '—' : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-400">{s.category}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.transportModes.map((m) => (
                      <span
                        key={m}
                        className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-400">{s.chargeUnit}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                    s.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onView(s)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(s)}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDuplicate(s)}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleActive(s)}
                      className={s.isActive
                        ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}
                      title={s.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {s.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
