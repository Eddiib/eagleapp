import { useState } from 'react';
import { SalesLead, SalesLeadMeetingMinute, LeadRanking } from './SalesLeads';
import { SalesLeadMeetingPanel } from './SalesLeadMeetingPanel';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Calendar,
  FileText,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  AlertTriangle,
  X,
} from 'lucide-react';
import { getCountryName } from '../data/countries';

interface SalesLeadDetailProps {
  lead: SalesLead;
  meetingMinutes: SalesLeadMeetingMinute[];
  onBack: () => void;
  onCreateBookingFromLead?: (leadData: any) => void;
  onSaveMeetingMinute: (leadId: string, meeting: Omit<SalesLeadMeetingMinute, 'id' | 'createdAt' | 'createdBy'>) => Promise<void> | void;
}

export function SalesLeadDetail({ 
  lead, 
  meetingMinutes,
  onBack,
  onCreateBookingFromLead,
  onSaveMeetingMinute
}: SalesLeadDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showMeetingPanel, setShowMeetingPanel] = useState(false);
  const [stagedMessage, setStagedMessage] = useState<string | null>(null);

  const getRankingColor = (ranking: LeadRanking) => {
    switch (ranking) {
      case 'High':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'Medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Low':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
  };

  const getRankingIcon = (ranking: LeadRanking) => {
    switch (ranking) {
      case 'High':
        return <TrendingUp className="w-4 h-4" />;
      case 'Medium':
        return <Minus className="w-4 h-4" />;
      case 'Low':
        return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
  };

  const handleContactLead = () => {
    setShowMeetingPanel(true);
  };

  const handleQuoteLead = () => {
    setStagedMessage(
      `Lead-to-quotation conversion for ${lead.clientName} is staged. Use the Quotation Desk directly until this workflow has a persisted handoff.`
    );
  };

  const handleBookLead = () => {
    if (onCreateBookingFromLead) {
      onCreateBookingFromLead({
        partnerId: lead.partnerId,
        clientId: lead.partnerId,
        businessName: lead.clientName,
        clientName: lead.clientName,
        contactPerson: lead.contactPerson,
        city: lead.city,
        country: lead.country,
        salesAgent: lead.assignedSalesAgent,
        leadId: lead.leadId,
        sourceSalesLeadId: lead.id,
      });
    } else {
      setStagedMessage(
        `Lead-to-booking conversion for ${lead.clientName} is unavailable in this context. Open Sales Leads from the main app shell to use the live booking handoff.`
      );
    }
  };

  const handleSaveMeeting = async (meeting: Omit<SalesLeadMeetingMinute, 'id' | 'createdAt' | 'createdBy'>) => {
    await onSaveMeetingMinute(lead.id, meeting);
    setShowMeetingPanel(false);
  };

  const getAgentInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Sort meetings by date (most recent first)
  const sortedMeetings = [...meetingMinutes].sort((a, b) => 
    new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        {stagedMessage && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{stagedMessage}</span>
            </div>
            <button
              onClick={() => setStagedMessage(null)}
              className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
              aria-label="Dismiss staged workflow notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Button>
            <div>
              <h1 className="text-gray-900 dark:text-white">{lead.clientName}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Lead ID: {lead.leadId} • Partner Code: {lead.partnerCode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getRankingColor(lead.leadRanking) + ' flex items-center gap-1'}>
              {getRankingIcon(lead.leadRanking)}
              {lead.leadRanking} Priority
            </Badge>
            <Badge className={getStatusColor(lead.partnerStatus)}>
              {lead.partnerStatus}
            </Badge>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleContactLead}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Phone className="w-4 h-4" />
            Contact
          </Button>
          <Button
            onClick={handleQuoteLead}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <FileText className="w-4 h-4" />
            Create Quotation
          </Button>
          <Button
            onClick={handleBookLead}
            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Package className="w-4 h-4" />
            Create Booking
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="meetings">
              Meeting Minutes ({meetingMinutes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Company Name</div>
                    <div className="text-gray-900 dark:text-white">{lead.clientName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {lead.city}, {getCountryName(lead.country)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                    <div className="text-gray-900 dark:text-white">{lead.email || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </div>
                    <div className="text-gray-900 dark:text-white">{lead.phone || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Agent */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Assigned Sales Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                      {getAgentInitials(lead.assignedSalesAgent)}
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white">{lead.assignedSalesAgent}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Sales Executive</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Auto-assigned from HR → Employees (Sales Person)
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferred Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferred Trades / Main Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lead.preferredTrades.map(trade => (
                      <Badge key={trade} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                        {trade}
                      </Badge>
                    ))}
                    {lead.preferredTrades.length === 0 && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">No trades specified</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Lead Ranking</div>
                    <Badge className={getRankingColor(lead.leadRanking) + ' flex items-center gap-1'}>
                      {getRankingIcon(lead.leadRanking)}
                      {lead.leadRanking}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Meeting Minutes</div>
                    <div className="text-gray-900 dark:text-white">{lead.meetingMinutesCount}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Quotations</div>
                    <div className="text-gray-900 dark:text-white">{lead.quotationCount}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Bookings</div>
                    <div className="text-gray-900 dark:text-white">{lead.bookingCount}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Last Contacted
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {lead.lastContactDate || 'Never'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Meeting Minutes Timeline
                  </CardTitle>
                  <Button
                    onClick={handleContactLead}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Phone className="w-4 h-4" />
                    Add Meeting
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sortedMeetings.length > 0 ? (
                  <div className="space-y-4">
                    {sortedMeetings.map((meeting, index) => (
                      <div
                        key={meeting.id}
                        className={`p-4 rounded-lg border ${
                          index === 0
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs">
                              {getAgentInitials(meeting.salesAgent)}
                            </div>
                            <div>
                              <div className="text-gray-900 dark:text-white">{meeting.salesAgent}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {meeting.meetingDate} at {meeting.meetingTime}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            {meeting.contactType}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <div className="text-sm text-gray-900 dark:text-white mb-2">
                            {meeting.summary}
                          </div>
                          {meeting.clientNeeds && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Client Needs:</span> {meeting.clientNeeds}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                              Next: {meeting.nextAction}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Due: {meeting.nextActionDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-gray-900 dark:text-white mb-2">No meeting minutes yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      Start by adding your first meeting or contact log
                    </p>
                    <Button
                      onClick={handleContactLead}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Phone className="w-4 h-4" />
                      Add First Meeting
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Meeting Panel */}
      {showMeetingPanel && (
        <SalesLeadMeetingPanel
          lead={lead}
          onClose={() => setShowMeetingPanel(false)}
          onSave={handleSaveMeeting}
        />
      )}
    </div>
  );
}
