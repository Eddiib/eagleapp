import { useState } from 'react';
import { X, XCircle, AlertTriangle } from 'lucide-react';

interface RejectionReasonModalProps {
  quotationNumber: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectionReasonModal({ 
  quotationNumber, 
  onConfirm, 
  onCancel 
}: RejectionReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg text-red-900 dark:text-red-100">
                Reject Quotation
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300">
                {quotationNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="mb-1">
                You are about to reject this quotation. This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Mark the quotation as &quot;Rejected&quot;</li>
                <li>Prevent it from being converted to a booking</li>
                <li>Record the rejection reason for future reference</li>
              </ul>
            </div>
          </div>

          {/* Rejection Reason Input */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              rows={4}
              placeholder="Please provide a reason for rejecting this quotation (e.g., Client found better rate, Price too high, Client requirements changed, etc.)"
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This reason will be saved and visible in the quotation details.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
