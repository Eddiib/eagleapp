import { useEffect, useMemo, useState } from 'react';
import { SalesLead, LeadRanking, SalesLeadMeetingMinute } from './SalesLeads';
import { PaginationBar } from './ui/PaginationBar';
import { Employee } from './EmployeesModule';
import { SalesLeadMeetingPanel } from './SalesLeadMeetingPanel';
import { ColumnHeader } from './ui/ColumnHeader';
import { useTableControls, ColumnDef } from '../hooks/useTableControls';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Phone, 
  FileText,
  Package,
  Search,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  X
} from 'lucide-react';
import { getCountryName } from '../data/countries';

interface SalesLeadsListProps {
  salesLeads: SalesLead[];
  salesEmployees: Employee[];
  onViewDetail: (leadId: string) => void;
  onCreateBookingFromLead?: (leadData: any) => void;
  onSaveMeetingMinute: (leadId: string, meeting: Omit<SalesLeadMeetingMinute, 'id' | 'createdAt' | 'createdBy'>) => Promise<void> | void;
}

export function SalesLeadsList({
  salesLeads,
  salesEmployees,
  onViewDetail,
  onCreateBookingFromLead,
  onSaveMeetingMinute
}: SalesLeadsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterTrade, setFilterTrade] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRanking, setFilterRanking] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState<SalesLead | null>(null);
  const [showMeetingPanel, setShowMeetingPanel] = useState(false);
  const [stagedMessage, setStagedMessage] = useState<string | null>(null);

  // Get unique values for filters
  const uniqueCities = Array.from(new Set(salesLeads.map(l => l.city))).filter(Boolean).sort();
  const uniqueTrades = Array.from(new Set(salesLeads.flatMap(l => l.preferredTrades))).filter(Boolean).sort();

  // Column descriptors drive the header sort/filter dropdowns; each `get` returns the displayed cell text.
  const columnDefs = useMemo<ColumnDef<SalesLead>[]>(() => ([
    { key: 'leadId', label: 'Lead ID', align: 'left', get: (l) => l.leadId },
    { key: 'clientName', label: 'Client Name', align: 'left', get: (l) => l.clientName },
    { key: 'assignedSalesAgent', label: 'Sales Agent', align: 'left', get: (l) => l.assignedSalesAgent },
    { key: 'preferredTrades', label: 'Preferred Trades', align: 'left', get: (l) => l.preferredTrades.join(', ') },
    { key: 'city', label: 'City', align: 'left', get: (l) => l.city },
    { key: 'lastContactDate', label: 'Last Contacted', align: 'left', get: (l) => l.lastContactDate || '-', sortValue: (l) => l.lastContactDate || '' },
    { key: 'leadRanking', label: 'Ranking', align: 'left', get: (l) => l.leadRanking },
    { key: 'partnerStatus', label: 'Status', align: 'left', get: (l) => l.partnerStatus },
  ]), []);

  // Filter sales leads
  const searchFiltered = salesLeads.filter(lead => {
    const matchesSearch = 
      lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.partnerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.assignedSalesAgent.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAgent = filterAgent === 'all' || lead.assignedSalesAgentId === filterAgent;
    const matchesCity = filterCity === 'all' || lead.city === filterCity;
    const matchesTrade = filterTrade === 'all' || lead.preferredTrades.includes(filterTrade);
    const matchesStatus = filterStatus === 'all' || lead.partnerStatus === filterStatus;
    const matchesRanking = filterRanking === 'all' || lead.leadRanking === filterRanking;

    return matchesSearch && matchesAgent && matchesCity && matchesTrade && matchesStatus && matchesRanking;
  });

  // Column-level Excel-style filters + AZ/ZA sorting (shared across all list tables).
  const {
    processed: filteredLeads,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sortDirFor,
    toggleSort,
  } = useTableControls(searchFiltered, columnDefs);

  // Client-side pagination — keeps the DOM small even with many leads.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterAgent, filterCity, filterTrade, filterStatus, filterRanking, pageSize, columnFilters]);
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);
  const pagedLeads = filteredLeads.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeFiltersCount =
    (filterAgent !== 'all' ? 1 : 0) +
    (filterCity !== 'all' ? 1 : 0) +
    (filterTrade !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterRanking !== 'all' ? 1 : 0);

  const getRankingColor = (ranking: LeadRanking) => {
    switch (ranking) {
      case 'High':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'Medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Low':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
  };

  const getRankingIcon = (ranking: LeadRanking) => {
    switch (ranking) {
      case 'High':
        return <TrendingUp className="w-3 h-3" />;
      case 'Medium':
        return <Minus className="w-3 h-3" />;
      case 'Low':
        return <TrendingDown className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
  };

  const handleContactLead = (lead: SalesLead) => {
    setSelectedLeadForMeeting(lead);
    setShowMeetingPanel(true);
  };

  const handleQuoteLead = (lead: SalesLead) => {
    setStagedMessage(
      `Lead-to-quotation conversion for ${lead.clientName} is staged. Use the Quotation Desk directly until this workflow has a persisted handoff.`
    );
  };

  const handleBookLead = (lead: SalesLead) => {
    // Navigate to Booking Details with pre-filled data
    if (onCreateBookingFromLead) {
      onCreateBookingFromLead({
        partnerId: lead.partnerId,
        clientId: lead.partnerId,
        businessName: lead.clientName,
        clientName: lead.clientName,
        contactPerson: lead.contactPerson,
        city: lead.city,
        country: lead.country,
        salesAgent: lead.assignedSalesAgent,
        leadId: lead.leadId,
        sourceSalesLeadId: lead.id,
      });
    } else {
      setStagedMessage(
        `Lead-to-booking conversion for ${lead.clientName} is unavailable in this context. Open Sales Leads from the main app shell to use the live booking handoff.`
      );
    }
  };

  const handleSaveMeeting = async (meeting: Omit<SalesLeadMeetingMinute, 'id' | 'createdAt' | 'createdBy'>) => {
    if (selectedLeadForMeeting) {
      await onSaveMeetingMinute(selectedLeadForMeeting.id, meeting);
      setShowMeetingPanel(false);
      setSelectedLeadForMeeting(null);
    }
  };

  const clearAllFilters = () => {
    setFilterAgent('all');
    setFilterCity('all');
    setFilterTrade('all');
    setFilterStatus('all');
    setFilterRanking('all');
  };

  const getAgentInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        {stagedMessage && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{stagedMessage}</span>
            </div>
            <button
              onClick={() => setStagedMessage(null)}
              className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
              aria-label="Dismiss staged workflow notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-gray-900 dark:text-white">Sales Leads</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Synced from active client and buyer partners, with persisted CRM activity
            </p>
          </div>
        </div>

        {/* Search and Filter Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name, lead ID, partner code, sales agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors relative ${
              showFilters
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeColumnFilterCount > 0 && (
            <button
              onClick={clearAllColumnFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Clear all column filters"
            >
              <Filter className="w-4 h-4" />
              Clear filters ({activeColumnFilterCount})
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-gray-900 dark:text-white">Filter Options</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {/* Sales Agent Filter */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Sales Agent</label>
                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Agents</option>
                  {salesEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.surname}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">City</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Cities</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Trade Filter */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Preferred Trade</label>
                <select
                  value={filterTrade}
                  onChange={(e) => setFilterTrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Trades</option>
                  {uniqueTrades.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Partner Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Passive">Passive</option>
                </select>
              </div>

              {/* Ranking Filter */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Lead Ranking</label>
                <select
                  value={filterRanking}
                  onChange={(e) => setFilterRanking(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Rankings</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="text-gray-900 dark:text-white">{filteredLeads.length}</span> of{' '}
          <span className="text-gray-900 dark:text-white">{salesLeads.length}</span> sales leads
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {columnDefs.map(def => (
                <th key={def.key} className="px-2 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
              <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {pagedLeads.map((lead) => (
              <tr
                key={lead.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="text-gray-900 dark:text-white">{lead.leadId}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{lead.partnerCode}</div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="text-gray-900 dark:text-white">{lead.clientName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{getCountryName(lead.country)}</div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs">
                      {getAgentInitials(lead.assignedSalesAgent)}
                    </div>
                    <span className="text-gray-900 dark:text-white">{lead.assignedSalesAgent}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {lead.preferredTrades.slice(0, 3).map(trade => (
                      <Badge key={trade} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-1.5 py-0.5">
                        {trade}
                      </Badge>
                    ))}
                    {lead.preferredTrades.length > 3 && (
                      <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400 text-xs px-1.5 py-0.5">
                        +{lead.preferredTrades.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="text-gray-900 dark:text-white">{lead.city}</div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="text-gray-900 dark:text-white">
                    {lead.lastContactDate || '-'}
                  </div>
                  {lead.meetingMinutesCount > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {lead.meetingMinutesCount} meeting{lead.meetingMinutesCount > 1 ? 's' : ''}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <Badge className={`${getRankingColor(lead.leadRanking)} flex items-center gap-1 w-fit px-1.5 py-0.5`}>
                    {getRankingIcon(lead.leadRanking)}
                    {lead.leadRanking}
                  </Badge>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <Badge className={`${getStatusColor(lead.partnerStatus)} px-1.5 py-0.5`}>
                    {lead.partnerStatus}
                  </Badge>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    {/* Contact Button - Opens Meeting Minutes */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleContactLead(lead)}
                      className="h-8 px-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Contact - Add Meeting Minutes"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>

                    {/* Quote Button - Opens Quotation Desk */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuoteLead(lead)}
                      className="h-8 px-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      title="Quote - Create Quotation"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>

                    {/* Book Button - Opens Booking Details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookLead(lead)}
                      className="h-8 px-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      title="Book - Create Booking"
                    >
                      <Package className="w-4 h-4" />
                    </Button>

                    {/* View Details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(lead.id)}
                      className="h-8 px-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 dark:text-white mb-2">No sales leads found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {searchTerm || activeFiltersCount > 0
                ? 'Try adjusting your search or filter criteria'
                : 'No synced client or buyer leads are available yet'}
            </p>
          </div>
        )}

        {filteredLeads.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={filteredLeads.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              label="leads"
            />
          </div>
        )}
      </div>

      {/* Meeting Minutes Panel */}
      {showMeetingPanel && selectedLeadForMeeting && (
        <SalesLeadMeetingPanel
          lead={selectedLeadForMeeting}
          onClose={() => {
            setShowMeetingPanel(false);
            setSelectedLeadForMeeting(null);
          }}
          onSave={handleSaveMeeting}
        />
      )}
    </div>
  );
}
