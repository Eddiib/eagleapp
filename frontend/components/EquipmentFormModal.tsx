import { useState } from 'react';
import { EquipmentType } from '../types/equipment';
import { X, Loader2 } from 'lucide-react';

interface EquipmentFormModalProps {
  mode: 'create' | 'edit';
  initialData?: EquipmentType;
  onSave: (data: Partial<EquipmentType>) => void;
  onCancel: () => void;
  saving?: boolean;
  saveError?: string | null;
}

export function EquipmentFormModal({
  mode,
  initialData,
  onSave,
  onCancel,
  saving = false,
  saveError = null,
}: EquipmentFormModalProps) {
  const [formData, setFormData] = useState<Partial<EquipmentType>>(
    initialData || {
      equipmentCode: '',
      equipmentName: '',
      category: 'Container',
      size: '',
      specifications: '',
      teuEquivalent: undefined,
      notes: '',
      isActive: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof EquipmentType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Add Equipment Type' : 'Edit Equipment Type'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {mode === 'create' ? 'Add a new equipment type' : 'Update equipment type information'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Equipment Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.equipmentCode}
                    onChange={e => handleChange('equipmentCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., EQP-40HC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Equipment Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.equipmentName}
                    onChange={e => handleChange('equipmentName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 40ft High Cube Container"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={e => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Container">Container</option>
                    <option value="Trailer">Trailer</option>
                    <option value="Chassis">Chassis</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Pallet">Pallet</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={e => handleChange('size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 40ft, 20ft, 53ft"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                    TEU Equivalent
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.teuEquivalent || ''}
                    onChange={e => handleChange('teuEquivalent', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2.0 for 40ft, 1.0 for 20ft"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Twenty-foot Equivalent Unit for capacity planning
                  </p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Specifications</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Specifications
                </label>
                <textarea
                  value={formData.specifications}
                  onChange={e => handleChange('specifications', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Technical specifications, dimensions, capacity, etc."
                />
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Notes</h3>
              <textarea
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or comments..."
              />
            </div>

            {/* Active Status */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => handleChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  Active (Equipment type is available for use)
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-800">
          {saveError && (
            <span className="text-sm text-red-600 dark:text-red-400 mr-auto">{saveError}</span>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : mode === 'create' ? 'Create Equipment Type' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
