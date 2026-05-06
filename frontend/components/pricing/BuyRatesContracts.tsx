import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, X, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { pricingApi, PricingContract } from '../../services/pricing';
import { usePartners } from '../../hooks/usePartners';
import { TransportMode } from './types';
import { useConfirm } from '../../context/ConfirmDialog';

const MODES: TransportMode[] = ['FCL','LCL','FTL','LTL','AIR','PARCEL','RAIL','BULK','SPECIAL'];

// ── Contract Form ─────────────────────────────────────────────

interface ContractFormProps {
  initial?: PricingContract | null;
  onSaved: () => void;
  onCancel: () => void;
}

function ContractForm({ initial, onSaved, onCancel }: ContractFormProps) {
  const { partners } = usePartners();
  const suppliers = partners.filter(p => p.status === 'Active' &&
    !['Client','Buyer'].includes(p.partnerType));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractNumber, setContractNumber] = useState(initial?.contractNumber ?? '');
  const [supplierId, setSupplierId] = useState(initial?.supplierId ?? '');
  const [supplierName, setSupplierName] = useState(initial?.supplierName ?? '');
  const [mode, setMode] = useState<TransportMode>(initial?.mode ?? 'FCL');
  const [origin, setOrigin] = useState(initial?.origin ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [equipmentType, setEquipmentType] = useState(initial?.equipmentType ?? '');
  const [serviceLevel, setServiceLevel] = useState(initial?.serviceLevel ?? '');
  const [baseRate, setBaseRate] = useState(initial?.baseRate ?? '');
  const [totalRate, setTotalRate] = useState(initial?.totalRate ?? '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD');
  const [validFrom, setValidFrom] = useState(initial?.validFrom ?? '');
  const [validTo, setValidTo] = useState(initial?.validTo ?? '');
  const [transitDays, setTransitDays] = useState(initial?.transitDays ?? '');
  const [frequency, setFrequency] = useState(initial?.frequency ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive !== false);

  useEffect(() => {
    if (!initial) {
      pricingApi.getNextContractNumber().then(r => setContractNumber(r.contract_number)).catch(() => {});
    }
  }, [initial]);

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const p = suppliers.find(s => s.id === id);
    setSupplierName(p ? (p.tradingName || p.companyLegalName) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const data: Partial<PricingContract> = {
      contractNumber, supplierId: supplierId || undefined, supplierName, mode,
      origin, destination, equipmentType, serviceLevel: serviceLevel || undefined,
      baseRate: baseRate !== '' ? Number(baseRate) : undefined,
      totalRate: totalRate !== '' ? Number(totalRate) : undefined,
      currency, validFrom: validFrom || undefined, validTo: validTo || undefined,
      transitDays: transitDays !== '' ? Number(transitDays) : undefined,
      frequency: frequency || undefined, notes: notes || undefined, isActive,
    };
    try {
      if (initial?.id) await pricingApi.updateContract(initial.id, data);
      else await pricingApi.createContract(data);
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-gray-900">{initial ? 'Edit Contract' : 'New Contract'}</h2>
            <p className="text-sm text-gray-500">{initial ? `Contract ${initial.contractNumber}` : 'Create a new buy-rate contract'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      {error && <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Contract Number</label>
            <input value={contractNumber} onChange={e => setContractNumber(e.target.value)} disabled={!!initial}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Transport Mode *</label>
            <select value={mode} onChange={e => setMode(e.target.value as TransportMode)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Supplier</label>
            <select value={supplierId} onChange={e => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select or type below…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.tradingName || s.companyLegalName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Supplier Name *</label>
            <input value={supplierName} onChange={e => setSupplierName(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Origin *</label>
            <input value={origin} onChange={e => setOrigin(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Destination *</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Equipment Type</label>
            <input value={equipmentType} onChange={e => setEquipmentType(e.target.value)} placeholder="40' HC, General…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Service Level</label>
            <input value={serviceLevel} onChange={e => setServiceLevel(e.target.value)} placeholder="Standard, Express…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Frequency</label>
            <input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="Daily, Weekly…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Base Rate</label>
            <input type="number" value={baseRate} onChange={e => setBaseRate(e.target.value)} step="0.01" min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Total Rate</label>
            <input type="number" value={totalRate} onChange={e => setTotalRate(e.target.value)} step="0.01" min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['USD','EUR','GBP','AED'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Transit Days</label>
            <input type="number" value={transitDays} onChange={e => setTransitDays(e.target.value)} min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Valid From</label>
            <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Valid To</label>
            <input type="date" value={validTo} onChange={e => setValidTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </form>
    </div>
  );
}

// ── Main BuyRatesContracts component ─────────────────────────

export function BuyRatesContracts() {
  const confirmDialog = useConfirm();
  const [contracts, setContracts] = useState<PricingContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingContract, setEditingContract] = useState<PricingContract | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setContracts(await pricingApi.getContracts()); }
    catch (err: any) { setError(err?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete contract?',
      message: 'This contract will be permanently deleted. This cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try { await pricingApi.deleteContract(id); load(); }
    catch (err: any) { alert(err?.message ?? 'Failed'); }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <ContractForm
        initial={view === 'edit' ? editingContract : null}
        onSaved={() => { setView('list'); load(); }}
        onCancel={() => setView('list')}
      />
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const filtered = contracts.filter(c => {
    const txt = `${c.contractNumber} ${c.supplierName} ${c.origin} ${c.destination}`.toLowerCase();
    const matchesStatus = filterStatus === 'all'
      || (filterStatus === 'active' && c.isActive)
      || (filterStatus === 'inactive' && !c.isActive)
      || (filterStatus === 'expired' && c.validTo && c.validTo < today);
    return (!searchTerm || txt.includes(searchTerm.toLowerCase())) &&
      (filterMode === 'all' || c.mode === filterMode) && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">Buy Rates & Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage supplier contracts and procurement rates</p>
        </div>
        <button onClick={() => setView('create')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Contract
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search contracts…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Mode</label>
              <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="all">All Modes</option>
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="col-span-2 flex items-end">
              <button onClick={() => { setFilterMode('all'); setFilterStatus('all'); }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                <X className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-600">{error} <button onClick={load} className="ml-3 underline">Retry</button></div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Contract #','Supplier','Mode','Route','Equipment','Rate','Validity','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">No contracts found. Click "New Contract" to create one.</td></tr>
              ) : filtered.map(c => {
                const expired = c.validTo && c.validTo < today;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-blue-600">{c.contractNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.supplierName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">{c.mode}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.origin} → {c.destination}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.equipmentType || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {c.totalRate != null ? `${c.currency} ${c.totalRate.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {c.validFrom && c.validTo ? `${c.validFrom} – ${c.validTo}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        expired ? 'bg-red-100 text-red-700' :
                        c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {expired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingContract(c); setView('edit'); }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
