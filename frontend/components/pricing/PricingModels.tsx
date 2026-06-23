import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, LayoutTemplate, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { pricingApi, PricingModel } from '../../services/pricing';
import { TransportMode } from './types';
import { useConfirm } from '../../context/ConfirmDialog';

const MODES: TransportMode[] = ['FCL','LCL','FTL','LTL','AIR','PARCEL','RAIL','BULK','SPECIAL'];
const CALC_TYPES = [
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'per_weight', label: 'Per Weight' },
  { value: 'per_volume', label: 'Per Volume' },
  { value: 'whichever_greater', label: 'Whichever Greater' },
  { value: 'custom', label: 'Custom' },
];

// ── Model Form ────────────────────────────────────────────────

interface ModelFormProps {
  initial?: PricingModel | null;
  onSaved: () => void;
  onCancel: () => void;
}

function ModelForm({ initial, onSaved, onCancel }: ModelFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelName, setModelName] = useState(initial?.modelName ?? '');
  const [mode, setMode] = useState<TransportMode>(initial?.mode ?? 'FCL');
  const [calculationType, setCalculationType] = useState<PricingModel['calculationType']>(initial?.calculationType ?? 'per_unit');
  const [baseUnit, setBaseUnit] = useState(initial?.baseUnit ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [minimumCharge, setMinimumCharge] = useState(initial?.minimumCharge ?? '');
  const [defaultValidityDays, setDefaultValidityDays] = useState(initial?.defaultValidityDays ?? 30);
  const [roundingRule, setRoundingRule] = useState(initial?.roundingRule ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const data: Partial<PricingModel> = {
      modelName, mode, calculationType, baseUnit: baseUnit || undefined,
      description: description || undefined,
      minimumCharge: minimumCharge !== '' ? Number(minimumCharge) : undefined,
      defaultValidityDays: Number(defaultValidityDays),
      roundingRule: roundingRule || undefined, isActive,
    };
    try {
      if (initial?.id) await pricingApi.updateModel(initial.id, data);
      else await pricingApi.createModel(data);
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-gray-900 dark:text-gray-100">{initial ? 'Edit Pricing Model' : 'New Pricing Model'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Define a calculation template for a transport mode</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      {error && <div className="mx-6 mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">{error}</div>}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Model Name *</label>
            <input value={modelName} onChange={e => setModelName(e.target.value)} required placeholder="e.g. FCL Standard Pricing"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Transport Mode *</label>
            <select value={mode} onChange={e => setMode(e.target.value as TransportMode)} required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100">
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Describe how this model calculates rates…"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Calculation Type *</label>
            <select value={calculationType} onChange={e => setCalculationType(e.target.value as PricingModel['calculationType'])} required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100">
              {CALC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Base Unit</label>
            <input value={baseUnit} onChange={e => setBaseUnit(e.target.value)} placeholder="container, kg, cbm…"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Minimum Charge</label>
            <input type="number" value={minimumCharge} onChange={e => setMinimumCharge(e.target.value)} step="0.01" min={0}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Default Validity (days) *</label>
            <input type="number" value={defaultValidityDays} onChange={e => setDefaultValidityDays(Number(e.target.value))} min={1} required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Rounding Rule</label>
            <select value={roundingRule} onChange={e => setRoundingRule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100">
              <option value="">None</option>
              <option value="up">Round Up</option>
              <option value="down">Round Down</option>
              <option value="nearest">Round Nearest</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Main PricingModels component ──────────────────────────────

export function PricingModels() {
  const confirmDialog = useConfirm();
  const [models, setModels] = useState<PricingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingModel, setEditingModel] = useState<PricingModel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setModels(await pricingApi.getModels()); }
    catch (err: any) { setError(err?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete pricing model?',
      message: 'This pricing model will be permanently deleted. This cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try { await pricingApi.deleteModel(id); load(); }
    catch (err: any) { alert(err?.message ?? 'Failed'); }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <ModelForm
        initial={view === 'edit' ? editingModel : null}
        onSaved={() => { setView('list'); load(); }}
        onCancel={() => setView('list')}
      />
    );
  }

  const filtered = models.filter(m =>
    `${m.modelName} ${m.mode} ${m.description ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Pricing Models</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Calculation templates for different transport modes</p>
        </div>
        <button onClick={() => setView('create')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Model
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search pricing models…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…</div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center text-red-600 dark:text-red-300">{error} <button onClick={load} className="ml-3 underline">Retry</button></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-12 bg-white dark:bg-[#1E1E1E] rounded-lg shadow text-gray-500 dark:text-gray-400">
              No pricing models found. Click "New Model" to create one.
            </div>
          ) : filtered.map(m => (
            <div key={m.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><LayoutTemplate className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h3 className="text-gray-900 dark:text-gray-100">{m.modelName}</h3>
                    <span className="inline-flex px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs rounded-full mt-1">{m.mode}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingModel(m); setView('edit'); }}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {m.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{m.description}</p>}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Calculation:</span>
                  <span className="text-gray-900 dark:text-gray-100 capitalize">{m.calculationType.replace(/_/g, ' ')}</span>
                </div>
                {m.baseUnit && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Base Unit:</span>
                    <span className="text-gray-900 dark:text-gray-100 uppercase">{m.baseUnit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Validity:</span>
                  <span className="text-gray-900 dark:text-gray-100">{m.defaultValidityDays} days</span>
                </div>
                {m.minimumCharge != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Min. Charge:</span>
                    <span className="text-gray-900 dark:text-gray-100">{m.minimumCharge.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${m.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200'}`}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
