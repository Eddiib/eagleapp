import { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { Load } from './types';

interface PostToSuppliersModalProps {
  load: Load;
  onConfirm: (supplierIds: string[], deadline: string, notes: string, publishPublicly: boolean) => void;
  onCancel: () => void;
}

// Mock supplier list
const mockSuppliers = [
  { id: '1', name: 'Maersk Line', specialization: 'FCL/LCL' },
  { id: '2', name: 'CMA CGM', specialization: 'FCL/LCL' },
  { id: '3', name: 'Emirates SkyCargo', specialization: 'Air Freight' },
  { id: '4', name: 'DHL Global Forwarding', specialization: 'Air/Parcel' },
  { id: '5', name: 'Kuehne + Nagel', specialization: 'Multi-modal' },
  { id: '6', name: 'DB Schenker', specialization: 'FTL/Rail' },
];

export function PostToSuppliersModal({ load, onConfirm, onCancel }: PostToSuppliersModalProps) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [publishPublicly, setPublishPublicly] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (selectedSuppliers.length === 0) {
      setError('Please select at least one supplier');
      return;
    }
    if (!deadline) {
      setError('Please set an offer deadline');
      return;
    }

    onConfirm(selectedSuppliers, deadline, notes, publishPublicly);
  };

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const selectAll = () => {
    setSelectedSuppliers(mockSuppliers.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedSuppliers([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl text-gray-900 dark:text-gray-100">
              Post Load to Suppliers
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Load Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-blue-900 dark:text-blue-100 mb-2">Load Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Load:</span> {load.loadNumber}
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Mode:</span> {load.mode}
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Origin:</span> {load.origin}
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Destination:</span> {load.destination}
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Equipment:</span> {load.equipmentType}
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Quantity:</span> {load.quantity}
              </div>
            </div>
          </div>

          {/* Supplier Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Select Suppliers <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
              {mockSuppliers.map((supplier) => (
                <label
                  key={supplier.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedSuppliers.includes(supplier.id)}
                    onChange={() => toggleSupplier(supplier.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{supplier.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{supplier.specialization}</div>
                  </div>
                </label>
              ))}
            </div>
            {error && error.includes('supplier') && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>

          {/* Offer Deadline */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Offer Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                error && error.includes('deadline') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {error && error.includes('deadline') && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>

          {/* Notes to Supplier */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Notes to Suppliers
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={4}
              placeholder="Add any special instructions or requirements for suppliers..."
            />
          </div>

          {/* Future Feature: Publish Publicly */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={publishPublicly}
                onChange={(e) => setPublishPublicly(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  Publish to Public Marketplace
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Allow any registered supplier to submit offers (Future feature)
                </div>
              </div>
            </label>
          </div>

          {/* Info Alert */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="mb-1">Selected suppliers will receive:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Complete load specifications</li>
                <li>Required date and delivery deadline</li>
                <li>Offer submission deadline</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            Post to {selectedSuppliers.length} Supplier{selectedSuppliers.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
