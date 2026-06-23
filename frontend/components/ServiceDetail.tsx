import { Service } from '../types/service';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  ArrowLeft,
  Edit,
  Power,
  Ship,
  Plane,
  Truck,
  Train,
  Package,
  Globe,
  Check,
  X,
} from 'lucide-react';

interface ServiceDetailProps {
  service: Service;
  onEdit: () => void;
  onToggleActive: () => void;
  onBack: () => void;
}

export function ServiceDetail({
  service,
  onEdit,
  onToggleActive,
  onBack,
}: ServiceDetailProps) {
  const getCategoryColor = (category: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Service Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View service information</p>
          </div>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      <div className="max-w-[900px] space-y-6">
        {/* Top Summary Card */}
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl text-gray-900 dark:text-gray-100">{service.serviceName}</h2>
                  {service.isActive ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Inactive</Badge>
                  )}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mb-4">
                  Service Code: <span className="text-gray-900 dark:text-gray-100">{service.serviceCode}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getCategoryColor(service.category)}>
                    {service.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {service.transportModes.map((mode) => (
                      <div
                        key={mode}
                        className="flex items-center gap-1 text-gray-600 dark:text-gray-400"
                        title={mode}
                      >
                        {getModeIcon(mode)}
                        <span className="text-sm">{mode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Warning */}
        {!canDelete() && (
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <div className="text-yellow-800 dark:text-yellow-300">
                  <strong>Service In Use:</strong> This service is currently used in:
                  <ul className="mt-2 space-y-1 text-sm">
                    {(service.usedInQuotations ?? 0) > 0 && (
                      <li>• {service.usedInQuotations} Quotation(s)</li>
                    )}
                    {(service.usedInPricing ?? 0) > 0 && (
                      <li>• {service.usedInPricing} Pricing Record(s)</li>
                    )}
                    {(service.usedInBookings ?? 0) > 0 && (
                      <li>• {service.usedInBookings} Booking(s)</li>
                    )}
                    {(service.usedInInvoices ?? 0) > 0 && (
                      <li>• {service.usedInInvoices} Invoice(s)</li>
                    )}
                  </ul>
                  <p className="mt-2 text-sm">
                    This service cannot be deleted but can be inactivated. Inactive services
                    remain available in historical documents.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* A) Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <Badge className={getCategoryColor(service.category)}>
                  {service.category}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Transport Modes</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {service.transportModes.map((mode) => (
                    <Badge key={mode} className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {mode}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Applies To</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {service.appliesTo.map((type) => (
                    <Badge key={type} className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B) Charge Logic */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Charging Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      : service.buySellType === 'Sell'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }
                >
                  {service.buySellType}
                </Badge>
              </div>
              {service.defaultVatRate && service.defaultVatRate > 0 && (
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
            </CardContent>
          </Card>

          {/* C) Pricing Behavior */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Pricing Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Price Behavior</div>
                <div className="text-gray-900 dark:text-gray-100">{service.priceBehavior || 'Fixed'}</div>
              </div>
              {service.priceBehavior === 'Formula-based' && service.pricingModelId && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pricing Model</div>
                  <div className="text-gray-900 dark:text-gray-100">{service.pricingModelId}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* D) Operational Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Operational Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Related Partner Types</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {service.relatedPartnerTypes.length > 0 ? (
                    service.relatedPartnerTypes.map((type) => (
                      <Badge key={type} className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 dark:text-gray-400 text-sm">None specified</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Location Type</div>
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
                      <X className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">No</span>
                    </>
                  )}
                </div>
              </div>
              {service.mandatoryForShipmentTypes.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Mandatory For</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {service.mandatoryForShipmentTypes.map((type) => (
                      <Badge key={type} className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* E) Notes */}
        {service.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{service.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* F) Audit Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Audit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Created By</div>
                <div className="text-gray-900 dark:text-gray-100">{service.createdBy}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">{service.createdAt}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Last Updated By</div>
                <div className="text-gray-900 dark:text-gray-100">{service.updatedBy}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">{service.updatedAt}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">System Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {service.visibleToSales ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                )}
                <span className="text-gray-700 dark:text-gray-300">Visible to Sales</span>
              </div>
              <div className="flex items-center gap-2">
                {service.visibleToMarketplace ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                )}
                <span className="text-gray-700 dark:text-gray-300">
                  Visible to External Marketplace{' '}
                  <span className="text-gray-500 dark:text-gray-400">(future)</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
