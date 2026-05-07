import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter, Download, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { BookingQuickView } from './BookingQuickView';
import { bookingsApi, Booking } from '../services/bookings';
import { useConfirm } from '../context/ConfirmDialog';
import { PaginationBar } from './ui/PaginationBar';

export type { Booking };

interface BookingListProps {
  onViewBooking: (booking: Booking) => void;
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onNewBooking?: () => void;
}

export function BookingList({ onViewBooking, onEditBooking, onDeleteBooking, onNewBooking }: BookingListProps) {
  const confirmDialog = useConfirm();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const statusOptions = ['All', 'Draft', 'Confirmed', 'In Transit', 'Delivered', 'Cancelled'];
  const serviceOptions = ['All', 'FCL', 'LCL', 'Air', 'Road'];

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await bookingsApi.getAll();
      setBookings(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleDelete = async (bookingId: string) => {
    const ok = await confirmDialog({
      title: 'Delete booking?',
      message: 'This will permanently delete the booking and all its line items. This cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setDeletingId(bookingId);
    try {
      await bookingsApi.delete(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      onDeleteBooking?.(bookingId);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
    const matchesService = serviceFilter === 'All' || booking.serviceType === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  // Reset to page 1 whenever filters narrow the result set — keeps the current page valid.
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, serviceFilter, pageSize]);

  const pagedBookings = filteredBookings.slice((page - 1) * pageSize, page * pageSize);

  const handleSelectAll = (checked: boolean) => {
    setSelectedBookings(checked ? new Set(filteredBookings.map(b => b.id)) : new Set());
  };

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    const next = new Set(selectedBookings);
    checked ? next.add(bookingId) : next.delete(bookingId);
    setSelectedBookings(next);
  };

  const toggleExpand = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'Draft':      return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Confirmed':  return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'In Transit': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Delivered':  return 'bg-green-100 text-green-700 border-green-300';
      case 'Cancelled':  return 'bg-red-100 text-red-700 border-red-300';
      default:           return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl text-gray-900 dark:text-gray-100">Booking Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all your shipment bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {onNewBooking && (
              <button
                onClick={onNewBooking}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Booking
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by booking number, client, origin, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {statusOptions.map(s => <option key={s} value={s}>{s} Status</option>)}
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {serviceOptions.map(s => <option key={s} value={s}>{s} Service</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error} — <button onClick={fetchBookings} className="underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedBookings.size === filteredBookings.length && filteredBookings.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Booking #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Booking Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ETD</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ETA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Containers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading bookings...
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {bookings.length === 0 ? 'No bookings yet. Create your first booking.' : 'No bookings match your search.'}
                  </td>
                </tr>
              ) : (
                pagedBookings.map((booking) => (
                  <>
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(booking.id)}
                          onChange={(e) => handleSelectBooking(booking.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(booking.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            {expandedBookingId === booking.id
                              ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                          </button>
                          <button
                            onClick={() => onViewBooking(booking)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {booking.bookingNumber}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{booking.clientName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                        <div>{booking.origin || '—'}</div>
                        <div className="text-gray-400 dark:text-gray-500">→ {booking.destination || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                          {booking.serviceType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{booking.bookingDate || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{booking.estimatedDeparture || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{booking.estimatedArrival || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm text-center">
                        {booking.totalContainers > 0 ? booking.totalContainers : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{booking.createdBy || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewBooking(booking)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {onEditBooking && (
                            <button
                              onClick={() => onEditBooking(booking)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteBooking && (
                            <button
                              onClick={() => handleDelete(booking.id)}
                              disabled={deletingId === booking.id}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedBookingId === booking.id && (
                      <BookingQuickView booking={booking} onEdit={onEditBooking || onViewBooking} />
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={filteredBookings.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            label="bookings"
          />
          {selectedBookings.size > 0 && (
            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
              {selectedBookings.size} selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
