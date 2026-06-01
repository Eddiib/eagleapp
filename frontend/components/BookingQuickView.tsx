import { Booking } from '../services/bookings';
import { Package, MapPin, Truck, Ship, Plane, ChevronRight, Edit, DollarSign, FileText } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';
import { useBookingStatuses } from '../context/BookingStatusesContext';

interface BookingQuickViewProps {
  booking: Booking;
  onEdit: (booking: Booking) => void;
}

export function BookingQuickView({ booking, onEdit }: BookingQuickViewProps) {
  const { activeStatuses, colorFor } = useBookingStatuses();

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
      <td colSpan={12} className="px-4 py-4">
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
                    <th className="px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Equipment</th>
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
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{eq.equipmentName || '—'}</td>
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
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                <FileText className="w-4 h-4" />
                Documents
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
      </td>
    </tr>
  );
}
