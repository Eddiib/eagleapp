import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Plus, Search, Eye, Send, Filter, X, Clock, Package,
  MapPin, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  Building2, Truck, DollarSign, Calendar, Edit2, Trash2,
  Loader2, Save, ArrowLeft
} from 'lucide-react';
import { pricingApi, PricingLoad, PricingQuote } from '../../services/pricing';
import { quotationsApi, generateQuoteNumber } from '../../services/quotations';
import { usePartners } from '../../hooks/usePartners';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmDialog';
import { Load, TransportMode, LoadStatus } from './types';

const MODES: TransportMode[] = ['FCL','LCL','FTL','LTL','AIR','PARCEL','RAIL','BULK','SPECIAL'];
const STATUSES: LoadStatus[] = ['Open','Quoting','Offers Received','Rate Selected','Closed'];

// ── Status / Mode badge helpers ───────────────────────────────

function statusBadge(status: LoadStatus) {
  const map: Record<LoadStatus, string> = {
    'Open': 'bg-blue-100 text-blue-800',
    'Quoting': 'bg-yellow-100 text-yellow-800',
    'Offers Received': 'bg-purple-100 text-purple-800',
    'Rate Selected': 'bg-green-100 text-green-800',
    'Closed': 'bg-gray-100 text-gray-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

function modeBadge(mode: TransportMode) {
  const map: Record<TransportMode, string> = {
    FCL: 'bg-indigo-100 text-indigo-800', LCL: 'bg-cyan-100 text-cyan-800',
    FTL: 'bg-orange-100 text-orange-800', LTL: 'bg-amber-100 text-amber-800',
    AIR: 'bg-sky-100 text-sky-800',       PARCEL: 'bg-pink-100 text-pink-800',
    RAIL: 'bg-teal-100 text-teal-800',    BULK: 'bg-stone-100 text-stone-800',
    SPECIAL: 'bg-violet-100 text-violet-800',
  };
  return map[mode] ?? 'bg-gray-100 text-gray-700';
}

// ── Load Form ─────────────────────────────────────────────────

interface LoadFormProps {
  initial?: PricingLoad | null;
  onSaved: () => void;
  onCancel: () => void;
}

function LoadForm({ initial, onSaved, onCancel }: LoadFormProps) {
  const { partners } = usePartners();
  const { user } = useAuth();
  const clients = partners.filter(p => (p.partnerType === 'Client' || p.partnerType === 'Buyer') && p.status === 'Active');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadNumber, setLoadNumber] = useState(initial?.loadNumber ?? '');
  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [clientName, setClientName] = useState(initial?.clientName ?? '');
  const [salesPerson, setSalesPerson] = useState(initial?.salesPerson ?? (user?.username ?? ''));
  const [mode, setMode] = useState<TransportMode>(initial?.mode ?? 'FCL');
  const [origin, setOrigin] = useState(initial?.origin ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [equipmentType, setEquipmentType] = useState(initial?.equipmentType ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [volumeCbm, setVolumeCbm] = useState(initial?.volumeCbm ?? '');
  const [weightKg, setWeightKg] = useState(initial?.weightKg ?? '');
  const [cargoNature, setCargoNature] = useState(initial?.cargoNature ?? '');
  const [incoterm, setIncoterm] = useState(initial?.incoterm ?? '');
  const [requiredDate, setRequiredDate] = useState(initial?.requiredDate ?? '');
  const [status, setStatus] = useState<LoadStatus>(initial?.status ?? 'Open');
  const [salesNotes, setSalesNotes] = useState(initial?.salesNotes ?? '');
  const [pricingNotes, setPricingNotes] = useState(initial?.pricingNotes ?? '');

  useEffect(() => {
    if (!initial) {
      pricingApi.getNextLoadNumber().then(r => setLoadNumber(r.load_number)).catch(() => {});
    }
  }, [initial]);

  const handleClientChange = (id: string) => {
    setClientId(id);
    const p = clients.find(c => c.id === id);
    setClientName(p ? (p.tradingName || p.companyLegalName) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const data: Partial<PricingLoad> = {
      clientId: clientId || undefined, clientName, salesPerson: salesPerson || undefined,
      mode, origin, destination, equipmentType, quantity: Number(quantity),
      volumeCbm: volumeCbm !== '' ? Number(volumeCbm) : undefined,
      weightKg: weightKg !== '' ? Number(weightKg) : undefined,
      cargoNature, incoterm: incoterm || undefined, requiredDate, status,
      salesNotes: salesNotes || undefined, pricingNotes: pricingNotes || undefined,
    };
    try {
      if (initial?.id) {
        await pricingApi.updateLoad(initial.id, data);
      } else {
        await pricingApi.createLoad({ ...data, loadNumber });
      }
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
            <h2 className="text-gray-900">{initial ? 'Edit Load' : 'New Load'}</h2>
            <p className="text-sm text-gray-500">{initial ? `Load ${initial.loadNumber}` : 'Create a new pricing request'}</p>
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
            <label className="block text-sm text-gray-700 mb-1">Load Number</label>
            <input value={loadNumber} onChange={e => setLoadNumber(e.target.value)} disabled={!!initial}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as LoadStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Transport Mode *</label>
            <select value={mode} onChange={e => setMode(e.target.value as TransportMode)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Client</label>
            <select value={clientId} onChange={e => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.tradingName || c.companyLegalName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Sales Person</label>
            <input value={salesPerson} onChange={e => setSalesPerson(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Origin *</label>
            <input value={origin} onChange={e => setOrigin(e.target.value)} required placeholder="e.g. Shanghai, China"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Destination *</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} required placeholder="e.g. Rotterdam, Netherlands"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Equipment Type</label>
            <input value={equipmentType} onChange={e => setEquipmentType(e.target.value)} placeholder="40' HC, General…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Qty</label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Volume (CBM)</label>
            <input type="number" value={volumeCbm} onChange={e => setVolumeCbm(e.target.value)} step="0.01" min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Weight (KG)</label>
            <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} step="0.01" min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Cargo Nature *</label>
            <input value={cargoNature} onChange={e => setCargoNature(e.target.value)} required placeholder="Electronics, Machinery…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Incoterm</label>
            <select value={incoterm} onChange={e => setIncoterm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">—</option>
              {['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Required Date *</label>
            <input type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Sales Notes</label>
            <textarea value={salesNotes} onChange={e => setSalesNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Pricing Notes</label>
            <textarea value={pricingNotes} onChange={e => setPricingNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Add Quote Form ────────────────────────────────────────────

interface AddQuoteFormProps {
  load: PricingLoad;
  onSaved: () => void;
  onCancel: () => void;
}

function AddQuoteForm({ load, onSaved, onCancel }: AddQuoteFormProps) {
  const { partners } = usePartners();
  const suppliers = partners.filter(p => p.status === 'Active' &&
    ['Shipping Line','Air Carrier','Trucking Company','Rail Operator','Overseas Agent'].includes(p.partnerType));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [offeredRate, setOfferedRate] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [transitDays, setTransitDays] = useState('');
  const [validityDate, setValidityDate] = useState('');
  const [equipmentAvailableDate, setEquipmentAvailableDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const p = suppliers.find(s => s.id === id);
    setSupplierName(p ? (p.tradingName || p.companyLegalName) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const total = offeredRate !== '' ? Number(offeredRate) : (baseRate !== '' ? Number(baseRate) : undefined);
    try {
      await pricingApi.addQuote(load.id, {
        supplierId: supplierId || undefined, supplierName, carrierName: carrierName || undefined,
        mode: load.mode, offeredRate: offeredRate !== '' ? Number(offeredRate) : undefined,
        currency, baseRate: baseRate !== '' ? Number(baseRate) : undefined, totalRate: total,
        transitDays: transitDays !== '' ? Number(transitDays) : undefined,
        validityDate: validityDate || undefined, equipmentAvailableDate: equipmentAvailableDate || undefined,
        remarks: remarks || undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mt-2">
      <h4 className="text-gray-900 mb-4">Add Supplier Quote — {load.loadNumber}</h4>
      {error && <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
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
            <input value={supplierName} onChange={e => setSupplierName(e.target.value)} required placeholder="Supplier company…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Carrier / Line</label>
            <input value={carrierName} onChange={e => setCarrierName(e.target.value)} placeholder="Maersk, COSCO…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Offered Rate</label>
            <input type="number" value={offeredRate} onChange={e => setOfferedRate(e.target.value)} step="0.01" min={0} placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Base Rate</label>
            <input type="number" value={baseRate} onChange={e => setBaseRate(e.target.value)} step="0.01" min={0} placeholder="0.00"
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Validity Date</label>
            <input type="date" value={validityDate} onChange={e => setValidityDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Equipment Available</label>
            <input type="date" value={equipmentAvailableDate} onChange={e => setEquipmentAvailableDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Remarks</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Add Quote'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main AvailableLoads component ─────────────────────────────

export function AvailableLoads() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const [loads, setLoads] = useState<PricingLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingLoad, setEditingLoad] = useState<PricingLoad | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addQuoteForLoad, setAddQuoteForLoad] = useState<PricingLoad | null>(null);
  const [loadDetail, setLoadDetail] = useState<PricingLoad | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setLoads(await pricingApi.getLoads()); }
    catch (err: any) { setError(err?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadWithQuotes = async (loadId: string) => {
    const detail = await pricingApi.getLoad(loadId);
    setLoadDetail(detail);
    setExpandedId(loadId);
  };

  const handleExpand = (l: PricingLoad) => {
    if (expandedId === l.id) { setExpandedId(null); setLoadDetail(null); return; }
    if (l.quoteCount > 0 || l.quotes) loadWithQuotes(l.id);
    else setExpandedId(l.id);
  };

  const handleAccept = async (loadId: string, quoteId: string) => {
    try {
      await pricingApi.updateQuoteStatus(loadId, quoteId, 'Accepted', undefined, user?.username);

      // Offer to create a Draft Quotation from the accepted supplier quote.
      // Requires a real clientId on the load — free-text clients can't be linked to quotations.
      const targetLoad = loads.find(l => l.id === loadId);
      const acceptedQuote = loadDetail?.quotes?.find(q => q.id === quoteId);
      const wantsQuotation = targetLoad?.clientId && acceptedQuote
        ? await confirmDialog({
            title: 'Create draft quotation?',
            message: `Quote accepted. Create a Draft Quotation for ${targetLoad.clientName}?`,
            confirmLabel: 'Create quotation',
          })
        : false;
      if (targetLoad?.clientId && acceptedQuote && wantsQuotation) {
        const buyRate = acceptedQuote.totalRate ?? acceptedQuote.offeredRate ?? 0;
        const createdQuotation = await quotationsApi.create({
          quoteNumber: generateQuoteNumber(),
          status: 'Draft',
          clientId: targetLoad.clientId,
          modeOfTransport: targetLoad.mode,
          totalSell: buyRate,
          totalCost: buyRate,
          currency: acceptedQuote.currency,
          notes: [
            `Source: Pricing Load ${targetLoad.loadNumber}`,
            `Supplier: ${acceptedQuote.supplierName}${acceptedQuote.carrierName ? ' / ' + acceptedQuote.carrierName : ''}`,
            `Route: ${targetLoad.origin} → ${targetLoad.destination}`,
            acceptedQuote.transitDays != null ? `Transit: ${acceptedQuote.transitDays} days` : null,
          ].filter(Boolean).join('\n'),
          services: [],
        }, user?.username);
        // Link the load back to the new quotation (backend already set status='Rate Selected').
        await pricingApi.updateLoad(loadId, { ...targetLoad, relatedQuotationId: createdQuotation.id, status: 'Rate Selected' });
      }

      load();
      setExpandedId(null); setLoadDetail(null);
    } catch (err: any) { alert(err?.message ?? 'Failed'); }
  };

  const handleDecline = async (loadId: string, quoteId: string) => {
    const reason = prompt('Reason for declining (optional):') ?? undefined;
    try {
      await pricingApi.updateQuoteStatus(loadId, quoteId, 'Declined', reason, user?.username);
      loadWithQuotes(loadId);
    } catch (err: any) { alert(err?.message ?? 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete load?',
      message: 'This will also delete all associated quotes. This cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try { await pricingApi.deleteLoad(id); load(); }
    catch (err: any) { alert(err?.message ?? 'Failed'); }
  };

  const handleMarkQuoting = async (l: PricingLoad) => {
    try {
      await pricingApi.updateLoad(l.id, { ...l, status: 'Quoting', postedDate: new Date().toISOString().split('T')[0] });
      load();
    } catch (err: any) { alert(err?.message ?? 'Failed'); }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <LoadForm
        initial={view === 'edit' ? editingLoad : null}
        onSaved={() => { setView('list'); load(); }}
        onCancel={() => setView('list')}
      />
    );
  }

  const filtered = loads.filter(l => {
    const txt = `${l.loadNumber} ${l.clientName} ${l.origin} ${l.destination} ${l.cargoNature}`.toLowerCase();
    return (!searchTerm || txt.includes(searchTerm.toLowerCase())) &&
      (filterMode === 'all' || l.mode === filterMode) &&
      (filterStatus === 'all' || l.status === filterStatus);
  });

  const quotes = loadDetail?.id === expandedId ? (loadDetail.quotes ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">Available Loads</h1>
          <p className="text-sm text-gray-500 mt-1">Manage pricing requests and supplier quotes</p>
        </div>
        <button onClick={() => setView('create')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Load
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search loads…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
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
                <option value="all">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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

      <div className="text-sm text-gray-500">Showing {filtered.length} of {loads.length} loads</div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-600">
          {error} <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Load #','Client','Mode','Routing','Equipment','Qty','Cargo','Required','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500">No loads found. Click "New Load" to create one.</td></tr>
                ) : filtered.map(l => (
                  <Fragment key={l.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-blue-600">{l.loadNumber}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{l.clientName || '—'}</div>
                        {l.salesPerson && <div className="text-xs text-gray-500">{l.salesPerson}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs ${modeBadge(l.mode)}`}>{l.mode}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{l.origin}</span><span>→</span><span>{l.destination}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{l.equipmentType || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {l.quantity}x
                        {l.volumeCbm != null && <span className="text-gray-500 ml-1">{l.volumeCbm} CBM</span>}
                        {l.weightKg != null && <span className="text-gray-500 ml-1">{l.weightKg} KG</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{l.cargoNature || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {l.requiredDate ? new Date(l.requiredDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${statusBadge(l.status)}`}>
                          {l.status}
                        </span>
                        {l.quoteCount > 0 && (
                          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                            {l.quoteCount} offer{l.quoteCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingLoad(l); setView('edit'); }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {(l.status === 'Open') && (
                            <button onClick={() => handleMarkQuoting(l)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Mark as Quoting / Post to Suppliers">
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setAddQuoteForLoad(addQuoteForLoad?.id === l.id ? null : l)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded" title="Add Quote">
                            <Plus className="w-4 h-4" />
                          </button>
                          {l.quoteCount > 0 && (
                            <button onClick={() => handleExpand(l)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="View Offers">
                              {expandedId === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                          <button onClick={() => handleDelete(l.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Add Quote inline form */}
                    {addQuoteForLoad?.id === l.id && (
                      <tr>
                        <td colSpan={10} className="px-4 py-2">
                          <AddQuoteForm load={l} onSaved={() => { setAddQuoteForLoad(null); load(); }} onCancel={() => setAddQuoteForLoad(null)} />
                        </td>
                      </tr>
                    )}

                    {/* Expanded offers */}
                    {expandedId === l.id && (
                      <tr>
                        <td colSpan={10} className="px-0 py-0">
                          <div className="bg-gray-50 p-6 border-t border-gray-200">
                            <h4 className="text-gray-900 mb-4 flex items-center gap-2">
                              <Package className="w-5 h-5" /> Supplier Offers ({quotes.length})
                            </h4>
                            {quotes.length === 0 ? (
                              <p className="text-gray-500 text-sm">Loading…</p>
                            ) : (
                              <div className="space-y-3">
                                {quotes.map(q => (
                                  <div key={q.id} className={`bg-white rounded-lg border p-4 ${q.status === 'Accepted' ? 'border-green-400' : q.status === 'Declined' ? 'border-gray-300 opacity-60' : 'border-gray-200'}`}>
                                    <div className="grid grid-cols-6 gap-4 items-center">
                                      <div>
                                        <div className="flex items-center gap-1 text-sm text-gray-900"><Building2 className="w-4 h-4 text-gray-400" />{q.supplierName}</div>
                                        <div className="text-xs text-gray-500">Supplier</div>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1 text-sm text-gray-900"><Truck className="w-4 h-4 text-gray-400" />{q.carrierName || '—'}</div>
                                        <div className="text-xs text-gray-500">Carrier</div>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1 text-sm text-green-700"><DollarSign className="w-4 h-4" />{q.currency} {(q.totalRate ?? q.offeredRate ?? 0).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">Total Rate</div>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1 text-sm text-gray-900"><Calendar className="w-4 h-4 text-gray-400" />{q.equipmentAvailableDate || '—'}</div>
                                        <div className="text-xs text-gray-500">Equip. Available</div>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1 text-sm text-gray-900"><Clock className="w-4 h-4 text-gray-400" />{q.transitDays != null ? `${q.transitDays} days` : '—'}</div>
                                        <div className="text-xs text-gray-500">Transit</div>
                                      </div>
                                      <div className="flex items-center gap-2 justify-end">
                                        {q.status === 'Accepted' ? (
                                          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">Accepted</span>
                                        ) : q.status === 'Declined' ? (
                                          <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">Declined</span>
                                        ) : (
                                          <>
                                            <button onClick={() => handleAccept(l.id, q.id)}
                                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                                              <ThumbsUp className="w-4 h-4" /> Accept
                                            </button>
                                            <button onClick={() => handleDecline(l.id, q.id)}
                                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
                                              <ThumbsDown className="w-4 h-4" /> Decline
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {q.remarks && <p className="mt-2 text-xs text-gray-500">{q.remarks}</p>}
                                    {q.declineReason && <p className="mt-1 text-xs text-red-600">Declined: {q.declineReason}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
