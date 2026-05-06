import { useState } from 'react';
import { EquipmentType, EquipmentFilters } from '../types/equipment';
import { Plus, Search, Filter, Eye, Edit2, ToggleLeft, ToggleRight, Package } from 'lucide-react';

interface EquipmentListProps {
  equipment: EquipmentType[];
  onCreateNew: () => void;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export function EquipmentList({
  equipment,
  onCreateNew,
  onViewDetail,
  onEdit,
  onToggleActive,
}: EquipmentListProps) {
  const [filters, setFilters] = useState<EquipmentFilters>({
    searchTerm: '',
    category: 'all',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch =
      item.equipmentName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      item.equipmentCode.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesCategory = filters.category === 'all' || item.category === filters.category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-white font-semibold">Equipment Types</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredEquipment.length} equipment type{filteredEquipment.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Equipment Type
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={filters.searchTerm}
              onChange={e => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Container">Container</option>
                <option value="Trailer">Trailer</option>
                <option value="Chassis">Chassis</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Pallet">Pallet</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Equipment List Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Equipment Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  TEU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Used in Bookings
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEquipment.map(item => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !item.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {item.equipmentCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      {item.equipmentName}
                      {!item.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {item.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {item.size || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {item.teuEquivalent !== undefined ? item.teuEquivalent : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {item.usedInBookings}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetail(item.id)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(item.id)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleActive(item.id)}
                        className={`p-1.5 rounded transition-colors ${
                          item.isActive
                            ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={item.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {item.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEquipment.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No equipment types found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filters.searchTerm || filters.category !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first equipment type'}
            </p>
            {!filters.searchTerm && filters.category === 'all' && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Equipment Type
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
