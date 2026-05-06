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
            <h1 className="text-gray-900">Service Details</h1>
            <p className="text-gray-600 mt-1">View service information</p>
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
                  <h2 className="text-2xl text-gray-900">{service.serviceName}</h2>
                  {service.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                  )}
                </div>
                <div className="text-gray-600 mb-4">
                  Service Code: <span className="text-gray-900">{service.serviceCode}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getCategoryColor(service.category)}>
                    {service.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {service.transportModes.map((mode) => (
                      <div
                        key={mode}
                        className="flex items-center gap-1 text-gray-600"
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
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <div className="text-yellow-800">
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
              <CardTitle className="text-gray-900">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Service Code</div>
                <div className="text-gray-900">{service.serviceCode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Service Name</div>
                <div className="text-gray-900">{service.serviceName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Category</div>
                <Badge className={getCategoryColor(service.category)}>
                  {service.category}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">Transport Modes</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {service.transportModes.map((mode) => (
                    <Badge key={mode} className="bg-blue-100 text-blue-800">
                      {mode}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Applies To</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {service.appliesTo.map((type) => (
                    <Badge key={type} className="bg-gray-200 text-gray-800">
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
              <CardTitle className="text-gray-900">Charging Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Charge Unit</div>
                <div className="text-gray-900">{service.chargeUnit}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Default Currency</div>
                <div className="text-gray-900">{service.defaultCurrency}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Buy/Sell Type</div>
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
              {service.defaultVatRate && service.defaultVatRate > 0 && (
                <div>
                  <div className="text-sm text-gray-600">Default VAT Rate</div>
                  <div className="text-gray-900">{service.defaultVatRate}%</div>
                </div>
              )}
              {service.defaultGlCode && (
                <div>
                  <div className="text-sm text-gray-600">GL / Account Code</div>
                  <div className="text-gray-900">{service.defaultGlCode}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* C) Pricing Behavior */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Pricing Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Price Behavior</div>
                <div className="text-gray-900">{service.priceBehavior || 'Fixed'}</div>
              </div>
              {service.priceBehavior === 'Formula-based' && service.pricingModelId && (
                <div>
                  <div className="text-sm text-gray-600">Pricing Model</div>
                  <div className="text-gray-900">{service.pricingModelId}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* D) Operational Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Operational Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Related Partner Types</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {service.relatedPartnerTypes.length > 0 ? (
                    service.relatedPartnerTypes.map((type) => (
                      <Badge key={type} className="bg-purple-100 text-purple-800">
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">None specified</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Location Type</div>
                <div className="text-gray-900">{service.locationType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Documentation Required</div>
                <div className="flex items-center gap-2">
                  {service.documentationRequired ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-gray-900">Yes</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">No</span>
                    </>
                  )}
                </div>
              </div>
              {service.mandatoryForShipmentTypes.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600">Mandatory For</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {service.mandatoryForShipmentTypes.map((type) => (
                      <Badge key={type} className="bg-red-100 text-red-800">
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
              <CardTitle className="text-gray-900">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{service.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* F) Audit Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Audit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Created By</div>
                <div className="text-gray-900">{service.createdBy}</div>
                <div className="text-gray-500 text-xs">{service.createdAt}</div>
              </div>
              <div>
                <div className="text-gray-600">Last Updated By</div>
                <div className="text-gray-900">{service.updatedBy}</div>
                <div className="text-gray-500 text-xs">{service.updatedAt}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">System Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {service.visibleToSales ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-gray-700">Visible to Sales</span>
              </div>
              <div className="flex items-center gap-2">
                {service.visibleToMarketplace ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-gray-700">
                  Visible to External Marketplace{' '}
                  <span className="text-gray-500">(future)</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
