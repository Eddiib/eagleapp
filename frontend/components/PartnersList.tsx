import { ChangeEvent, useRef, useState, useEffect } from 'react';
import { Partner, PartnerType, PartnerStatus, PartnerFilters } from '../types/partner';
import { Employee } from './EmployeesModule';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Star,
  Filter,
  Download,
  Upload,
  Globe,
  RefreshCw,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { getCountryName, countries } from '../data/countries';
import { useConfirm } from '../context/ConfirmDialog';
import { employeesApi } from '../services/employees';
import { partnersApi, PartnerImportResult, PartnerPage } from '../services/partners';
import { PaginationBar } from './ui/PaginationBar';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { normalizePartnerRoles } from '../utils/partnerRoles';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={`w-4 h-4 ${
          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`} />
      ))}
    </div>
  );
}

interface PartnersListProps {
  onViewPartner: (partner: Partner) => void;
  onEditPartner: (partner: Partner) => void;
  onDeletePartner: (partnerId: string) => void;
  onNewPartner: () => void;
}

export function PartnersList({
  onViewPartner,
  onEditPartner,
  onDeletePartner,
  onNewPartner,
}: PartnersListProps) {
  const confirmDialog = useConfirm();
  const { baseCurrency } = useCompanySettings();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<PartnerImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  useEffect(() => {
    employeesApi.getAll().then(setEmployees).catch(() => {});
  }, []);

  const [filters, setFilters] = useState<PartnerFilters>({
    searchTerm: '',
    partnerType: 'All',
    status: 'All',
    country: '',
    rating: null,
    preferredTrade: ''
  });

  // Pagination + server-side data state.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pageData, setPageData] = useState<PartnerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Text filters (search, country) are debounced so each keystroke does not
  // fire a request; selects apply immediately.
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCountry, setAppliedCountry] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedSearch(filters.searchTerm);
      setAppliedCountry(filters.country);
    }, 300);
    return () => clearTimeout(t);
  }, [filters.searchTerm, filters.country]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    partnersApi.getPage({
      page,
      limit: pageSize,
      search: appliedSearch,
      type: filters.partnerType,
      status: filters.status,
      country: appliedCountry,
      preferredTrade: filters.preferredTrade,
    })
      .then(res => { if (!ignore) setPageData(res); })
      .catch(err => { if (!ignore) setError(err.message || 'Failed to load partners'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [page, pageSize, appliedSearch, appliedCountry, filters.partnerType, filters.status, filters.preferredTrade, reloadKey]);

  const refresh = () => setReloadKey(k => k + 1);

  // Any filter change returns to page 1 so the result set stays reachable.
  const updateFilters = (patch: Partial<PartnerFilters>) => {
    setFilters(f => ({ ...f, ...patch }));
    setPage(1);
  };

  const partners = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const hasActiveFilters =
    !!filters.searchTerm || filters.partnerType !== 'All' || filters.status !== 'All' ||
    !!filters.country || !!filters.preferredTrade;

  const openBalanceSummary = Object.entries(pageData?.totalOpenBalance ?? {})
    .map(([currency, amount]) => `${currency} ${amount.toLocaleString()}`)
    .join(' · ') || `${baseCurrency} 0`;

  const getStatusBadgeColor = (status: PartnerStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'Blacklisted':
        return 'bg-red-100 text-red-800';
      case 'Archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const result = await partnersApi.importFromExcel(file);
      setImportResult(result);
      refresh();
    } catch (err: any) {
      setImportError(err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-gray-900 dark:text-white mb-1">Partners Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage agents, carriers, suppliers, and logistics partners worldwide
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button
              variant="outline"
              className="gap-2"
              disabled={importing}
              onClick={() => importInputRef.current?.click()}
            >
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importing...' : 'Import'}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="outline" onClick={refresh} className="gap-2" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={onNewPartner} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Partner
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search partners..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="pl-9"
            />
          </div>
          
          <Select
            value={filters.partnerType}
            onValueChange={(value) => updateFilters({ partnerType: value as PartnerType | 'All' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Partner Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Shipping Line">Shipping Line</SelectItem>
              <SelectItem value="Air Carrier">Air Carrier</SelectItem>
              <SelectItem value="Trucking Company">Trucking Company</SelectItem>
              <SelectItem value="Rail Operator">Rail Operator</SelectItem>
              <SelectItem value="Shipper">Shipper</SelectItem>
              <SelectItem value="Overseas Agent">Overseas Agent</SelectItem>
              <SelectItem value="Customs Broker">Customs Broker</SelectItem>
              <SelectItem value="Warehouse / Depot">Warehouse / Depot</SelectItem>
              <SelectItem value="Insurance Company">Insurance Company</SelectItem>
              <SelectItem value="Surveyor / Inspector">Surveyor / Inspector</SelectItem>
              <SelectItem value="Special Services Provider">Special Services Provider</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => updateFilters({ status: value as PartnerStatus | 'All' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="Blacklisted">Blacklisted</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Country..."
            value={filters.country}
            onChange={(e) => updateFilters({ country: e.target.value })}
          />

          <Select
            value={filters.preferredTrade || 'all'}
            onValueChange={(value) => updateFilters({ preferredTrade: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Preferred Trade..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {countries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mt-4 text-gray-600 dark:text-gray-400">
          <span>
            {total} {total === 1 ? 'partner' : 'partners'}{hasActiveFilters ? ' matching filters' : ''}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({
                  searchTerm: '',
                  partnerType: 'All',
                  status: 'All',
                  country: '',
                  rating: null,
                  preferredTrade: ''
                });
                setPage(1);
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {importResult && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
            Imported {importResult.imported} partners. Skipped {importResult.skipped} rows
            {importResult.duplicates > 0 ? ` (${importResult.duplicates} duplicates)` : ''}.
            {importResult.warnings.length > 0 ? ` ${importResult.warnings.length} warnings.` : ''}
          </div>
        )}
        {importError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
            {importError}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error} — <button onClick={refresh} className="underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-700">
              <TableHead className="sticky left-0 bg-gray-50 dark:bg-gray-700 dark:text-gray-300 z-10">Partner Code</TableHead>
              <TableHead className="dark:text-gray-300">Company Name</TableHead>
              <TableHead className="dark:text-gray-300">Partner Type</TableHead>
              <TableHead className="dark:text-gray-300">Role</TableHead>
              <TableHead className="dark:text-gray-300">Country</TableHead>
              <TableHead className="dark:text-gray-300">City</TableHead>
              <TableHead className="dark:text-gray-300">Main Trades</TableHead>
              <TableHead className="dark:text-gray-300">Assigned Agent</TableHead>
              <TableHead className="dark:text-gray-300">Primary Contact</TableHead>
              <TableHead className="dark:text-gray-300">Phone</TableHead>
              <TableHead className="dark:text-gray-300">Email</TableHead>
              <TableHead className="dark:text-gray-300">Payment Terms</TableHead>
              <TableHead className="dark:text-gray-300">Status</TableHead>
              <TableHead className="text-right dark:text-gray-300">Open Balance</TableHead>
              <TableHead className="dark:text-gray-300">Rating</TableHead>
              <TableHead className="text-right sticky right-0 bg-gray-50 dark:bg-gray-700 dark:text-gray-300 z-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={16} className="text-center py-10">
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading partners...
                  </div>
                </TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? 'No partners match your filters.' : 'No partners yet. Create your first partner.'}
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => {
                const primaryContact = partner.contacts.find(c => c.isPrimary) || partner.contacts[0];
                return (
                  <TableRow key={partner.id} className="hover:bg-gray-50">
                    <TableCell className="sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                      {partner.partnerCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-gray-900">{partner.tradingName}</div>
                        <div className="text-gray-500">{partner.companyLegalName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{partner.partnerType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {normalizePartnerRoles(partner).map((role) => (
                          <Badge key={role} variant="secondary">{role}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getCountryName(partner.country)}</TableCell>
                    <TableCell>{partner.city}</TableCell>
                    <TableCell>
                      {partner.mainTrades && partner.mainTrades.length > 0 ? (
                        <div className="group relative">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {partner.mainTrades.slice(0, 3).map(code => getCountryName(code).substring(0, 2).toUpperCase()).join(', ')}
                              {partner.mainTrades.length > 3 && `, +${partner.mainTrades.length - 3}`}
                            </span>
                          </div>
                          {/* Tooltip */}
                          <div className="invisible group-hover:visible absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-gray-300 mb-1">Preferred Trade Lanes:</div>
                              {partner.mainTrades.map(code => (
                                <div key={code}>{getCountryName(code)}</div>
                              ))}
                            </div>
                            {/* Tooltip arrow */}
                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {partner.assignedAgentId ? (
                        (() => {
                          const assignedAgent = employees.find(emp => emp.id === partner.assignedAgentId);
                          return assignedAgent ? (
                            <div>
                              <div className="text-gray-900 dark:text-gray-100">{assignedAgent.firstName} {assignedAgent.surname}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-sm">{assignedAgent.position}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          );
                        })()
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {primaryContact ? (
                        <div>
                          <div className="text-gray-900 dark:text-gray-100">{primaryContact.name}</div>
                          <div className="text-gray-500 dark:text-gray-400">{primaryContact.position}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{primaryContact?.phone || '-'}</TableCell>
                    <TableCell>{primaryContact?.email || '-'}</TableCell>
                    <TableCell>{partner.paymentTerms}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(partner.status)}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={partner.openBalance < 0 ? 'text-red-600' : 'text-gray-900'}>
                        {partner.currency} {partner.openBalance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={partner.rating ?? 0} />
                    </TableCell>
                    <TableCell className="text-right sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewPartner(partner)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPartner(partner)}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const ok = await confirmDialog({
                              title: 'Delete partner?',
                              message: `Permanently delete ${partner.tradingName}? This cannot be undone.`,
                              tone: 'danger',
                              confirmLabel: 'Delete',
                            });
                            if (ok) onDeletePartner(partner.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          label="partners"
        />
        <div className="flex justify-end text-gray-600 dark:text-gray-400">
          Total Open Balance: {openBalanceSummary}
        </div>
      </div>
    </div>
  );
}
