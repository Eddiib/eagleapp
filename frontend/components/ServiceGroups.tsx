import { useEffect, useMemo, useState } from 'react';
import { Eye, Edit2, Trash2, X, Search, Filter } from 'lucide-react';
import { ServiceGroup, TransportMode, WhereUsed } from '../types/service';
import { useConfirm } from '../context/ConfirmDialog';
import { ColumnHeader } from './ui/ColumnHeader';
import { useTableControls, ColumnDef } from '../hooks/useTableControls';

interface ServiceGroupsProps {
  groups: ServiceGroup[];
  loading?: boolean;
  error?: string | null;
  createSignal?: number;
  currentUsername?: string;
  onCreate: (group: Partial<ServiceGroup>) => Promise<void>;
  onUpdate: (id: string, group: Partial<ServiceGroup>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const WHERE_USED_OPTIONS: WhereUsed[] = [
  'Booking',
  'Leg',
  'Container',
  'Port / Terminal',
  'Customs / Border',
  'Warehouse / Handling',
  'Documentation',
  'Finance / Invoicing',
  'Any',
];

const MODE_OPTIONS: TransportMode[] = ['Road', 'Sea', 'Rail', 'Barge', 'Air', 'Parcel', 'Multimodal', 'Any'];

const GROUP_CODE_REGEX = /^[A-Z0-9_-]{1,20}$/;

function buildEmptyGroup(currentUsername?: string): ServiceGroup {
  return {
    id: '',
    groupCode: '',
    groupName: '',
    description: '',
    defaultWhereUsed: [],
    defaultModes: [],
    isActive: true,
    createdBy: currentUsername || '',
    createdDate: new Date().toISOString().split('T')[0],
  };
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function ServiceGroups({
  groups,
  loading = false,
  error,
  createSignal = 0,
  currentUsername,
  onCreate,
  onUpdate,
  onDelete,
}: ServiceGroupsProps) {
  const confirmDialog = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ServiceGroup | null>(null);
  const [originalGroup, setOriginalGroup] = useState<ServiceGroup | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  // Column descriptors drive the header sort/filter dropdowns and the filtering logic.
  // Each `get` returns the same display string shown in the corresponding table cell.
  const columnDefs = useMemo<ColumnDef<ServiceGroup>[]>(() => ([
    { key: 'status', label: 'Active', align: 'left', get: (g) => (g.isActive ? 'Active' : 'Inactive') },
    { key: 'groupCode', label: 'Group Code', align: 'left', get: (g) => g.groupCode },
    { key: 'groupName', label: 'Group Name', align: 'left', get: (g) => g.groupName },
    { key: 'description', label: 'Description', align: 'left', get: (g) => g.description || '—' },
    { key: 'defaultWhereUsed', label: 'Default Where Used', align: 'left', get: (g) => g.defaultWhereUsed.join(', ') },
    { key: 'defaultModes', label: 'Default Modes', align: 'left', get: (g) => g.defaultModes.join(', ') },
    { key: 'usedInServices', label: 'Used by', align: 'right', get: (g) => String(g.usedInServices ?? 0), sortValue: (g) => g.usedInServices ?? 0 },
  ]), []);

  // Existing search + show-inactive filters; keep groupCode as the default order.
  const searchFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return groups
      .filter((g) => (showInactive ? true : g.isActive))
      .filter((g) =>
        !q
          ? true
          : g.groupCode.toLowerCase().includes(q) ||
            g.groupName.toLowerCase().includes(q) ||
            (g.description || '').toLowerCase().includes(q),
      )
      .sort((a, b) => a.groupCode.localeCompare(b.groupCode));
  }, [groups, searchTerm, showInactive]);

  // Column-level Excel-style filters + AZ/ZA sorting (shared across all list tables).
  const {
    processed: filteredGroups,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sortDirFor,
    toggleSort,
  } = useTableControls(searchFiltered, columnDefs);

  const isDirty = useMemo(() => {
    if (!editingGroup) return false;
    if (!originalGroup) return true; // creating
    return JSON.stringify(editingGroup) !== JSON.stringify(originalGroup);
  }, [editingGroup, originalGroup]);

  useEffect(() => {
    if (createSignal > 0) {
      const fresh = buildEmptyGroup(currentUsername);
      setEditingGroup(fresh);
      setOriginalGroup(null);
      setViewMode('edit');
      setActionError(null);
      setIsModalOpen(true);
    }
  }, [createSignal, currentUsername]);

  const closeModalImmediately = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setOriginalGroup(null);
    setActionError(null);
    setViewMode('view');
  };

