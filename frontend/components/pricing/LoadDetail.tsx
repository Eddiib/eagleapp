import { 
  ArrowLeft, 
  Send, 
  FileText,
  MapPin,
  Package,
  Calendar,
  User,
  TrendingUp,
  Ship,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import { Load } from './types';
import { SupplierQuotesAccordion } from './SupplierQuotesAccordion';

interface LoadDetailProps {
  load: Load;
  onBack: () => void;
  onPostToSuppliers: () => void;
  onSelectQuote?: (quoteId: string) => void;
  onDeclineQuote?: (quoteId: string, reason: string) => void;
}

export function LoadDetail({
  load,
  onBack,
  onPostToSuppliers,
  onSelectQuote,
  onDeclineQuote
}: LoadDetailProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      'Open': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Quoting': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Offers Received': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Rate Selected': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.Open;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl text-gray-900 dark:text-gray-100">
              {load.loadNumber}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Load Details & Supplier Quotes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {(load.status === 'Open' || load.status === 'Quoting') && (
            <button
              onClick={onPostToSuppliers}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              Post to Suppliers
            </button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span className={`inline-flex px-4 py-2 rounded-lg text-sm ${getStatusColor(load.status)}`}>
          Status: {load.status}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Load Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Client Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Client Name</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{load.clientName}</p>
              </div>
              {load.salesPerson && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Sales Person</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{load.salesPerson}</p>
                </div>
              )}
              {load.relatedQuotationId && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Related Quotation</label>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">{load.relatedQuotationId}</p>
                </div>
              )}
              {load.relatedBookingId && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Related Booking</label>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">{load.relatedBookingId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Load Specifications */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Load Specifications
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Mode of Transport</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1 inline-flex px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm">
                  {load.mode}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Equipment Type</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{load.equipmentType}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Origin
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{load.origin}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Destination
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{load.destination}</p>
              </div>
              {load.transshipment && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Transshipment</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{load.transshipment}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Quantity</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{load.quantity} units</p>
              </div>
              {load.weight && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Weight</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">
                    {load.weight.toLocaleString()} {load.weightUnit}
                  </p>
                </div>
              )}
              {load.volume && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Volume</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{load.volume} CBM</p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Cargo Nature</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{load.cargoNature}</p>
              </div>
              {load.incoterm && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Incoterm</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{load.incoterm}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Required Date
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {new Date(load.requiredDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Sales Notes */}
          {load.salesNotes && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Sales Team Notes
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">{load.salesNotes}</p>
            </div>
          )}

          {/* Pricing Notes */}
          {load.pricingNotes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Pricing Team Notes
              </h3>
              <p className="text-gray-700 dark:text-gray-300">{load.pricingNotes}</p>
            </div>
          )}

          {/* Supplier Quotes Section */}
          {load.quotes && load.quotes.length > 0 && (
            <div>
              <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Supplier Quotes</h2>
              <SupplierQuotesAccordion
                quotes={load.quotes}
                selectedQuoteId={load.selectedQuoteId}
                onSelectQuote={onSelectQuote}
                onDeclineQuote={onDeclineQuote}
              />
            </div>
          )}
        </div>

        {/* Right Column - Metadata & Actions */}
        <div className="space-y-6">
          {/* Key Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Key Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Load Number</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{load.loadNumber}</p>
              </div>
              {load.postedDate && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Posted Date</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">
                    {new Date(load.postedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Created Date</label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {new Date(load.createdDate).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Last Updated</label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {new Date(load.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={onPostToSuppliers}
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Request Quotes
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Attach Documents
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Add Notes
              </button>
            </div>
          </div>

          {/* Quote Summary */}
          {load.quotes && load.quotes.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="text-green-900 dark:text-green-100 mb-3">Quote Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-800 dark:text-green-200">Total Quotes:</span>
                  <span className="text-green-900 dark:text-green-100">{load.quotes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800 dark:text-green-200">Best Rate:</span>
                  <span className="text-green-900 dark:text-green-100">
                    {Math.min(...load.quotes.map(q => q.totalRate)).toLocaleString()} {load.quotes[0]?.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800 dark:text-green-200">Average Rate:</span>
                  <span className="text-green-900 dark:text-green-100">
                    {(load.quotes.reduce((sum, q) => sum + q.totalRate, 0) / load.quotes.length).toLocaleString()} {load.quotes[0]?.currency}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
