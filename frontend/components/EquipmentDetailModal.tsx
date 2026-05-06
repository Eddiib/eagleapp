import { EquipmentType } from '../types/equipment';
import { X, Edit2, ToggleLeft, ToggleRight, Package } from 'lucide-react';

interface EquipmentDetailModalProps {
  equipment: EquipmentType;
  onEdit: () => void;
  onToggleActive: () => void;
  onClose: () => void;
}

export function EquipmentDetailModal({
  equipment,
  onEdit,
  onToggleActive,
  onClose,
}: EquipmentDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {equipment.equipmentName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{equipment.equipmentCode}</p>
            </div>
            {!equipment.isActive && (
              <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleActive}
              className={`p-2 rounded-lg transition-colors ${
                equipment.isActive
                  ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={equipment.isActive ? 'Deactivate' : 'Activate'}
            >
              {equipment.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <p className="text-gray-900 dark:text-gray-300">{equipment.category}</p>
                </div>

                {equipment.size && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Size
                    </label>
                    <p className="text-gray-900 dark:text-gray-300">{equipment.size}</p>
                  </div>
                )}

                {equipment.teuEquivalent !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      TEU Equivalent
                    </label>
                    <p className="text-gray-900 dark:text-gray-300">{equipment.teuEquivalent} TEU</p>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications */}
            {equipment.specifications && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Specifications</h3>
                <p className="text-gray-900 dark:text-gray-300 whitespace-pre-wrap">{equipment.specifications}</p>
              </div>
            )}

            {/* Notes */}
            {equipment.notes && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notes</h3>
                <p className="text-gray-900 dark:text-gray-300 whitespace-pre-wrap">{equipment.notes}</p>
              </div>
            )}

            {/* Usage Statistics */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Usage Statistics</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                    Used in Bookings
                  </label>
                  <p className="text-2xl font-semibold text-blue-900 dark:text-blue-300">{equipment.usedInBookings}</p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Created By
                  </label>
                  <p className="text-gray-900 dark:text-gray-300">{equipment.createdBy}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{equipment.createdAt}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Last Updated By
                  </label>
                  <p className="text-gray-900 dark:text-gray-300">{equipment.updatedBy}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{equipment.updatedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
