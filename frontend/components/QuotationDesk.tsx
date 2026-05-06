import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, Filter, CheckCircle, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Quotation, quotationsApi } from '../services/quotations';
import { getCountryName } from '../data/countries';

interface QuotationDeskProps {
  onViewQuotation?: (quotation: Quotation) => void;
  onEditQuotation?: (quotation: Quotation) => void;
  onDeleteQuotation?: (quotationId: string) => void;
  onNewQuotation?: () => void;
  refreshKey?: number;
}

function routeLabel(quotation: Quotation) {
  const origin = [quotation.originCountry ? getCountryName(quotation.originCountry) : '', quotation.originPort].filter(Boolean).join(' / ');
  const destination = [quotation.destinationCountry ? getCountryName(quotation.destinationCountry) : '', quotation.destinationPort].filter(Boolean).join(' / ');
  return {
    origin: origin || '—',
    destination: destination || '—',
  };
}

export function QuotationDesk({
  onViewQuotation,
  onEditQuotation,
  onDeleteQuotation,
  onNewQuotation,
  refreshKey = 0,
}: QuotationDeskProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');

  const loadQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await quotationsApi.getAll();
      setQuotations(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [refreshKey]);

  const uniqueClients = useMemo(
    () => Array.from(new Set(quotations.map((quotation) => quotation.clientName).filter(Boolean))).sort(),
    [quotations]
  );

  const filteredQuotations = useMemo(() => (
    quotations.filter((quotation) => {
      const { origin, destination } = routeLabel(quotation);
      const matchesSearch =
        quotation.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        destination.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || quotation.status === filterStatus;
      const matchesMode = filterMode === 'all' || quotation.modeOfTransport === filterMode;
      const matchesClient = filterClient === 'all' || quotation.clientName === filterClient;

      return matchesSearch && matchesStatus && matchesMode && matchesClient;
    })
  ), [quotations, searchTerm, filterStatus, filterMode, filterClient]);

  const getStatusBadge = (status: Quotation['status']) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'Sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Expired':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Quotation['status']) => {
    if (status === 'Accepted') return <CheckCircle className="w-4 h-4" />;
    if (status === 'Rejected') return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const activeFiltersCount = [filterStatus !== 'all', filterMode !== 'all', filterClient !== 'all'].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Quotation Desk</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage live quotations, service bundles, and conversion to bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadQuotations}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNewQuotation}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by quotation number, client, origin, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Mode</label>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Modes</option>
                <option value="Sea">Sea</option>
                <option value="Air">Air</option>
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Multimodal">Multimodal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Client</label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Clients</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredQuotations.length} of {quotations.length} quotations
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quote #</th>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Routing</th>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Mode</th>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Services</th>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sell Total</th>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Valid Until</th>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading quotations...
                    </div>
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quotation) => {
                  const route = routeLabel(quotation);
                  return (
                    <tr key={quotation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400">{quotation.quoteNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{quotation.clientName || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <span>{route.origin}</span>
                          <span>→</span>
                          <span>{route.destination}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{quotation.modeOfTransport || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{quotation.serviceCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {quotation.currency} {quotation.totalSell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{quotation.validUntil || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${getStatusBadge(quotation.status)}`}>
                          {getStatusIcon(quotation.status)}
                          {quotation.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewQuotation?.(quotation)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditQuotation?.(quotation)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteQuotation?.(quotation.id)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
