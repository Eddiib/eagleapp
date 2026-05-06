import { useState } from 'react';
import { Plus, Trash2, Ship, Truck, Train, CheckCircle2, Clock, MapPin, Calendar, ChevronDown, ChevronUp, Plane } from 'lucide-react';
import { Fragment as ReactFragment } from 'react';

interface ServiceRow {
  id: string;
  equipmentId: string;
  serviceType: string;
  equipment: string;
  invoiceParty: string;
  agreedRate: string;
  serviceProvider: string;
  agreedCost: string;
}

interface PassingPoint {
  id: string;
  name: string;
  location: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  actualDateTime?: string;
  estimatedDateTime?: string;
  dwellTime?: string;
  notes?: string;
}

interface Leg {
  id: string;
  legNumber: number;
  mode: 'sea' | 'truck' | 'rail' | 'air' | 'customs';
  origin: string;
  destination: string;
  carrier?: string;
  vesselVoyage?: string;
  truckPlate?: string;
  flightNumber?: string;
  etd?: string;
  eta?: string;
  passingPoints: PassingPoint[];
}

const equipmentTypes = [
  { value: '20DV', label: '20DV - 20ft Dry Van' },
  { value: '40DV', label: '40DV - 40ft Dry Van' },
  { value: '40HC', label: '40HC - 40ft High Cube' },
  { value: '45HC', label: '45HC - 45ft High Cube' },
  { value: '20OT', label: '20OT - 20ft Open Top' },
  { value: '40OT', label: '40OT - 40ft Open Top' },
  { value: '20FR', label: '20FR - 20ft Flat Rack' },
  { value: '40FR', label: '40FR - 40ft Flat Rack' },
  { value: '20RF', label: '20RF - 20ft Reefer' },
  { value: '40RF', label: '40RF - 40ft Reefer' },
  { value: '20TK', label: '20TK - 20ft Tank' },
  { value: 'LCL', label: 'LCL - Less than Container Load' },
  { value: 'CURTAIN', label: 'Curtain Sider' },
  { value: 'BOX', label: 'Box Trailer' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'LOWBED', label: 'Lowbed' },
  { value: 'REEFER_TRAILER', label: 'Reefer Trailer' },
  { value: 'TANKER', label: 'Tanker' },
  { value: 'TIPPER', label: 'Tipper' },
];

