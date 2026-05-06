import { useState } from 'react';
import { Service } from '../types/service';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Edit, Power, Ship, Plane, Truck, Train, Package, Globe, Check, X as XIcon } from 'lucide-react';

interface ServiceDetailModalProps {
  service: Service;
  onEdit: () => void;
  onToggleActive: () => void;
  onClose: () => void;
}

type SectionId = 'basic' | 'charging' | 'pricing' | 'operations' | 'system';

export function ServiceDetailModal({
  service,
  onEdit,
  onToggleActive,
  onClose,
}: ServiceDetailModalProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('basic');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Main Freight':
        return 'bg-blue-100 text-blue-800';
      case 'Local Charge (Origin)':
      case 'Local Charge (Destination)':
        return 'bg-green-100 text-green-800';
      case 'Documentation':
        return 'bg-purple-100 text-purple-800';
      case 'Handling / Terminal':
        return 'bg-orange-100 text-orange-800';
      case 'Trucking':
        return 'bg-yellow-100 text-yellow-800';
      case 'Warehouse':
        return 'bg-indigo-100 text-indigo-800';
      case 'Value-Added Service':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Sea':
        return <Ship className="w-5 h-5" />;
      case 'Air':
        return <Plane className="w-5 h-5" />;
      case 'Road':
        return <Truck className="w-5 h-5" />;
      case 'Rail':
        return <Train className="w-5 h-5" />;
      case 'Parcel':
        return <Package className="w-5 h-5" />;
      case 'Multimodal':
        return <Globe className="w-5 h-5" />;
    }
  };

  const canDelete = () => {
    return (
      service.usedInQuotations === 0 &&
      service.usedInPricing === 0 &&
      service.usedInBookings === 0 &&
      service.usedInInvoices === 0
    );
  };

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <h3 className="text-gray-900 dark:text-gray-100 mb-4">Basic Information</h3>

      {/* Top Summary */}
      <div className="border-l-4 border-l-blue-600 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-md">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl text-gray-900 dark:text-gray-100">{service.serviceName}</h2>
          {service.isActive ? (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
          )}
        </div>
        <div className="text-gray-600 dark:text-gray-400 mb-4">
          Service Code: <span className="text-gray-900 dark:text-gray-100">{service.serviceCode}</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={getCategoryColor(service.category)}>{service.category}</Badge>
          <div className="flex items-center gap-2">
            {service.transportModes.map((mode) => (
              <div key={mode} className="flex items-center gap-1 text-gray-600 dark:text-gray-400" title={mode}>
                {getModeIcon(mode)}
                <span className="text-sm">{mode}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Warning */}
      {!canDelete() && (
        <div className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-r-md">
          <div className="text-yellow-800 dark:text-yellow-300">
            <strong>Service In Use:</strong> This service is currently used in:
            <ul className="mt-2 space-y-1 text-sm">
              {(service.usedInQuotations ?? 0) > 0 && <li>• {service.usedInQuotations} Quotation(s)</li>}
              {(service.usedInPricing ?? 0) > 0 && <li>• {service.usedInPricing} Pricing Record(s)</li>}
              {(service.usedInBookings ?? 0) > 0 && <li>• {service.usedInBookings} Booking(s)</li>}
              {(service.usedInInvoices ?? 0) > 0 && <li>• {service.usedInInvoices} Invoice(s)</li>}
            </ul>
            <p className="mt-2 text-sm">
              This service cannot be deleted but can be inactivated. Inactive services remain available in historical documents.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Service Code</div>
          <div className="text-gray-900 dark:text-gray-100">{service.serviceCode}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Service Name</div>
          <div className="text-gray-900 dark:text-gray-100">{service.serviceName}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Category</div>
          <Badge className={getCategoryColor(service.category)}>{service.category}</Badge>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Transport Modes</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {service.transportModes.map((mode) => (
              <Badge key={mode} className="bg-blue-100 text-blue-800">
                {mode}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Applies To</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {service.appliesTo.map((type) => (
              <Badge key={type} className="bg-gray-200 text-gray-800">
                {type}
              </Badge>
            ))}
          </div>
        </div>
        {service.notes && (
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Notes</div>
            <div className="text-gray-900 dark:text-gray-100">{service.notes}</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderChargingLogic = () => (
    <div className="space-y-6">
      <h3 className="text-gray-900 dark:text-gray-100 mb-4">Charging Logic</h3>

      <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Charge Unit</div>
          <div className="text-gray-900 dark:text-gray-100">{service.chargeUnit}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Default Currency</div>
          <div className="text-gray-900 dark:text-gray-100">{service.defaultCurrency}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Buy/Sell Type</div>
          <Badge
            className={
              service.buySellType === 'Buy'
                ? 'bg-orange-100 text-orange-800'
                : service.buySellType === 'Sell'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }
          >
            {service.buySellType}
          </Badge>
        </div>
        {service.defaultVatRate !== undefined && service.defaultVatRate > 0 && (
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Default VAT Rate</div>
            <div className="text-gray-900 dark:text-gray-100">{service.defaultVatRate}%</div>
          </div>
        )}
        {service.defaultGlCode && (
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">GL / Account Code</div>
            <div className="text-gray-900 dark:text-gray-100">{service.defaultGlCode}</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPricingBehavior = () => (
    <div className="space-y-6">
      <h3 className="text-gray-900 dark:text-gray-100 mb-4">Pricing Behavior</h3>

      <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Price Behavior</div>
          <div className="text-gray-900 dark:text-gray-100">{service.priceBehavior || 'Fixed'}</div>
        </div>
        {service.priceBehavior === 'Formula' && service.pricingModelId && (
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pricing Model</div>
            <div className="text-gray-900 dark:text-gray-100">{service.pricingModelId}</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOperationsInformation = () => (
    <div className="space-y-6">
      <h3 className="text-gray-900 dark:text-gray-100 mb-4">Operations Information</h3>

      <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Related Partner Types</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {service.relatedPartnerTypes && service.relatedPartnerTypes.length > 0 ? (
              service.relatedPartnerTypes.map((type) => (
                <Badge key={type} className="bg-purple-100 text-purple-800">
                  {type}
                </Badge>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">No specific partner types</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Origin/Destination Type</div>
          <div className="text-gray-900 dark:text-gray-100">{service.locationType}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Documentation Required</div>
          <div className="flex items-center gap-2">
            {service.documentationRequired ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-900 dark:text-gray-100">Yes</span>
              </>
            ) : (
              <>
                <XIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">No</span>
              </>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Mandatory for Shipment Types</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {service.mandatoryForShipmentTypes && service.mandatoryForShipmentTypes.length > 0 ? (
              service.mandatoryForShipmentTypes.map((type) => (
                <Badge key={type} className="bg-red-100 text-red-800">
                  {type}
                </Badge>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">Not mandatory for any shipment</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemFields = () => (
    <div className="space-y-6">
      <h3 className="text-gray-900 dark:text-gray-100 mb-4">System Fields</h3>

      <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Service Status</div>
          <div className="flex items-center gap-2">
            {service.isActive ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-900 dark:text-gray-100">Active</span>
              </>
            ) : (
              <>
                <XIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">Inactive</span>
              </>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Visible to Sales Team</div>
          <div className="flex items-center gap-2">
            {service.visibleToSales ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-900 dark:text-gray-100">Yes</span>
              </>
            ) : (
              <>
                <XIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">No</span>
              </>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Visible in Public Marketplace</div>
          <div className="flex items-center gap-2">
            {service.visibleToMarketplace ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-900 dark:text-gray-100">Yes</span>
              </>
            ) : (
              <>
                <XIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">No</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Created:</span>{' '}
          <span className="text-gray-900 dark:text-gray-100">
            {service.createdAt} by {service.createdBy}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>{' '}
          <span className="text-gray-900 dark:text-gray-100">
            {service.updatedAt} by {service.updatedBy}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Usage Statistics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
            <div className="text-2xl text-gray-900 dark:text-gray-100">{service.usedInQuotations}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Quotations</div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
            <div className="text-2xl text-gray-900 dark:text-gray-100">{service.usedInPricing}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Pricing Records</div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
            <div className="text-2xl text-gray-900 dark:text-gray-100">{service.usedInBookings}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Bookings</div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
            <div className="text-2xl text-gray-900 dark:text-gray-100">{service.usedInInvoices}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Invoices</div>
          </div>
        </div>
      </div>
    </div>
  );

  const sidebarItems = [
    { id: 'basic' as SectionId, label: 'Basic Information' },
    { id: 'charging' as SectionId, label: 'Charging Logic' },
    { id: 'pricing' as SectionId, label: 'Pricing Behavior' },
    { id: 'operations' as SectionId, label: 'Operations Information' },
    { id: 'system' as SectionId, label: 'System Fields' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 dark:text-gray-300">Service Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View service information</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Service
            </Button>
            <Button
              onClick={onToggleActive}
              variant={service.isActive ? 'destructive' : 'default'}
              title={
                service.isActive
                  ? canDelete()
                    ? 'Inactivate Service'
                    : 'Inactivate (service is in use - will remain in historical records)'
                  : 'Activate Service'
              }
            >
              <Power className="w-4 h-4 mr-2" />
              {service.isActive ? 'Inactivate' : 'Activate'}
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Side Panel */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Detail Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl">
              {activeSection === 'basic' && renderBasicInformation()}
              {activeSection === 'charging' && renderChargingLogic()}
              {activeSection === 'pricing' && renderPricingBehavior()}
              {activeSection === 'operations' && renderOperationsInformation()}
              {activeSection === 'system' && renderSystemFields()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end bg-gray-50 dark:bg-gray-900">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}