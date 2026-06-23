import { useState } from 'react';
import { Search, Building2, Mail, Phone, Star, Globe, Loader2 } from 'lucide-react';
import { usePartners } from '../../hooks/usePartners';
import { Partner, PartnerType } from '../../types/partner';
import { TransportMode } from './types';
import { getCountryName } from '../../data/countries';
import { isPartnerSeller } from '../../utils/partnerRoles';

// Partner types that are considered "suppliers" in pricing context
const SUPPLIER_TYPES: PartnerType[] = [
  'Shipping Line', 'Air Carrier', 'Trucking Company', 'Rail Operator',
  'Overseas Agent', 'Customs Broker', 'Warehouse / Depot',
  'Special Services Provider', 'Other',
];

// Map partner type to a display label
const TYPE_LABELS: Partial<Record<PartnerType, string>> = {
  'Shipping Line': 'Carrier',
  'Air Carrier': 'Carrier',
  'Trucking Company': 'Carrier',
  'Rail Operator': 'Carrier',
  'Overseas Agent': 'Freight Forwarder',
  'Customs Broker': 'Broker',
  'Warehouse / Depot': 'Warehouse',
  'Special Services Provider': 'Special Services',
  'Other': 'Other',
};

// Derive transport mode specializations from partner type + defaultServiceType
function getSpecializations(p: Partner): TransportMode[] {
  const result: TransportMode[] = [];
  const pt = p.partnerType;
  if (pt === 'Shipping Line') result.push('FCL', 'LCL');
  else if (pt === 'Air Carrier') result.push('AIR');
  else if (pt === 'Trucking Company') result.push('FTL', 'LTL');
  else if (pt === 'Rail Operator') result.push('RAIL');
  // defaultServiceType as fallback
  if (result.length === 0) {
    const dst = p.defaultServiceType;
    if (dst === 'Sea') result.push('FCL', 'LCL');
    else if (dst === 'Air') result.push('AIR');
    else if (dst === 'Road') result.push('FTL', 'LTL');
    else if (dst === 'Rail') result.push('RAIL');
  }
  return result;
}

export function SupplierDirectory() {
  const { partners, loading, error } = usePartners();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSpec, setFilterSpec] = useState('all');

  const suppliers = partners.filter(p =>
    p.status === 'Active' && (isPartnerSeller(p) || SUPPLIER_TYPES.includes(p.partnerType))
  );

  const filtered = suppliers.filter(p => {
    const txt = `${p.companyLegalName} ${p.tradingName} ${p.city} ${p.country} ${getCountryName(p.country)}`.toLowerCase();
    const matchesSearch = !searchTerm || txt.includes(searchTerm.toLowerCase());
    const typeLabel = TYPE_LABELS[p.partnerType] ?? 'Other';
    const matchesType = filterType === 'all' || typeLabel.toLowerCase() === filterType.toLowerCase() || p.partnerType === filterType;
    const specs = getSpecializations(p);
    const matchesSpec = filterSpec === 'all' || specs.includes(filterSpec as TransportMode);
    return matchesSearch && matchesType && matchesSpec;
  });

  const primaryContact = (p: Partner) => p.contacts?.find(c => (c as any).is_primary || (c as any).isPrimary) ?? p.contacts?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Supplier Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active carriers, forwarders, and service providers from the Partners module</p>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#262626] px-3 py-1 rounded-full">
          {filtered.length} supplier{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search suppliers…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100">
            <option value="all">All Types</option>
            <option value="Carrier">Carrier</option>
            <option value="Freight Forwarder">Freight Forwarder</option>
            <option value="Broker">Broker</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Special Services">Special Services</option>
          </select>
          <select value={filterSpec} onChange={e => setFilterSpec(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100">
            <option value="all">All Modes</option>
            {(['FCL','LCL','FTL','LTL','AIR','RAIL','PARCEL'] as TransportMode[]).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white dark:bg-[#1E1E1E] rounded-lg shadow text-gray-500 dark:text-gray-400">
              No suppliers found. Add carriers or freight forwarders in the Partners module.
            </div>
          ) : filtered.map(p => {
            const contact = primaryContact(p);
            const specs = getSpecializations(p);
            const typeLabel = TYPE_LABELS[p.partnerType] ?? 'Other';
            return (
              <div key={p.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Building2 className="w-6 h-6 text-blue-600" /></div>
                    <div>
                      <h3 className="text-lg text-gray-900 dark:text-gray-100">{p.tradingName || p.companyLegalName}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{typeLabel} · {p.partnerType}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">Active</span>
                </div>

                {specs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {specs.map(s => (
                      <span key={s} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {(p.city || p.country) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Globe className="w-4 h-4" />
                      <span>{[p.city, p.country ? getCountryName(p.country) : ''].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {contact?.name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-gray-900 dark:text-gray-100">{contact.name}</span>
                      {contact.position && <span className="text-gray-500 dark:text-gray-400">· {contact.position}</span>}
                    </div>
                  )}
                  {contact?.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600">{contact.email}</a>
                    </div>
                  )}
                  {contact?.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="flex items-center gap-1 text-yellow-500 mb-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{p.rating ?? '—'}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">{p.partnerCode}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Partner Code</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-1 capitalize">{p.defaultServiceType}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Default Service</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