  const guardedClose = async () => {
    if (isSaving) return;
    if (viewMode === 'edit' && isDirty) {
      const ok = await confirmDialog({
        title: 'Discard changes?',
        message: 'You have unsaved changes. Closing this form will lose them.',
        tone: 'danger',
        confirmLabel: 'Discard',
      });
      if (!ok) return;
    }
    closeModalImmediately();
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') guardedClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, viewMode, isDirty, isSaving]);

  const handleEdit = (group: ServiceGroup) => {
    setEditingGroup({ ...group });
    setOriginalGroup({ ...group });
    setViewMode('edit');
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleView = (group: ServiceGroup) => {
    setEditingGroup({ ...group });
    setOriginalGroup({ ...group });
    setViewMode('view');
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingGroup) return;
    const code = editingGroup.groupCode.trim().toUpperCase();
    const name = editingGroup.groupName.trim();
    if (!code || !name) {
      setActionError('Group code and group name are required.');
      return;
    }
    if (!GROUP_CODE_REGEX.test(code)) {
      setActionError('Group code must be 1–20 chars: A–Z, 0–9, _ or -.');
      return;
    }

    const payload = { ...editingGroup, groupCode: code, groupName: name };

    setIsSaving(true);
    setActionError(null);
    try {
      if (editingGroup.id) {
        await onUpdate(editingGroup.id, payload);
      } else {
        await onCreate(payload);
      }
      closeModalImmediately();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save service group.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (group: ServiceGroup) => {
    const usage = group.usedInServices || 0;
    const blocked = usage > 0;
    const ok = await confirmDialog({
      title: blocked ? 'Cannot delete service group' : 'Delete service group?',
      message: blocked
        ? `${usage} service${usage === 1 ? '' : 's'} still link to "${group.groupName}". Reassign or delete those services first.`
        : `"${group.groupName}" will be permanently deleted. This cannot be undone.`,
      tone: 'danger',
      confirmLabel: blocked ? 'OK' : 'Delete',
    });
    if (blocked || !ok) return;

    setActionError(null);
    try {
      await onDelete(group.id);
      if (editingGroup?.id === group.id) closeModalImmediately();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete service group.');
    }
  };

  const toggleWhereUsed = (option: WhereUsed) => {
    if (!editingGroup) return;
    const next = editingGroup.defaultWhereUsed.includes(option)
      ? editingGroup.defaultWhereUsed.filter((value) => value !== option)
      : [...editingGroup.defaultWhereUsed, option];
    setEditingGroup({ ...editingGroup, defaultWhereUsed: next });
  };

  const toggleMode = (option: TransportMode) => {
    if (!editingGroup) return;
    const next = editingGroup.defaultModes.includes(option)
      ? editingGroup.defaultModes.filter((value) => value !== option)
      : [...editingGroup.defaultModes, option];
    setEditingGroup({ ...editingGroup, defaultModes: next });
  };

  return (
    <div className="space-y-4">
      {(error || actionError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
          {error || actionError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code, name, or description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
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
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columnDefs.map((def) => (
                <th
                  key={def.key}
                  className={`px-2 py-1.5 text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 ${
                    def.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
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
              <th className="px-2 py-1.5 text-right text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading service groups…
                </td>
              </tr>
            )}
            {!loading && filteredGroups.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {groups.length === 0
                    ? 'No service groups yet. Click “New Service Group” to add one.'
                    : 'No service groups match your filters.'}
                </td>
              </tr>
            )}
            {!loading && filteredGroups.map((group, index) => (
              <tr
                key={group.id}
                className={`cursor-pointer border-b border-gray-200 dark:border-gray-700 ${
                  index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                } hover:bg-gray-50 dark:hover:bg-gray-700`}
                onClick={() => handleView(group)}
              >
                <td className="px-2 py-1.5">
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs ${
                    group.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-2 py-1.5 font-mono text-xs text-gray-900 dark:text-gray-300">{group.groupCode}</td>
                <td className="px-2 py-1.5 text-gray-900 dark:text-gray-300">{group.groupName}</td>
                <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">
                  <span className="block max-w-xs truncate" title={group.description || ''}>
                    {group.description || <span className="text-muted-foreground">—</span>}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {group.defaultWhereUsed.slice(0, 2).map((item) => (
                      <span
                        key={item}
                        className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {item}
                      </span>
                    ))}
                    {group.defaultWhereUsed.length > 2 && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        +{group.defaultWhereUsed.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {group.defaultModes.map((mode) => (
                      <span
                        key={mode}
                        className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                  {group.usedInServices ?? 0}
                </td>
                <td className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleView(group)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(group)}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(group)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" role="dialog" aria-modal="true">
          <div className="relative my-auto flex w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
              <div>
                <h2 className="text-lg text-gray-900 dark:text-gray-100">
                  {editingGroup.id
                    ? viewMode === 'edit'
                      ? 'Edit Service Group'
                      : 'Service Group Details'
                    : 'New Service Group'}
                </h2>
                {editingGroup.id && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editingGroup.usedInServices ?? 0} service
                    {editingGroup.usedInServices === 1 ? '' : 's'} link to this group
                  </p>
                )}
              </div>
              <button
                onClick={guardedClose}
                disabled={isSaving}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {actionError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                  {actionError}
                </div>
              )}

              <div>
                <h3 className="mb-3 text-sm text-gray-900 dark:text-gray-100">Identity</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Group Code *</label>
                    {viewMode === 'view' ? (
                      <div className="font-mono text-sm text-gray-900 dark:text-gray-300">{editingGroup.groupCode}</div>
                    ) : (
                      <input
                        type="text"
                        autoFocus={!editingGroup.id}
                        value={editingGroup.groupCode}
                        maxLength={20}
                        onChange={(event) =>
                          setEditingGroup({
                            ...editingGroup,
                            groupCode: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                          })
                        }
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 font-mono text-sm uppercase text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="e.g. TRN"
                      />
                    )}
                    {viewMode === 'edit' && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">A–Z, 0–9, _ or - · 1–20 chars</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Group Name *</label>
                    {viewMode === 'view' ? (
                      <div className="text-sm text-gray-900 dark:text-gray-300">{editingGroup.groupName}</div>
                    ) : (
                      <input
                        type="text"
                        value={editingGroup.groupName}
                        onChange={(event) => setEditingGroup({ ...editingGroup, groupName: event.target.value })}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="e.g. Transport Services"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Description</label>
                  {viewMode === 'view' ? (
                    <div className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-300">{editingGroup.description || '—'}</div>
                  ) : (
                    <textarea
                      value={editingGroup.description}
                      onChange={(event) => setEditingGroup({ ...editingGroup, description: event.target.value })}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      rows={3}
                      placeholder="Brief description of this service group"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-600 dark:text-gray-400">Default Where Used</label>
                {viewMode === 'view' ? (
                  <div className="flex flex-wrap gap-1">
                    {editingGroup.defaultWhereUsed.length === 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                    )}
                    {editingGroup.defaultWhereUsed.map((item) => (
                      <span
                        key={item}
                        className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {WHERE_USED_OPTIONS.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={editingGroup.defaultWhereUsed.includes(option)}
                          onChange={() => toggleWhereUsed(option)}
                          className="rounded"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-600 dark:text-gray-400">Default Modes</label>
                {viewMode === 'view' ? (
                  <div className="flex flex-wrap gap-1">
                    {editingGroup.defaultModes.length === 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                    )}
                    {editingGroup.defaultModes.map((item) => (
                      <span
                        key={item}
                        className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {MODE_OPTIONS.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={editingGroup.defaultModes.includes(option)}
                          onChange={() => toggleMode(option)}
                          className="rounded"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingGroup.isActive}
                    onChange={(event) => setEditingGroup({ ...editingGroup, isActive: event.target.checked })}
                    disabled={viewMode === 'view'}
                    className="rounded"
                  />
                  Active
                  {viewMode === 'view' && !editingGroup.isActive && (
                    <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Inactive — hidden from Service form
                    </span>
                  )}
                </label>
              </div>

              {editingGroup.id && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    <div>
                      Created by <strong>{editingGroup.createdBy || '—'}</strong> · {formatDate(editingGroup.createdDate)}
                    </div>
                    <div>
                      Last modified by <strong>{editingGroup.modifiedBy || '—'}</strong> · {formatDate(editingGroup.modifiedDate)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/60">
              {viewMode === 'view' ? (
                <>
                  <button
                    onClick={guardedClose}
                    className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setViewMode('edit')}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={guardedClose}
                    disabled={isSaving}
                    className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