const serviceTypeOptions = [
  { value: 'Sea Freight', label: 'Sea Freight' },
  { value: 'Air Freight', label: 'Air Freight' },
  { value: 'Road Transport', label: 'Road Transport' },
  { value: 'Rail Transport', label: 'Rail Transport' },
  { value: 'Customs Clearance', label: 'Customs Clearance' },
  { value: 'Warehousing', label: 'Warehousing' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Documentation', label: 'Documentation' },
  { value: 'Container Detention', label: 'Container Detention' },
  { value: 'Storage', label: 'Storage' },
];

interface ServicesWithLegsProps {
  equipmentId: string;
  containerId: string;
}

export function ServicesWithLegs({ equipmentId, containerId }: ServicesWithLegsProps) {
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([
    {
      id: '1',
      equipmentId: equipmentId,
      serviceType: 'Sea Freight',
      equipment: '40HC',
      invoiceParty: 'client1',
      agreedRate: '2450.00',
      serviceProvider: 'msc',
      agreedCost: '1850.00',
    },
    {
      id: '2',
      equipmentId: equipmentId,
      serviceType: 'Customs Clearance',
      equipment: '40HC',
      invoiceParty: 'client1',
      agreedRate: '350.00',
      serviceProvider: 'eagle',
      agreedCost: '250.00',
    },
    {
      id: '3',
      equipmentId: equipmentId,
      serviceType: 'Road Transport',
      equipment: 'CURTAIN',
      invoiceParty: 'client1',
      agreedRate: '650.00',
      serviceProvider: 'eagle',
      agreedCost: '450.00',
    },
  ]);

  const [expandedLegs, setExpandedLegs] = useState<{ [key: string]: boolean }>({
    'leg-1': true,
    'leg-2': false,
    'leg-3': false,
    'leg-4': false,
    'leg-5': false,
  });

  const toggleLeg = (legId: string) => {
    setExpandedLegs(prev => ({
      ...prev,
      [legId]: !prev[legId],
    }));
  };

  const handleAddRow = () => {
    const newRow: ServiceRow = {
      id: String(Date.now()),
      equipmentId: equipmentId,
      serviceType: '',
      equipment: '',
      invoiceParty: '',
      agreedRate: '',
      serviceProvider: '',
      agreedCost: '',
    };
    setServiceRows([...serviceRows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (serviceRows.length > 1) {
      setServiceRows(serviceRows.filter(r => r.id !== id));
    }
  };

  const handleUpdateRow = (id: string, field: keyof ServiceRow, value: string) => {
    setServiceRows(serviceRows.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  // Define legs for each service type
  const getLegsForService = (serviceType: string): Leg[] => {
    switch (serviceType) {
      case 'Sea Freight':
        return [
          {
            id: 'leg-1',
            legNumber: 1,
            mode: 'sea',
            origin: 'Shanghai, China',
            destination: 'Gioia Tauro, Italy',
            carrier: 'MSC',
            vesselVoyage: 'MSC ISTANBUL / GJ548W',
            etd: '15 Dec 2025',
            eta: '24 Dec 2025',
            passingPoints: [
              {
                id: 'pp-1-1',
                name: 'Gate In at Port',
                location: 'Shanghai Container Terminal',
                status: 'completed',
                actualDateTime: '10 Dec 2025, 08:30',
                dwellTime: '5 days',
              },
              {
                id: 'pp-1-2',
                name: 'Loaded on Vessel',
                location: 'Shanghai Port - Berth 12',
                status: 'completed',
                actualDateTime: '12 Dec 2025, 14:00',
              },
              {
                id: 'pp-1-3',
                name: 'Vessel Departure',
                location: 'Shanghai Port',
                status: 'completed',
                actualDateTime: '15 Dec 2025, 06:00',
                dwellTime: '9 days transit',
              },
              {
                id: 'pp-1-4',
                name: 'Vessel Arrival',
                location: 'Gioia Tauro Port',
                status: 'in-progress',
                estimatedDateTime: '24 Dec 2025, 14:00',
              },
              {
                id: 'pp-1-5',
                name: 'Discharged from Vessel',
                location: 'Gioia Tauro - Transshipment Hub',
                status: 'upcoming',
                estimatedDateTime: '24 Dec 2025, 18:00',
                dwellTime: '3 days',
              },
            ],
          },
          {
            id: 'leg-2',
            legNumber: 2,
            mode: 'sea',
            origin: 'Gioia Tauro, Italy',
            destination: 'Durres, Albania',
            carrier: 'MSC',
            vesselVoyage: 'MSC MEDITERRANEAN / GT432E',
            etd: '27 Dec 2025',
            eta: '1 Jan 2026',
            passingPoints: [
              {
                id: 'pp-2-1',
                name: 'Loaded on Feeder Vessel',
                location: 'Gioia Tauro Transshipment',
                status: 'upcoming',
                estimatedDateTime: '27 Dec 2025, 10:00',
              },
              {
                id: 'pp-2-2',
                name: 'Vessel Departure',
                location: 'Gioia Tauro Port',
                status: 'upcoming',
                estimatedDateTime: '27 Dec 2025, 18:00',
                dwellTime: '5 days transit',
              },
              {
                id: 'pp-2-3',
                name: 'Vessel Arrival at POD',
                location: 'Durres Port, Albania',
                status: 'upcoming',
                estimatedDateTime: '1 Jan 2026, 08:00',
              },
              {
                id: 'pp-2-4',
                name: 'Discharged at Final POD',
                location: 'Durres Container Terminal',
                status: 'upcoming',
                estimatedDateTime: '1 Jan 2026, 14:00',
                dwellTime: '1 day',
              },
            ],
          },
        ];

      case 'Customs Clearance':
        return [
          {
            id: 'leg-3',
            legNumber: 3,
            mode: 'customs',
            origin: 'Durres Port',
            destination: 'Durres Customs Office',
            carrier: 'Eagle Logistics',
            passingPoints: [
              {
                id: 'pp-3-1',
                name: 'Container Available for Pickup',
                location: 'Durres Container Yard',
                status: 'upcoming',
                estimatedDateTime: '2 Jan 2026, 08:00',
              },
              {
                id: 'pp-3-2',
                name: 'Customs Declaration Submitted',
                location: 'Durres Customs Office',
                status: 'upcoming',
                estimatedDateTime: '2 Jan 2026, 10:00',
                notes: 'Bill of Lading, Invoice, Packing List submitted',
              },
              {
                id: 'pp-3-3',
                name: 'Customs Inspection',
                location: 'Inspection Area - Durres',
                status: 'upcoming',
                estimatedDateTime: '2 Jan 2026, 14:00',
                dwellTime: '4 hours',
              },
              {
                id: 'pp-3-4',
                name: 'Customs Released',
                location: 'Durres Customs',
                status: 'upcoming',
                estimatedDateTime: '2 Jan 2026, 18:00',
              },
              {
                id: 'pp-3-5',
                name: 'T2 Transit Document Issued',
                location: 'Border Control Office',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 09:00',
                notes: 'Required for Albania-Kosovo transit',
              },
            ],
          },
        ];

      case 'Road Transport':
        return [
          {
            id: 'leg-4',
            legNumber: 4,
            mode: 'truck',
            origin: 'Durres, Albania',
            destination: 'Pristina, Kosovo',
            carrier: 'Eagle Trucking',
            truckPlate: 'AL-456-TK',
            etd: '3 Jan 2026, 10:00',
            eta: '3 Jan 2026, 17:00',
            passingPoints: [
              {
                id: 'pp-4-1',
                name: 'Picked Up from Port',
                location: 'Durres Port Gate',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 10:00',
                notes: 'Driver: John Smith, Truck: Curtain Sider',
              },
              {
                id: 'pp-4-2',
                name: 'Departed Durres',
                location: 'Durres City Exit',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 10:30',
              },
              {
                id: 'pp-4-3',
                name: 'Checkpoint - Tirana',
                location: 'Tirana Bypass',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 11:30',
                dwellTime: '15 min rest',
              },
              {
                id: 'pp-4-4',
                name: 'Albania-Kosovo Border',
                location: 'Morina Border Crossing',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 14:00',
                dwellTime: '1 hour',
                notes: 'T2 document check, truck inspection',
              },
              {
                id: 'pp-4-5',
                name: 'Entered Kosovo',
                location: 'Morina, Kosovo Side',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 15:00',
              },
              {
                id: 'pp-4-6',
                name: 'Arrived at Destination',
                location: 'Pristina Industrial Zone',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 17:00',
              },
              {
                id: 'pp-4-7',
                name: 'Container Unloaded',
                location: 'Client Warehouse - Pristina',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 17:30',
                dwellTime: '2 hours',
                notes: 'Cargo unloading and inspection',
              },
            ],
          },
          {
            id: 'leg-5',
            legNumber: 5,
            mode: 'truck',
            origin: 'Pristina, Kosovo',
            destination: 'Durres Empty Depot, Albania',
            carrier: 'Eagle Trucking',
            truckPlate: 'AL-456-TK',
            etd: '3 Jan 2026, 19:30',
            eta: '4 Jan 2026, 01:00',
            passingPoints: [
              {
                id: 'pp-5-1',
                name: 'Empty Container Departure',
                location: 'Pristina Warehouse',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 19:30',
              },
              {
                id: 'pp-5-2',
                name: 'Kosovo-Albania Border',
                location: 'Morina Border',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 22:00',
                dwellTime: '45 min',
              },
              {
                id: 'pp-5-3',
                name: 'Entered Albania',
                location: 'Morina, Albania Side',
                status: 'upcoming',
                estimatedDateTime: '3 Jan 2026, 22:45',
              },
              {
                id: 'pp-5-4',
                name: 'Arrived at Empty Depot',
                location: 'Durres Empty Container Depot',
                status: 'upcoming',
                estimatedDateTime: '4 Jan 2026, 01:00',
              },
              {
                id: 'pp-5-5',
                name: 'Empty Return Confirmed',
                location: 'MSC Depot - Durres',
                status: 'upcoming',
                estimatedDateTime: '4 Jan 2026, 08:00',
                notes: 'Container returned to carrier',
              },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const getStatusColor = (status: PassingPoint['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      case 'upcoming':
        return 'text-gray-400 bg-gray-50';
    }
  };

  const getStatusIcon = (status: PassingPoint['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'in-progress':
        return <Clock className="w-3 h-3 animate-pulse" />;
      case 'upcoming':
        return <Clock className="w-3 h-3" />;
    }
  };

  const getModeIcon = (mode: Leg['mode']) => {
    switch (mode) {
      case 'sea':
        return Ship;
      case 'truck':
        return Truck;
      case 'rail':
        return Train;
      case 'air':
        return Plane;
      case 'customs':
        return CheckCircle2;
    }
  };

  const renderLeg = (leg: Leg) => {
    const isExpanded = expandedLegs[leg.id];
    const completedPoints = leg.passingPoints.filter(p => p.status === 'completed').length;
    const hasInProgress = leg.passingPoints.some(p => p.status === 'in-progress');
    const allCompleted = leg.passingPoints.every(p => p.status === 'completed');

    const legColor = allCompleted 
      ? 'bg-green-50 border-green-300' 
      : hasInProgress 
      ? 'bg-blue-50 border-blue-300' 
      : 'bg-gray-50 border-gray-300';

    const ModeIcon = getModeIcon(leg.mode);

    return (
      <tr key={leg.id}>
        <td colSpan={8} className="px-0 py-0">
          <div className={`border-y ${legColor}`}>
            {/* Leg Header */}
            <button
              onClick={() => toggleLeg(leg.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <ModeIcon className="w-4 h-4 text-gray-700" />
                  <span className="text-xs text-gray-900">
                    Leg {leg.legNumber}: {leg.origin} → {leg.destination}
                  </span>
                </div>
                {leg.carrier && (
                  <span className="text-xs text-gray-600">
                    • {leg.carrier}
                  </span>
                )}
                {leg.vesselVoyage && (
                  <span className="text-xs text-gray-600">
                    • {leg.vesselVoyage}
                  </span>
                )}
                {leg.truckPlate && (
                  <span className="text-xs text-gray-600">
                    • Truck: {leg.truckPlate}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  • {completedPoints}/{leg.passingPoints.length} points
                </span>
              </div>
              <div className="flex items-center gap-2">
                {leg.etd && leg.eta && (
                  <span className="text-xs text-gray-600">
                    {leg.etd} → {leg.eta}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </div>
            </button>

            {/* Passing Points */}
            {isExpanded && (
              <div className="px-6 pb-3 bg-white border-t border-gray-200">
                <div className="py-2 text-xs text-gray-500">Passing Points:</div>
                <div className="space-y-0">
                  {leg.passingPoints.map((point, index) => {
                    const isLast = index === leg.passingPoints.length - 1;

                    return (
                      <div key={point.id} className="relative">
                        {/* Connecting Line */}
                        {!isLast && (
                          <div
                            className={`absolute left-[15px] top-[28px] w-0.5 h-[calc(100%+4px)] ${
                              point.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          ></div>
                        )}

                        {/* Passing Point Row */}
                        <div className="flex gap-2 pb-2">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(
                              point.status
                            )} relative z-10 border-2 border-white`}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 pt-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="text-xs text-gray-900">{point.name}</h4>
                                <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  <span>{point.location}</span>
                                </div>
                              </div>
                              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(point.status)}`}>
                                {getStatusIcon(point.status)}
                              </div>
                            </div>

                            {/* Point Details */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600 mt-1.5">
                              {point.actualDateTime && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-green-600" />
                                  <span>Actual: {point.actualDateTime}</span>
                                </div>
                              )}
                              {point.estimatedDateTime && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-blue-600" />
                                  <span>Est: {point.estimatedDateTime}</span>
                                </div>
                              )}
                              {point.dwellTime && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{point.dwellTime}</span>
                                </div>
                              )}
                              {point.notes && (
                                <div className="col-span-2 text-xs text-gray-500 italic mt-0.5">
                                  {point.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="border-t border-gray-200">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-1.5 text-left text-xs text-gray-600 uppercase tracking-wider border-r border-gray-200">
              Equipment ID
            </th>
            <th className="px-3 py-1.5 text-left text-xs text-gray-600 uppercase tracking-wider border-r border-gray-200">
              Service Type
            </th>
            <th className="px-3 py-1.5 text-left text-xs text-gray-600 uppercase tracking-wider border-r border-gray-200">
              Equipment
            </th>
            <th className="px-3 py-1.5 text-left text-xs text-gray-600 uppercase tracking-wider border-r border-gray-200">
              Invoice Party
            </th>
            <th className="px-3 py-1.5 text-right text-xs text-gray-600 uppercase tracking-wider border-r border-gray-200">
              Agreed Rate
            </th>
            <th className="px-3 py-1.5 text-left text-xs text-gray-600 uppercase tracking-wider border-r border-gray-200">
              Supplier
            </th>
            <th className="px-3 py-1.5 text-right text-xs text-gray-600 uppercase tracking-wider border-r border-gray-200">
              Agreed Cost
            </th>
            <th className="px-3 py-1.5 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {serviceRows.map((serviceRow, idx) => {
            const legs = getLegsForService(serviceRow.serviceType);
            
            return (
              <ReactFragment key={serviceRow.id}>
                {/* Service Row */}
                <tr className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`}>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    <input
                      type="text"
                      value={serviceRow.equipmentId}
                      onChange={(e) => handleUpdateRow(serviceRow.id, 'equipmentId', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="Enter equipment ID"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    <select
                      value={serviceRow.serviceType}
                      onChange={(e) => handleUpdateRow(serviceRow.id, 'serviceType', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Service Type...</option>
                      {serviceTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    <select
                      value={serviceRow.equipment}
                      onChange={(e) => handleUpdateRow(serviceRow.id, 'equipment', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Equipment...</option>
                      {equipmentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    <select
                      value={serviceRow.invoiceParty}
                      onChange={(e) => handleUpdateRow(serviceRow.id, 'invoiceParty', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Invoice Party...</option>
                      <option value="client1">ABC Trading Co.</option>
                      <option value="client2">Global Import Export Ltd</option>
                      <option value="client3">Balkan Distribution GmbH</option>
                      <option value="client4">Mediterranean Traders SA</option>
                      <option value="client5">Adriatic Logistics LLC</option>
                    </select>
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    <input
                      type="number"
                      value={serviceRow.agreedRate}
                      onChange={(e) => handleUpdateRow(serviceRow.id, 'agreedRate', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white tabular-nums"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    <select
                      value={serviceRow.serviceProvider}
                      onChange={(e) => handleUpdateRow(serviceRow.id, 'serviceProvider', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Supplier...</option>
                      <option value="maersk">MAERSK LINE</option>
                      <option value="msc">MSC</option>
                      <option value="cma">CMA CGM</option>
                      <option value="cosco">COSCO SHIPPING</option>
                      <option value="hapag">HAPAG-LLOYD</option>
                      <option value="evergreen">EVERGREEN LINE</option>
                      <option value="eagle">Eagle Trucking</option>
                      <option value="dhl">DHL Express</option>
                      <option value="fedex">FedEx</option>
                    </select>
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-200">
                    <input
                      type="number"
                      value={serviceRow.agreedCost}
                      onChange={(e) => handleUpdateRow(serviceRow.id, 'agreedCost', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white tabular-nums"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => handleDeleteRow(serviceRow.id)}
                      disabled={serviceRows.length === 1}
                      className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>

                {/* Legs for this service */}
                {legs.map(leg => renderLeg(leg))}
              </ReactFragment>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Service
        </button>
      </div>
    </div>
  );
}