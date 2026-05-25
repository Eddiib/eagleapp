import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, RefreshCw, Search, X, Save } from 'lucide-react';
import { Port, PortPayload, portsApi } from '../services/ports';
import { invalidatePortsCache, usePorts } from '../hooks/usePorts';
import { countries, getCountryName } from '../data/countries';
import { useConfirm } from '../context/ConfirmDialog';

const CODE_RE = /^[A-Z0-9]{2,10}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

interface FormState {
  code: string;
  name: string;
  country: string;
  sortOrder: string;
}

const emptyForm: FormState = { code: '', name: '', country: '', sortOrder: '' };

function toFormState(port?: Port): FormState {
  if (!port) return emptyForm;
  return {
    code: port.code,
    name: port.name,
    country: port.country,
    sortOrder: String(port.sortOrder ?? ''),
  };
}

export function PortsManagement() {
  const { ports, loading, error, refresh } = usePorts();
  const confirmDialog = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null); // null = create mode
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  // Close on Escape when the modal is open.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const filteredPorts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return ports;
    return ports.filter((p) =>
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      getCountryName(p.country).toLowerCase().includes(q),
    );
  }, [ports, searchTerm]);

  function openCreate() {
    setEditingCode(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(port: Port) {
    setEditingCode(port.code);
    setForm(toFormState(port));
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingCode(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const country = form.country.trim().toUpperCase();
    const sortOrderNum = form.sortOrder === '' ? undefined : Number(form.sortOrder);

    if (!editingCode && !CODE_RE.test(code)) {
      setFormError('Port code must be 2-10 uppercase letters/digits (e.g. NLRTM).');
      return;
    }
    if (!name) {
      setFormError('Port name is required.');
      return;
    }
    if (!COUNTRY_RE.test(country)) {
      setFormError('Pick a country.');
      return;
    }
    if (sortOrderNum !== undefined && !Number.isFinite(sortOrderNum)) {
      setFormError('Sort order must be a number.');
      return;
    }

    setSaving(true);
    try {
      const payload: PortPayload = { code, name, country, sortOrder: sortOrderNum };
      if (editingCode) {
        await portsApi.update(editingCode, payload);
      } else {
        await portsApi.create(payload);
      }
      invalidatePortsCache();
      refresh();
      setModalOpen(false);
      setEditingCode(null);
      setForm(emptyForm);
    } catch (err: any) {
      setFormError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(port: Port) {
    const ok = await confirmDialog({
      title: 'Delete port?',
      message: `Permanently delete ${port.name} (${port.code})? Existing bookings keep the code on record, but it will no longer appear in the dropdowns.`,
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setDeletingCode(port.code);
    try {
      await portsApi.delete(port.code);
      invalidatePortsCache();
      refresh();
    } catch (err: any) {
      alert(`Delete failed: ${err?.message ?? 'unknown error'}`);
    } finally {
      setDeletingCode(null);
    }
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Ports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            UN/LOCODE port catalog used by the booking POL/POD pickers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> New Port
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by code, name or country…"
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error} — <button onClick={refresh} className="underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Country</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sort</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Loading ports…
              </td></tr>
            ) : filteredPorts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                {ports.length === 0 ? 'No ports yet. Add the first one.' : 'No ports match your search.'}
              </td></tr>
            ) : filteredPorts.map((port) => (
              <tr key={port.code} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td className="px-4 py-2 text-blue-600 dark:text-blue-400 font-medium tabular-nums">{port.code}</td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{port.name}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {getCountryName(port.country) || port.country}
                  <span className="ml-2 text-xs text-gray-400">{port.country}</span>
                </td>
                <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400 tabular-nums">{port.sortOrder}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(port)}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(port)}
                      disabled={deletingCode === port.code}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          {filteredPorts.length === ports.length
            ? `${ports.length} port${ports.length === 1 ? '' : 's'}`
            : `${filteredPorts.length} of ${ports.length} ports`}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base text-gray-900 dark:text-gray-100">
                {editingCode ? `Edit Port — ${editingCode}` : 'New Port'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  disabled={!!editingCode || saving}
                  maxLength={10}
                  placeholder="e.g. NLRTM"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editingCode && (
                  <p className="text-xs text-gray-400 mt-1">
                    Code is the unique identifier — kept stable so existing bookings keep referring to it.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={saving}
                  maxLength={100}
                  placeholder="e.g. Rotterdam"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  disabled={saving}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select country —</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  Sort order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  disabled={saving}
                  placeholder="999"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first in dropdowns.</p>
              </div>

              {formError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : editingCode ? 'Save changes' : 'Create port'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
