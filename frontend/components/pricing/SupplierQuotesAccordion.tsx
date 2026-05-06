import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, TrendingUp, Calendar, Clock } from 'lucide-react';
import { SupplierQuote } from './types';

interface SupplierQuotesAccordionProps {
  quotes: SupplierQuote[];
  selectedQuoteId?: string;
  onSelectQuote?: (quoteId: string) => void;
  onDeclineQuote?: (quoteId: string, reason: string) => void;
}

export function SupplierQuotesAccordion({
  quotes,
  selectedQuoteId,
  onSelectQuote,
  onDeclineQuote
}: SupplierQuotesAccordionProps) {
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  const toggleQuote = (quoteId: string) => {
    setExpandedQuotes(prev => ({
      ...prev,
      [quoteId]: !prev[quoteId]
    }));
  };

  const handleDecline = (quoteId: string) => {
    const reason = prompt('Please enter the reason for declining this quote:');
    if (reason && reason.trim()) {
      onDeclineQuote?.(quoteId, reason.trim());
    }
  };

  // Find best rate
  const bestRate = Math.min(...quotes.map(q => q.totalRate));

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const isExpanded = expandedQuotes[quote.id];
        const isSelected = quote.id === selectedQuoteId;
        const isBestRate = quote.totalRate === bestRate;
        const isExpired = new Date(quote.validityDate) < new Date();

        return (
          <div
            key={quote.id}
            className={`bg-white dark:bg-gray-800 border rounded-lg overflow-hidden ${
              isSelected
                ? 'border-green-500 dark:border-green-600 shadow-lg'
                : isBestRate
                ? 'border-blue-500 dark:border-blue-600'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Quote Header */}
            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleQuote(quote.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <button className="text-gray-400">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-900 dark:text-gray-100">{quote.supplierName}</h3>
                    {isBestRate && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        Best Rate
                      </span>
                    )}
                    {isSelected && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Selected
                      </span>
                    )}
                    {isExpired && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>Rate: {quote.currency} {quote.totalRate.toLocaleString()}</span>
                    {quote.transitTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quote.transitTime} days
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xl text-gray-900 dark:text-gray-100">
                {quote.currency} {quote.totalRate.toLocaleString()}
              </div>
            </div>

            {/* Quote Details (Expanded) */}
            {isExpanded && (
              <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Base Rate</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {quote.currency} {quote.baseRate.toLocaleString()}
                    </p>
                  </div>
                  {quote.transitTime && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Transit Time</label>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">{quote.transitTime} days</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Valid Until
                    </label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(quote.validityDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Received Date</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(quote.receivedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Surcharges */}
                {quote.surcharges && quote.surcharges.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2 block">Surcharges</label>
                    <div className="space-y-1">
                      {quote.surcharges.map((surcharge) => (
                        <div key={surcharge.id} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{surcharge.name}</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {surcharge.currency} {surcharge.amount.toLocaleString()}
                            {surcharge.unit && ` / ${surcharge.unit}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {quote.remarks && (
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2 block">Remarks</label>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{quote.remarks}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {quote.status === 'Received' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuote?.(quote.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept Offer
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecline(quote.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                )}

                {quote.status === 'Declined' && quote.declineReason && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Declined:</strong> {quote.declineReason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
