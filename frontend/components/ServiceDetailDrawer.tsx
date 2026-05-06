import { Service } from '../types/service';
import { X } from 'lucide-react';

interface ServiceDetailDrawerProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (service: Service) => void;
}

export function ServiceDetailDrawer({ service, isOpen, onClose, onEdit }: ServiceDetailDrawerProps) {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-white shadow-xl border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-xs text-gray-500">{service.serviceCode}</div>
          <div className="text-lg font-semibold">{service.serviceName}</div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
        <Row label="Category" value={service.category} />
        <Row label="Transport Modes" value={service.transportModes.join(', ')} />
        <Row label="Applies To" value={service.appliesTo.join(', ')} />
        <Row label="Charge Unit" value={service.chargeUnit} />
        <Row label="Default Currency" value={service.defaultCurrency} />
        <Row label="Buy/Sell" value={service.buySellType} />
        <Row label="Default VAT %" value={String(service.defaultVatRate)} />
        <Row label="Default GL Code" value={service.defaultGlCode || '—'} />
        <Row label="Price Behavior" value={service.priceBehavior} />
        <Row label="Location Type" value={service.locationType} />
        <Row label="Related Partner Types" value={service.relatedPartnerTypes.join(', ')} />
        <Row label="Documentation Required" value={service.documentationRequired ? 'Yes' : 'No'} />
        <Row label="Mandatory For" value={service.mandatoryForShipmentTypes.join(', ')} />
        <Row label="Visible To Sales" value={service.visibleToSales ? 'Yes' : 'No'} />
        <Row label="Visible To Marketplace" value={service.visibleToMarketplace ? 'Yes' : 'No'} />
        <Row label="Status" value={service.isActive ? 'Active' : 'Inactive'} />
        {service.notes && <Row label="Notes" value={service.notes} />}
      </div>
      {onEdit && (
        <div className="border-t px-6 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">Close</button>
          <button onClick={() => onEdit(service)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2">
      <div className="text-gray-500">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
