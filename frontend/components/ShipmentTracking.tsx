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

interface ServiceChain {
  id: string;
  title: string;
  milestones: Milestone[];
}

export function ShipmentTracking() {
  const serviceChains: ServiceChain[] = [
    {
      id: 'ocean-freight',
      title: 'Ocean Freight Service Chain',
      milestones: [
        {
          id: '1',
          title: 'Pick Up Empty (Depot)',
          status: 'completed',
          dwellTime: '12h dwell',
          icon: 'checkpoint',
        },
        {
          id: '2',
          title: 'Return at CY (Cut-off)',
          status: 'completed',
          dwellTime: '2 days',
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
          icon: 'ship',
        },
        {
          id: '4',
          title: 'Transshipment – Gioia Tauro',
          status: 'upcoming',
          dwellTime: '3 days',
          location: 'Gioia Tauro',
          icon: 'location',
        },
        {
          id: '5',
          title: 'Discharged at Final POD – Durres',
          status: 'upcoming',
          vesselInfo: {
            name: '',
            voyage: '',
            eta: '1 Feb 2026',
          },
          location: 'Durres',
          icon: 'ship',
        },
      ],
    },
    {
      id: 'inland-transport',
      title: 'Inland Transport Service Chain',
      milestones: [
        {
          id: '6',
          title: 'Customs Clearance',
          status: 'upcoming',
          dwellTime: '1 day',
          icon: 'checkpoint',
        },
        {
          id: '7',
          title: 'T2 Transit',
          status: 'upcoming',
          dwellTime: '6h',
          icon: 'checkpoint',
        },
        {
          id: '8',
          title: 'Road Transport (Curtain Sider)',
          description: 'Tracking starts here',
          status: 'upcoming',
          dwellTime: '5h',
          icon: 'truck',
        },
        {
          id: '9',
          title: 'Empty Return to Depot',
          status: 'upcoming',
          icon: 'location',
        },
      ],
    },
  ];

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'upcoming':
        return 'text-gray-400 bg-gray-100 dark:text-gray-500 dark:bg-gray-800';
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
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 animate-pulse" />;
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {serviceChains.map((chain, chainIndex) => (
        <div key={chain.id} className="space-y-4">
          {/* Service Chain Header */}
          <div className="flex items-center gap-3">
            {chainIndex > 0 && (
              <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
            )}
            <h2 className="text-lg text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {chain.title}
            </h2>
            <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {chain.milestones.map((milestone, index) => {
              const IconComponent = getIconComponent(milestone.icon);
              const isLast = index === chain.milestones.length - 1;

              return (
                <div key={milestone.id} className="relative">
                  {/* Connecting Line */}
                  {!isLast && (
                    <div
                      className={`absolute left-[23px] top-[48px] w-0.5 h-[calc(100%+8px)] ${
                        milestone.status === 'completed'
                          ? 'bg-green-500 dark:bg-green-600'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    ></div>
                  )}

                  {/* Milestone Card */}
                  <div className="flex gap-4 pb-8">
                    {/* Icon Circle */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(
                        milestone.status
                      )} relative z-10`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="text-gray-900 dark:text-gray-100 mb-1">
                              {milestone.title}
                            </h3>
                            {milestone.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${getStatusColor(
                              milestone.status
                            )}`}
                          >
                            {getStatusIcon(milestone.status)}
                            <span className="capitalize">{milestone.status.replace('-', ' ')}</span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Location */}
                          {milestone.location && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span>{milestone.location}</span>
                            </div>
                          )}

                          {/* Dwell Time */}
                          {milestone.dwellTime && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>{milestone.dwellTime}</span>
                            </div>
                          )}

                          {/* Vessel Info */}
                          {milestone.vesselInfo && (
                            <>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Ship className="w-4 h-4" />
                                <span>
                                  {milestone.vesselInfo.name}
                                  {milestone.vesselInfo.voyage && ` / ${milestone.vesselInfo.voyage}`}
                                </span>
                              </div>

                              {milestone.vesselInfo.etd && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Calendar className="w-4 h-4" />
                                  <span>ETD: {milestone.vesselInfo.etd}</span>
                                </div>
                              )}

                              {milestone.vesselInfo.eta && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Calendar className="w-4 h-4" />
                                  <span>ETA: {milestone.vesselInfo.eta}</span>
                                </div>
                              )}

                              {milestone.vesselInfo.transitDays && (
                                <div className="text-gray-500 dark:text-gray-500 col-span-2">
                                  Transit: {milestone.vesselInfo.transitDays} days
                                </div>
                              )}
                            </>
                          )}

                          {/* Date */}
                          {milestone.date && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>{milestone.date}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
