import { useState } from 'react';
import { Service, ServiceCategory, TransportMode, ChargeUnit } from '../types/service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import {
  Plus,
  Search,
  Filter,
  X,
  Ship,
  Plane,
  Truck,
  Train,
  Package,
  Globe,
  Eye,
  Edit,
  Power,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Card,
  CardContent,
} from './ui/card';

interface ServicesListProps {
  services: Service[];
  onCreateNew: () => void;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export function ServicesList({
  services,
  onCreateNew,
  onViewDetail,
  onEdit,
  onToggleActive,
}: ServicesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chargeUnitFilter, setChargeUnitFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filters
  const categories: ServiceCategory[] = [
    'Main Freight',
    'Local Charge (Origin)',
    'Local Charge (Destination)',
    'Documentation',
    'Handling / Terminal',
    'Trucking',
    'Warehouse',
    'Value-Added Service',
  ];

  const modes: TransportMode[] = ['Sea', 'Air', 'Road', 'Rail', 'Parcel', 'Multimodal'];

  const chargeUnits: ChargeUnit[] = [
    'Per Container',
    'Per Truck',
    'Per BL / AWB',
    'Per Shipment',
    'Per CBM',
    'Per Ton',
    'Per KG',
    'Per Pallet',
    'Per Document',
    'Per Day',
  ];

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch =
      searchTerm === '' ||
      service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || service.category === categoryFilter;

    const matchesMode =
      modeFilter === 'all' ||
      service.transportModes.includes(modeFilter as TransportMode);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && service.isActive) ||
      (statusFilter === 'inactive' && !service.isActive);

    const matchesChargeUnit =
      chargeUnitFilter === 'all' || service.chargeUnit === chargeUnitFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesMode &&
      matchesStatus &&
      matchesChargeUnit
    );
  });

  const clearFilters = () => {
    setCategoryFilter('all');
    setModeFilter('all');
    setStatusFilter('all');
    setChargeUnitFilter('all');
    setSearchTerm('');
  };

  const activeFiltersCount = [
    categoryFilter !== 'all',
    modeFilter !== 'all',
    statusFilter !== 'all',
    chargeUnitFilter !== 'all',
    searchTerm !== '',
  ].filter(Boolean).length;

  const getCategoryColor = (category: ServiceCategory) => {
    switch (category) {
      case 'Main Freight':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Local Charge (Origin)':
      case 'Local Charge (Destination)':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Documentation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Handling / Terminal':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Trucking':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Warehouse':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'Value-Added Service':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getModeIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'Sea':
        return <Ship className="w-4 h-4" />;
      case 'Air':
        return <Plane className="w-4 h-4" />;
      case 'Road':
        return <Truck className="w-4 h-4" />;
      case 'Rail':
        return <Train className="w-4 h-4" />;
      case 'Parcel':
        return <Package className="w-4 h-4" />;
      case 'Multimodal':
        return <Globe className="w-4 h-4" />;
    }
  };

  const canDelete = (service: Service) => {
    return (
      service.usedInQuotations === 0 &&
      service.usedInPricing === 0 &&
      service.usedInBookings === 0 &&
      service.usedInInvoices === 0
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-gray-100">Services Master Catalog</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all billable services across logistics operations
          </p>
        </div>
        <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Service
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-400" />
                <Input
                  placeholder="Search by service name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={activeFiltersCount > 0 ? 'border-blue-600 text-blue-600' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-blue-600">{activeFiltersCount}</Badge>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Mode</label>
                  <Select value={modeFilter} onValueChange={setModeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      {modes.map(mode => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Charge Unit</label>
                  <Select value={chargeUnitFilter} onValueChange={setChargeUnitFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      {chargeUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredServices.length} of {services.length} services
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Code</TableHead>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Charge Unit</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Buy/Sell</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      No services found. Try adjusting your filters or create a new service.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow
                      key={service.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onViewDetail(service.id)}
                    >
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {service.serviceCode}
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-900 dark:text-gray-100">{service.serviceName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(service.category)}>
                          {service.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {service.transportModes.map((mode) => (
                            <div
                              key={mode}
                              className="text-gray-600 dark:text-gray-400"
                              title={mode}
                            >
                              {getModeIcon(mode)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {service.appliesTo.slice(0, 2).join(', ')}
                          {service.appliesTo.length > 2 && (
                            <span className="text-gray-400 dark:text-gray-400">
                              {' '}+{service.appliesTo.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {service.chargeUnit}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {service.defaultCurrency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            service.buySellType === 'Buy'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              : service.buySellType === 'Sell'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }
                        >
                          {service.buySellType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {service.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex gap-2 justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewDetail(service.id)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(service.id)}
                            title="Edit Service"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleActive(service.id)}
                            title={
                              service.isActive
                                ? canDelete(service)
                                  ? 'Inactivate Service'
                                  : 'Inactivate (service is in use)'
                                : 'Activate Service'
                            }
                          >
                            <Power
                              className={`w-4 h-4 ${
                                service.isActive ? 'text-red-600' : 'text-green-600'
                              }`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
