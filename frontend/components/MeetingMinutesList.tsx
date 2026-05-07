import { useEffect, useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { SalesLeadMeetingMinute } from '../services/salesLeads';
import { useConfirm } from '../context/ConfirmDialog';
import { PaginationBar } from './ui/PaginationBar';

interface MeetingMinutesListProps {
  meetingMinutes: SalesLeadMeetingMinute[];
  onCreateNew: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MeetingMinutesList({ onCreateNew, onView, onEdit, onDelete, meetingMinutes }: MeetingMinutesListProps) {
  const confirmDialog = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => { setPage(1); }, [searchTerm, filterType, filterStatus, dateFrom, dateTo, pageSize]);

  const filtered = meetingMinutes.filter(m => {
    const text = `${m.partnerName ?? ''} ${m.salesAgent} ${m.purpose ?? ''} ${m.summary}`.toLowerCase();
    const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || m.meetingType === filterType;
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesDate = (!dateFrom || m.meetingDate >= dateFrom) && (!dateTo || m.meetingDate <= dateTo);
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getStatusBadge = (status: SalesLeadMeetingMinute['status']) => {
    const cfg = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      'follow-up-pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    const labels = {
      draft: 'Draft',
      completed: 'Completed',
      'follow-up-pending': 'Follow-up Pending',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs border ${cfg[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-gray-900">Meeting Minutes</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and track all client meeting records</p>
          </div>
          <button onClick={onCreateNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            New Meeting Minute
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by client, sales person, or purpose…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Meeting Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Types</option>
                  {['On-site', 'Online', 'Office Visit', 'Dinner', 'Expo', 'Informal'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="follow-up-pending">Follow-up Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setFilterType('all'); setFilterStatus('all'); setDateFrom(''); setDateTo(''); }}
                className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Clear Filters
              </button>
              <span className="text-sm text-gray-600 py-1.5">Showing {filtered.length} of {meetingMinutes.length} records</span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Week</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Person</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Person</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Action</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                  No meeting minutes found. Click "New Meeting Minute" to create one.
                </td>
              </tr>
            ) : (
              paged.map(m => {
                const weekNum = m.meetingDate
                  ? Math.ceil((new Date(m.meetingDate).getTime() - new Date(new Date(m.meetingDate).getFullYear(), 0, 1).getTime()) / 86400000 / 7) + 1
                  : '—';
                return (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {m.meetingDate ? new Date(m.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">W{weekNum}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{m.partnerName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.contactPerson ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200">
                        {m.meetingType ?? m.contactType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.salesAgent}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {m.durationMinutes != null ? `${m.durationMinutes} min` : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{getStatusBadge(m.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {m.nextActionDate
                        ? new Date(m.nextActionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onView(m.id)} className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEdit(m.id)} className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={async () => {
                            const ok = await confirmDialog({
                              title: 'Delete meeting minute?',
                              message: 'This minute entry will be permanently deleted.',
                              tone: 'danger',
                              confirmLabel: 'Delete',
                            });
                            if (ok) onDelete(m.id);
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
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

      {filtered.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            label="meeting minutes"
          />
        </div>
      )}
    </div>
  );
}
