import { Ship, Truck, CheckCircle2, Clock, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

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

interface TrackingSection {
  id: string;
  title: string;
  milestones: Milestone[];
}

interface ServiceWithTrackingProps {
  containerId: string;
  equipmentType: string;
}

export function ServiceWithTracking({ containerId, equipmentType }: ServiceWithTrackingProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'sea-freight': true,
    'customs-inland': false,
    'road-transport': false,
    'empty-return': false,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Define tracking sections based on service flow
  const trackingSections: TrackingSection[] = [
    {
      id: 'sea-freight',
      title: 'Ocean Freight Movement',
      milestones: [
        {
          id: '1',
          title: 'Loaded on Vessel',
          status: 'completed',
          date: '12 Dec 2025, 14:00',
          dwellTime: '9 days (sea transit)',
          vesselInfo: {
            name: 'MSC ISTANBUL',
            voyage: 'GJ548W',
            etd: '15 Dec 2025',
            transitDays: 9,
          },
          location: 'Shanghai Port, China',
          icon: 'ship',
        },
        {
          id: '2',
          title: 'Vessel Departure',
          status: 'completed',
          date: '15 Dec 2025, 06:00',
          location: 'Shanghai Port',
          icon: 'ship',
        },
        {
          id: '3',
          title: 'Transshipment – Gioia Tauro',
          status: 'in-progress',
          dwellTime: '3 days',
          vesselInfo: {
            name: 'MSC MEDITERRANEAN',
            voyage: 'GT432E',
            eta: '24 Dec 2025',
          },
          location: 'Gioia Tauro Port, Italy',
          icon: 'location',
        },
        {
          id: '4',
          title: 'Vessel Arrival at Final POD',
          status: 'upcoming',
          vesselInfo: {
            name: '',
            voyage: '',
            eta: '1 Jan 2026',
          },
          location: 'Durres Port, Albania',
          icon: 'ship',
        },
        {
          id: '5',
          title: 'Discharged from Vessel',
          status: 'upcoming',
          dwellTime: '12h',
          location: 'Durres Port',
          icon: 'checkpoint',
        },
      ],
    },
    {
      id: 'customs-inland',
      title: 'Customs & Inland Procedures',
      milestones: [
        {
          id: '6',
          title: 'Container at Port Terminal',
          status: 'upcoming',
          dwellTime: '1 day',
          location: 'Durres Container Terminal',
          icon: 'location',
        },
        {
          id: '7',
          title: 'Customs Clearance Started',
          status: 'upcoming',
          location: 'Durres Customs Office',
          icon: 'checkpoint',
        },
        {
          id: '8',
          title: 'Customs Released',
          status: 'upcoming',
          dwellTime: '6h',
          location: 'Durres Customs',
          icon: 'checkpoint',
        },
        {
          id: '9',
          title: 'T2 Transit Document Issued',
          status: 'upcoming',
          location: 'Border Control',
          icon: 'checkpoint',
        },
      ],
    },
    {
      id: 'road-transport',
      title: 'Road Transport & Delivery',
      milestones: [
        {
          id: '10',
          title: 'Picked Up from Port',
          status: 'upcoming',
          date: 'TBD',
          location: 'Durres Port Gate',
          icon: 'truck',
        },
        {
          id: '11',
          title: 'Road Transport Started',
          description: 'Curtain Sider Truck - Tracking Active',
          status: 'upcoming',
          dwellTime: '5h (estimated)',
          vesselInfo: {
            name: 'Eagle Trucking Fleet #A457',
            voyage: 'Route: Durres → Tirana → Pristina',
          },
          location: 'En Route',
          icon: 'truck',
        },
        {
          id: '12',
          title: 'Border Crossing',
          status: 'upcoming',
          location: 'Albania-Kosovo Border',
          icon: 'checkpoint',
        },
        {
          id: '13',
          title: 'Arrived at Final Destination',
          status: 'upcoming',
          location: 'Pristina Warehouse, Kosovo',
          icon: 'location',
        },
        {
          id: '14',
          title: 'Container Unloaded',
          status: 'upcoming',
          dwellTime: '2h',
          location: 'Client Warehouse',
          icon: 'checkpoint',
        },
      ],
    },
    {
      id: 'empty-return',
      title: 'Empty Container Return',
      milestones: [
        {
          id: '15',
          title: 'Empty Container Departure',
          status: 'upcoming',
          location: 'Pristina Warehouse',
          icon: 'truck',
        },
        {
          id: '16',
          title: 'Return Transport to Port',
          status: 'upcoming',
          dwellTime: '5h',
          location: 'En Route to Durres',
          icon: 'truck',
        },
        {
          id: '17',
          title: 'Empty Return at Port',
          status: 'upcoming',
          location: 'Durres Empty Container Depot',
          icon: 'location',
        },
        {
          id: '18',
          title: 'Container Returned to Carrier',
          status: 'upcoming',
          location: 'MSC Depot - Durres',
          icon: 'checkpoint',
        },
      ],
    },
  ];

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/30';
      case 'in-progress':
        return 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30';
      case 'upcoming':
        return 'text-gray-400 dark:text-gray-400 bg-gray-50 dark:bg-[#262626]';
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
        return <CheckCircle2 className="w-3 h-3" />;
      case 'in-progress':
        return <Clock className="w-3 h-3 animate-pulse" />;
      case 'upcoming':
        return <Clock className="w-3 h-3" />;
    }
  };

  const getSectionStatusColor = (milestones: Milestone[]) => {
    const hasInProgress = milestones.some(m => m.status === 'in-progress');
    const allCompleted = milestones.every(m => m.status === 'completed');
    
    if (allCompleted) return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    if (hasInProgress) return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';
    return 'bg-gray-100 dark:bg-[#262626] border-gray-300 dark:border-gray-600';
  };

  return (
    <div className="space-y-3">
      {trackingSections.map((section) => {
        const isExpanded = expandedSections[section.id];

        return (
          <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 ${getSectionStatusColor(
                section.milestones
              )} hover:opacity-80 transition-opacity`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900 dark:text-gray-100">{section.title}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  ({section.milestones.filter(m => m.status === 'completed').length}/
                  {section.milestones.length} completed)
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="bg-white dark:bg-[#1E1E1E] p-4">
                <div className="space-y-0">
                  {section.milestones.map((milestone, index) => {
                    const IconComponent = getIconComponent(milestone.icon);
                    const isLast = index === section.milestones.length - 1;

                    return (
                      <div key={milestone.id} className="relative">
                        {/* Connecting Line */}
                        {!isLast && (
                          <div
                            className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%+4px)] ${
                              milestone.status === 'completed'
                                ? 'bg-green-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          ></div>
                        )}

                        {/* Milestone Row */}
                        <div className="flex gap-2.5 pb-3">
                          {/* Icon Circle */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(
                              milestone.status
                            )} relative z-10`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1">
                                <h4 className="text-xs text-gray-900 dark:text-gray-100">
                                  {milestone.title}
                                </h4>
                                {milestone.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-0.5">
                                    {milestone.description}
                                  </p>
                                )}
                              </div>
                              <div
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(
                                  milestone.status
                                )}`}
                              >
                                {getStatusIcon(milestone.status)}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                              {milestone.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3 h-3" />
                                  <span>{milestone.location}</span>
                                </div>
                              )}

                              {milestone.date && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  <span>{milestone.date}</span>
                                </div>
                              )}

                              {milestone.dwellTime && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{milestone.dwellTime}</span>
                                </div>
                              )}

                              {milestone.vesselInfo && (
                                <div className="flex items-center gap-1.5">
                                  <Ship className="w-3 h-3" />
                                  <span>
                                    {milestone.vesselInfo.name}
                                    {milestone.vesselInfo.voyage &&
                                      ` / ${milestone.vesselInfo.voyage}`}
                                  </span>
                                </div>
                              )}

                              {milestone.vesselInfo?.etd && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                                  ETD: {milestone.vesselInfo.etd}
                                </div>
                              )}

                              {milestone.vesselInfo?.eta && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                                  ETA: {milestone.vesselInfo.eta}
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
        );
      })}
    </div>
  );
}