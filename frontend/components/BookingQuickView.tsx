import { useEffect, useState } from 'react';
import { Booking, BookingAttachment, bookingAttachmentsApi } from '../services/bookings';
import { Package, MapPin, Truck, Ship, Plane, ChevronRight, Edit, DollarSign, FileText } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';
import { BookingDocsModal } from './BookingDocsModal';
import { useBookingStatuses } from '../context/BookingStatusesContext';

interface BookingQuickViewProps {
  booking: Booking;
  onEdit: (booking: Booking) => void;
}

export function BookingQuickView({ booking, onEdit }: BookingQuickViewProps) {
  const { activeStatuses, colorFor } = useBookingStatuses();

  // The list endpoint keeps attachments out of the payload, so pull them once
  // when the row is expanded — the count drives the Documents button styling.
  const [attachments, setAttachments] = useState<BookingAttachment[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);

  useEffect(() => {
    if (!booking.id) return;
    let cancelled = false;
    setDocsLoading(true);
    setDocsError(null);
    bookingAttachmentsApi.list(booking.id)
      .then(rows => { if (!cancelled) setAttachments(rows); })
      .catch(err => { if (!cancelled) setDocsError(err.message || 'Failed to load documents'); })
      .finally(() => { if (!cancelled) setDocsLoading(false); });
    return () => { cancelled = true; };
  }, [booking.id]);

  // Fall back to the list's count while the fetch is in flight so the button
  // doesn't flicker from neutral to highlighted.
  const docCount = docsLoading ? booking.attachmentCount : attachments.length;
  const hasDocs = docCount > 0;

  const getServiceIcon = (serviceType: Booking['serviceType']) => {
    switch (serviceType) {
      case 'FCL':
      case 'LCL':
        return <Ship className="w-4 h-4" />;
      case 'Air':
        return <Plane className="w-4 h-4" />;
      case 'Road':
        return <Truck className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  // Progress reflects how far the booking has advanced through the configured
  // status workflow (first status = 0%, last = 100%).
  const statusIndex = activeStatuses.findIndex((s) => s.name === booking.status);
  const progressPercentage =
    statusIndex >= 0 && activeStatuses.length > 1
      ? Math.round((statusIndex / (activeStatuses.length - 1)) * 100)
      : 0;
  const progressColor = colorFor(booking.status) || '#6b7280';
  const workflowLabels = activeStatuses.length ? activeStatuses.map((s) => s.name) : [booking.status];

  return (
    <tr className="bg-gray-50 dark:bg-gray-800/50">
      <td colSpan={13} className="px-4 py-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {/* Header with Status and Edit */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg text-gray-900 dark:text-gray-100">
                {booking.bookingNumber}
              </h3>
              <StatusBadge status={booking.status} className="px-3 py-1 text-sm rounded-full" />
            </div>
            <button
              onClick={() => onEdit(booking)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Booking
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">Shipment Progress</span>
              <span className="text-xs text-gray-900 dark:text-gray-100">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%`, backgroundColor: progressColor }}
              />
            </div>
            <div className="flex items-start justify-between gap-2 mt-2">
              {workflowLabels.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className={`min-w-0 flex-1 ${
                    index === 0
                      ? 'text-left'
                      : index === workflowLabels.length - 1
                        ? 'text-right'
                        : 'text-center'
                  }`}
                >
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-500" title={label}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Route */}
            <div className="col-span-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Route</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{booking.origin}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{booking.destination}</div>
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 mb-2">
                {getServiceIcon(booking.serviceType)}
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Service</span>
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100">{booking.serviceType}</div>
            </div>

            {/* Containers */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Containers</span>
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {booking.totalContainers > 0 ? `${booking.totalContainers} Units` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Equipment</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Container ID</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {booking.equipment.length === 0 ? (
                    <tr className="bg-white dark:bg-gray-800">
                      <td colSpan={4} className="px-3 py-3 text-center text-gray-500 dark:text-gray-400">
                        No equipment assigned.
                      </td>
                    </tr>
                  ) : booking.equipment.map((eq, i) => (
                    <tr key={eq.id || i} className="bg-white dark:bg-gray-800">
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-mono">{eq.containerId || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{eq.equipmentCode || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{eq.category || '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100 tabular-nums">{eq.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => setDocsOpen(true)}
                title={hasDocs ? `${docCount} document${docCount !== 1 ? 's' : ''} uploaded` : 'No documents uploaded'}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded text-sm transition-colors ${
                  hasDocs
                    ? 'border-green-500 dark:border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Documents
                {hasDocs && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 tabular-nums">
                    {docCount}
                  </span>
                )}
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                <DollarSign className="w-4 h-4" />
                Financials
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                <Truck className="w-4 h-4" />
                Track Shipment
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {docsOpen && (
          <BookingDocsModal
            bookingId={booking.id}
            bookingNumber={booking.bookingNumber}
            attachments={attachments}
            loading={docsLoading}
            error={docsError}
            onClose={() => setDocsOpen(false)}
          />
        )}
      </td>
    </tr>
  );
}
