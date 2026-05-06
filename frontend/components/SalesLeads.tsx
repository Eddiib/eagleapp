import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { SalesLeadsList } from './SalesLeadsList';
import { SalesLeadDetail } from './SalesLeadDetail';
import { Employee } from './EmployeesModule';
import { usePartners } from '../hooks/usePartners';
import { employeesApi } from '../services/employees';
import {
  SalesLead as SalesLeadModel,
  SalesLeadMeetingMinute as SalesLeadMeetingMinuteModel,
  salesLeadsApi,
} from '../services/salesLeads';

export type {
  SalesLead,
  SalesLeadMeetingMinute,
  LeadStatus,
  LeadRanking,
  LeadSource,
  ContactType,
  NextAction,
} from '../services/salesLeads';

type ViewMode = 'list' | 'detail';

interface SalesLeadsProps {
  onCreateBookingFromLead?: (leadData: any) => void;
}

export function SalesLeads({ onCreateBookingFromLead }: SalesLeadsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [salesEmployees, setSalesEmployees] = useState<Employee[]>([]);
  const [salesLeads, setSalesLeads] = useState<SalesLeadModel[]>([]);
  const [meetingMinutesByLead, setMeetingMinutesByLead] = useState<Record<string, SalesLeadMeetingMinuteModel[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { partners: allPartners, loading: partnersLoading } = usePartners();

  const CLIENT_TYPES = ['Client', 'Buyer'];
  const clientPartnerIds = useMemo(
    () =>
      allPartners
        .filter(
          (partner) =>
            partner.status === 'Active' &&
            (CLIENT_TYPES.includes(partner.partnerType) || CLIENT_TYPES.includes(partner.partnerCategory ?? ''))
        )
        .map((partner) => partner.id),
    [allPartners]
  );

  useEffect(() => {
    let ignore = false;

    employeesApi
      .getAll()
      .then((list) => {
        if (ignore) return;
        setSalesEmployees(list.filter((employee) => employee.isSalesPerson && employee.isActive));
      })
      .catch(() => {
        if (!ignore) setSalesEmployees([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const loadMeetingMinutes = async (leadId: string) => {
    const minutes = await salesLeadsApi.getMinutes(leadId);
    setMeetingMinutesByLead((prev) => ({ ...prev, [leadId]: minutes }));
    return minutes;
  };

  const loadSalesLeads = async () => {
    const leads = (await salesLeadsApi.getAll()).filter((lead) => clientPartnerIds.includes(lead.partnerId));
    setSalesLeads(leads);
    return leads;
  };

  useEffect(() => {
    let ignore = false;

    const syncAndLoad = async () => {
      if (partnersLoading) return;

      setLoading(true);
      setError(null);

      try {
        await Promise.allSettled(
          clientPartnerIds.map((partnerId) => salesLeadsApi.upsertFromPartner(partnerId))
        );

        const leads = (await salesLeadsApi.getAll()).filter((lead) => clientPartnerIds.includes(lead.partnerId));
        if (ignore) return;

        setSalesLeads(leads);

        if (selectedLeadId) {
          const selectedStillExists = leads.some((lead) => lead.id === selectedLeadId);
          if (!selectedStillExists) {
            setSelectedLeadId(null);
            setViewMode('list');
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Failed to load sales leads');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    syncAndLoad();

    return () => {
      ignore = true;
    };
  }, [partnersLoading, clientPartnerIds, selectedLeadId]);

  const handleViewDetail = async (leadId: string) => {
    setSelectedLeadId(leadId);
    setViewMode('detail');
    try {
      await loadMeetingMinutes(leadId);
    } catch {
      // Keep detail view open; the page-level error banner is enough.
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedLeadId(null);
  };

  const handleSaveMeetingMinute = async (
    leadId: string,
    meeting: Omit<SalesLeadMeetingMinuteModel, 'id' | 'createdAt' | 'createdBy'>
  ) => {
    setError(null);
    try {
      await salesLeadsApi.createMinute(leadId, {
        ...meeting,
        createdBy: meeting.salesAgent || 'System',
      });
      await Promise.all([loadSalesLeads(), loadMeetingMinutes(leadId)]);
    } catch (err: any) {
      setError(err.message || 'Failed to save meeting minutes');
      throw err;
    }
  };

  const selectedLead = selectedLeadId
    ? salesLeads.find((lead) => lead.id === selectedLeadId)
    : undefined;

  const selectedLeadMeetingMinutes = selectedLeadId
    ? meetingMinutesByLead[selectedLeadId] || []
    : [];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading sales leads...
        </div>
      </div>
    );
  }

  if (error && salesLeads.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Failed to load sales leads</div>
              <div className="mt-1">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {viewMode === 'list' && (
        <SalesLeadsList
          salesLeads={salesLeads}
          salesEmployees={salesEmployees}
          onViewDetail={handleViewDetail}
          onCreateBookingFromLead={onCreateBookingFromLead}
          onSaveMeetingMinute={handleSaveMeetingMinute}
        />
      )}

      {viewMode === 'detail' && selectedLead && (
        <SalesLeadDetail
          lead={selectedLead}
          meetingMinutes={selectedLeadMeetingMinutes}
          onBack={handleBackToList}
          onCreateBookingFromLead={onCreateBookingFromLead}
          onSaveMeetingMinute={handleSaveMeetingMinute}
        />
      )}
    </div>
  );
}
