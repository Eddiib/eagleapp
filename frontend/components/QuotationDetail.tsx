import { ArrowLeft, Edit2, CheckCircle, XCircle, FileText, Calendar, MapPin, DollarSign, User, Ship, AlertCircle } from 'lucide-react';
import { Quotation } from '../services/quotations';
import { getCountryName } from '../data/countries';

interface QuotationDetailProps {
  quotation: Quotation;
  onBack: () => void;
  onEdit: () => void;
  onMarkAccepted: () => void;
  onMarkRejected: () => void;
  onProceedToBooking: () => void;
  onReopen?: () => void;
}

function routeLabel(quotation: Quotation) {
  return {
    origin: [quotation.originCountry ? getCountryName(quotation.originCountry) : '', quotation.originPort].filter(Boolean).join(' / ') || '—',
    destination: [quotation.destinationCountry ? getCountryName(quotation.destinationCountry) : '', quotation.destinationPort].filter(Boolean).join(' / ') || '—',
  };
}

export function QuotationDetail({
  quotation,
  onBack,
  onEdit,
  onMarkAccepted,
  onMarkRejected,
  onProceedToBooking,
  onReopen,
}: QuotationDetailProps) {
  const route = routeLabel(quotation);
  const totalQuantity = quotation.services.reduce((sum, line) => sum + (line.quantity || 0), 0);

  const getStatusBadge = (status: string) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      Sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      Expired: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return badges[status as keyof typeof badges] || badges.Draft;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl text-gray-900 dark:text-gray-100">{quotation.quoteNumber}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quotation Details</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(quotation.status === 'Draft' || quotation.status === 'Sent') && (
            <>
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={onMarkRejected}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Mark as Rejected
              </button>
              <button
                onClick={onMarkAccepted}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Accepted
              </button>
            </>
          )}

          {quotation.status === 'Accepted' && (
            <button
              onClick={onProceedToBooking}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-lg"
            >
              <Ship className="w-5 h-5" />
              Proceed to Booking
            </button>
          )}

          {quotation.status === 'Rejected' && onReopen && (
            <button
              onClick={onReopen}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Re-open as Draft
            </button>
          )}
        </div>
      </div>

      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${getStatusBadge(quotation.status)}`}>
        <AlertCircle className="w-4 h-4" />
        Status: {quotation.status}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Client & Route
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Client</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{quotation.clientName || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Mode</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{quotation.modeOfTransport || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Origin
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{route.origin}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Destination
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{route.destination}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Service Lines
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Service</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Supplier</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">Sell</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {quotation.services.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                        No service lines added.
                      </td>
                    </tr>
                  ) : (
                    quotation.services.map((line) => (
                      <tr key={line.id || `${line.serviceId}-${line.supplierId || 'none'}`}>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                          {line.serviceName || line.serviceCode || line.serviceId}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{line.supplierName || '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{line.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                          {line.currency} {(line.quantity * line.costPrice).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                          {line.currency} {(line.quantity * line.sellPrice).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{line.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {quotation.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Notes</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}

          {quotation.status === 'Rejected' && quotation.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h2 className="text-lg text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Rejection Reason
              </h2>
              <p className="text-red-800 dark:text-red-200">{quotation.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Summary</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Valid Until
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{quotation.validUntil || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Created By
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{quotation.createdBy || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Service Quantity</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{totalQuantity}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
            <div className="text-xs text-red-600 dark:text-red-300 uppercase">Total Cost</div>
            <div className="text-2xl text-red-900 dark:text-red-100 mt-2">
              {quotation.currency} {quotation.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <div className="text-xs text-green-600 dark:text-green-300 uppercase">Total Sell</div>
            <div className="text-2xl text-green-900 dark:text-green-100 mt-2">
              {quotation.currency} {quotation.totalSell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
