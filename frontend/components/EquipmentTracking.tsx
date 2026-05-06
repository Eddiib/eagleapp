import { Ship, Truck, CheckCircle2, Clock, MapPin, Calendar } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  date?: string;
  dwellTime?: string;
  vesselInfo?: {
    name: string;
    voyage: string;
    etd?: string;
    eta?: string;
    transitDays?: number;
  };
  location?: string;
  icon: 'ship' | 'truck' | 'checkpoint' | 'location';
}

interface EquipmentTrackingProps {
  containerId: string;
  equipmentType: string;
}

export function EquipmentTracking({ containerId, equipmentType }: EquipmentTrackingProps) {
  // Equipment-specific tracking milestones
  const milestones: Milestone[] = [
    {
      id: '1',
      title: 'Pick Up Empty (Depot)',
      status: 'completed',
      date: '10 Oct 2023, 08:30',
      dwellTime: '12h dwell',
      location: 'Shanghai Container Terminal',
      icon: 'checkpoint',
    },
    {
      id: '2',
      title: 'Return at CY (Cut-off)',
      status: 'completed',
      date: '10 Oct 2023, 20:45',
      dwellTime: '2 days',
      location: 'Shanghai Port - Gate 5',
      icon: 'location',
    },
    {
      id: '3',
      title: 'Loaded on Vessel',
      status: 'in-progress',
      dwellTime: '9 days (sea transit)',
      vesselInfo: {
        name: 'MSC ISTANBUL',
        voyage: 'GJ548W',
        etd: '15 Dec 2025',
        transitDays: 9,
      },
      location: 'Shanghai Port',
      icon: 'ship',
    },
    {
      id: '4',
      title: 'Transshipment – Gioia Tauro',
      status: 'upcoming',
      dwellTime: '3 days',
      location: 'Gioia Tauro Port, Italy',
      icon: 'location',
    },
    {
      id: '5',
      title: 'Discharged at Final POD',
      status: 'upcoming',
      vesselInfo: {
        name: '',
        voyage: '',
        eta: '1 Feb 2026',
      },
      location: 'Durres Port, Albania',
      icon: 'ship',
    },
    {
      id: '6',
      title: 'Customs Clearance',
      status: 'upcoming',
      dwellTime: '1 day',
      location: 'Durres Customs Office',
      icon: 'checkpoint',
    },
    {
      id: '7',
      title: 'T2 Transit',
      status: 'upcoming',
      dwellTime: '6h',
      location: 'Border Control',
      icon: 'checkpoint',
    },
    {
      id: '8',
      title: 'Road Transport (Curtain Sider)',
      description: 'Tracking starts here',
      status: 'upcoming',
      dwellTime: '5h',
      location: 'Final Destination',
      icon: 'truck',
    },
    {
      id: '9',
      title: 'Empty Return to Depot',
      status: 'upcoming',
      location: 'Container Depot',
      icon: 'location',
    },
  ];

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'upcoming':
        return 'text-gray-400 bg-gray-100';
    }
  };

  const getIconComponent = (icon: Milestone['icon']) => {
    switch (icon) {
      case 'ship':
        return Ship;
      case 'truck':
        return Truck;
      case 'checkpoint':
        return CheckCircle2;
      case 'location':
        return MapPin;
    }
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'in-progress':
        return <Clock className="w-3.5 h-3.5 animate-pulse" />;
      case 'upcoming':
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="p-4 bg-gray-50">
      {/* Equipment Info Header */}
      <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Container ID</div>
            <div className="text-gray-900">{containerId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Equipment Type</div>
            <div className="text-gray-900">{equipmentType}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Current Status</div>
            <div className="flex items-center gap-1.5 text-blue-600">
              <Ship className="w-4 h-4" />
              <span>In Transit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Timeline */}
      <div className="space-y-0 bg-white border border-gray-200 rounded-lg p-4">
        {milestones.map((milestone, index) => {
          const IconComponent = getIconComponent(milestone.icon);
          const isLast = index === milestones.length - 1;

          return (
            <div key={milestone.id} className="relative">
              {/* Connecting Line */}
              {!isLast && (
                <div
                  className={`absolute left-[19px] top-[40px] w-0.5 h-[calc(100%+4px)] ${
                    milestone.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                ></div>
              )}

              {/* Milestone Row */}
              <div className="flex gap-3 pb-4">
                {/* Icon Circle */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(
                    milestone.status
                  )} relative z-10`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1">
                      <h4 className="text-sm text-gray-900">
                        {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className="text-xs text-gray-600 italic mt-0.5">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                        milestone.status
                      )}`}
                    >
                      {getStatusIcon(milestone.status)}
                      <span className="capitalize">{milestone.status.replace('-', ' ')}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                    {milestone.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{milestone.location}</span>
                      </div>
                    )}

                    {milestone.date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{milestone.date}</span>
                      </div>
                    )}

                    {milestone.dwellTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{milestone.dwellTime}</span>
                      </div>
                    )}

                    {milestone.vesselInfo && (
                      <>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <Ship className="w-3.5 h-3.5" />
                          <span>
                            {milestone.vesselInfo.name}
                            {milestone.vesselInfo.voyage && ` / ${milestone.vesselInfo.voyage}`}
                          </span>
                        </div>

                        {milestone.vesselInfo.etd && (
                          <div className="text-xs text-gray-500">
                            ETD: {milestone.vesselInfo.etd}
                          </div>
                        )}

                        {milestone.vesselInfo.eta && (
                          <div className="text-xs text-gray-500">
                            ETA: {milestone.vesselInfo.eta}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
