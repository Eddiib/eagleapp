import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, ChevronUp, ChevronDown, Loader2, AlertCircle, Tag, CheckCircle2 } from 'lucide-react';
import { bookingStatusesApi, BookingStatusConfig } from '../services/bookingStatuses';
import { useBookingStatuses } from '../context/BookingStatusesContext';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmDialog';

interface Row {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

function toRow(s: BookingStatusConfig): Row {
  return {
    id: s.id,
    name: s.name,
    color: s.color,
    sort_order: s.sort_order,
    is_active: s.is_active === 1 || s.is_active === true,
  };
}

const DEFAULT_NEW_COLOR = '#3b82f6';
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function StatusPreview({ name, color }: { name: string; color: string }) {
  const safe = HEX_RE.test(color) ? color : '#6b7280';
  return (
    <span
      className="inline-block border rounded px-2 py-0.5 text-xs"
      style={{ backgroundColor: `${safe}22`, color: safe, borderColor: `${safe}66` }}
    >
      {name || 'Preview'}
    </span>
  );
}

export function BookingStatusSettings() {
  const { can } = useAuth();
  const confirmDialog = useConfirm();
  const { refresh: refreshContext } = useBookingStatuses();
  const canEdit = can('edit:company-settings');

  const [rows, setRows] = useState<Row[]>([]);
  const [original, setOriginal] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_NEW_COLOR);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await bookingStatusesApi.getAll();
      const sorted = list.map(toRow).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
      setRows(sorted);
      setOriginal(Object.fromEntries(sorted.map((r) => [r.id, r])));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patchRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSavedId(null);
  };

  const isDirty = (r: Row) => {
    const o = original[r.id];
    return !o || o.name !== r.name || o.color !== r.color || o.is_active !== r.is_active;
  };

  const saveRow = async (r: Row) => {
    if (!canEdit) return;
    if (!r.name.trim()) { setError('Status name is required.'); return; }
    if (!HEX_RE.test(r.color)) { setError(`"${r.name}" has an invalid colour.`); return; }
    setBusyId(r.id);
    setError(null);
    try {
      await bookingStatusesApi.update(r.id, { name: r.name.trim(), color: r.color, is_active: r.is_active });
      await load();
      await refreshContext();
      setSavedId(r.id);
    } catch (err: any) {
      setError(err?.message ?? 'Save failed');
    } finally {
      setBusyId(null);
    }
  };

  const deleteRow = async (r: Row) => {
    if (!canEdit) return;
    const ok = await confirmDialog({
      title: `Delete "${r.name}"?`,
      message: 'Bookings currently using this status will show a neutral badge until re-assigned.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setBusyId(r.id);
    setError(null);
    try {
      await bookingStatusesApi.remove(r.id);
      await load();
      await refreshContext();
    } catch (err: any) {
      setError(err?.message ?? 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  // Reorder by swapping sort_order with the neighbour, then persisting both.
  const move = async (index: number, dir: -1 | 1) => {
    if (!canEdit) return;
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const a = rows[index];
    const b = rows[target];
    setBusyId(a.id);
    setError(null);
    try {
      await Promise.all([
        bookingStatusesApi.update(a.id, { sort_order: b.sort_order }),
        bookingStatusesApi.update(b.id, { sort_order: a.sort_order }),
      ]);
      await load();
      await refreshContext();
    } catch (err: any) {
      setError(err?.message ?? 'Reorder failed');
    } finally {
      setBusyId(null);
    }
  };

  const addStatus = async () => {
    if (!canEdit) return;
    if (!newName.trim()) { setError('Enter a name for the new status.'); return; }
    if (!HEX_RE.test(newColor)) { setError('Pick a valid colour for the new status.'); return; }
    setAdding(true);
    setError(null);
    try {
      const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
      await bookingStatusesApi.create({ name: newName.trim(), color: newColor, sort_order: maxOrder + 10 });
      setNewName('');
      setNewColor(DEFAULT_NEW_COLOR);
      await load();
      await refreshContext();
    } catch (err: any) {
      setError(err?.message ?? 'Could not add status');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Tag className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm text-gray-900 dark:text-gray-100">Booking statuses</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Define the workflow statuses and the colour each one shows as across bookings.
        {!canEdit && <span className="italic"> Read-only.</span>}
      </p>

      {error && (
        <div className="mb-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 flex items-center justify-center text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading statuses…
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={!canEdit || i === 0 || busyId === r.id}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={!canEdit || i === rows.length - 1 || busyId === r.id}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="color"
                value={HEX_RE.test(r.color) ? r.color : '#6b7280'}
                onChange={(e) => patchRow(r.id, { color: e.target.value })}
                disabled={!canEdit}
                className="h-8 w-10 rounded border border-gray-300 dark:border-gray-600 bg-transparent disabled:opacity-50"
                title="Badge colour"
              />
              <input
                type="text"
                value={r.color}
                onChange={(e) => patchRow(r.id, { color: e.target.value })}
                disabled={!canEdit}
                maxLength={7}
                className="w-24 px-2 py-1.5 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />

              <input
                type="text"
                value={r.name}
                onChange={(e) => patchRow(r.id, { name: e.target.value })}
                disabled={!canEdit}
                maxLength={50}
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />

              <div className="w-40 flex justify-center">
                <StatusPreview name={r.name} color={r.color} />
              </div>

              <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={r.is_active}
                  onChange={(e) => patchRow(r.id, { is_active: e.target.checked })}
                  disabled={!canEdit}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Active
              </label>

              {savedId === r.id && !isDirty(r) ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <button
                  type="button"
                  onClick={() => saveRow(r)}
                  disabled={!canEdit || !isDirty(r) || busyId === r.id}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-30"
                  title="Save changes"
                >
                  {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteRow(r)}
                disabled={!canEdit || busyId === r.id}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-30"
                title="Delete status"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {rows.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No statuses defined yet.</p>
          )}

          {/* Add new */}
          {canEdit && (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 dark:border-gray-600 px-2 py-2 mt-3">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-8 w-10 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                title="Badge colour"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New status name…"
                maxLength={50}
                onKeyDown={(e) => { if (e.key === 'Enter') addStatus(); }}
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <div className="w-40 flex justify-center">
                <StatusPreview name={newName} color={newColor} />
              </div>
              <button
                type="button"
                onClick={addStatus}
                disabled={adding || !newName.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
