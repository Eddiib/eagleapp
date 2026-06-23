import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import { salesLeadsApi, SalesLeadMeetingMinute, ActionItem, ContactType, NextAction } from '../services/salesLeads';
import { usePartners } from '../hooks/usePartners';
import { employeesApi } from '../services/employees';
import { Employee } from './EmployeesModule';
import { useAuth } from '../context/AuthContext';
import { isPartnerBuyer } from '../utils/partnerRoles';

const MEETING_TYPES = ['On-site', 'Online', 'Office Visit', 'Dinner', 'Expo', 'Informal'];
const CONTACT_TYPES: ContactType[] = ['Phone Call', 'Email', 'WhatsApp', 'Physical Meeting', 'Video Call', 'Other'];
const NEXT_ACTIONS: NextAction[] = ['Send Quotation', 'Follow-Up Call', 'Schedule Meeting', 'Waiting on Client', 'Closed / Not Interested'];
const COMM_METHODS = ['In Person', 'Phone Call', 'WhatsApp', 'Viber', 'WeChat', 'Email', 'Other'];

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

interface MeetingMinutesFormProps {
  initialData?: SalesLeadMeetingMinute | null;
  leadId?: string;
  mode: 'create' | 'edit' | 'view';
  onSaved: () => void;
  onCancel: () => void;
}

export function MeetingMinutesForm({ initialData, leadId, mode, onSaved, onCancel }: MeetingMinutesFormProps) {
  const isViewMode = mode === 'view';
  const { user } = useAuth();
  const { partners } = usePartners();

  const clients = partners.filter(p =>
    isPartnerBuyer(p) && p.status === 'Active'
  );

  const today = new Date().toISOString().split('T')[0];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [partnerId, setPartnerId] = useState(initialData?.partnerId ?? '');
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson ?? '');
  const [salesAgentId, setSalesAgentId] = useState(initialData?.salesAgentId ?? '');
  const [salesAgent, setSalesAgent] = useState(initialData?.salesAgent ?? '');
  const [contactType, setContactType] = useState<ContactType>(initialData?.contactType ?? 'Phone Call');
  const [meetingDate, setMeetingDate] = useState(initialData?.meetingDate ?? today);
  const [meetingTime, setMeetingTime] = useState(initialData?.meetingTime ?? '');
  const [meetingType, setMeetingType] = useState(initialData?.meetingType ?? 'On-site');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [durationMinutes, setDurationMinutes] = useState<number>(initialData?.durationMinutes ?? 60);
  const [purpose, setPurpose] = useState(initialData?.purpose ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [keyPoints, setKeyPoints] = useState(initialData?.keyPoints ?? '');
  const [clientNeeds, setClientNeeds] = useState(initialData?.clientNeeds ?? '');
  const [proposedSolutions, setProposedSolutions] = useState(initialData?.proposedSolutions ?? '');
  const [competitorsMentioned, setCompetitorsMentioned] = useState(initialData?.competitorsMentioned ?? '');
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialData?.actionItems ?? []);
  const [newActionText, setNewActionText] = useState('');
  const [communicationMethods, setCommunicationMethods] = useState<string[]>(initialData?.communicationMethods ?? ['In Person']);
  const [clientParticipants, setClientParticipants] = useState<string[]>(initialData?.clientParticipants ?? []);
  const [companyParticipants, setCompanyParticipants] = useState<string[]>(initialData?.companyParticipants ?? []);
  const [nextAction, setNextAction] = useState<NextAction>(initialData?.nextAction ?? 'Follow-Up Call');
  const [nextActionDate, setNextActionDate] = useState(initialData?.nextActionDate ?? '');
  const [status, setStatus] = useState<'draft' | 'completed' | 'follow-up-pending'>(initialData?.status ?? 'draft');

  useEffect(() => {
    employeesApi.getAll().then(setEmployees).catch(() => {});
  }, []);

  // Pre-fill current user as sales agent on create
  useEffect(() => {
    if (mode === 'create' && !initialData) {
      const emp = employees.find(e => e.email === user?.email);
      if (emp) {
        setSalesAgentId(emp.id);
        setSalesAgent(`${emp.firstName} ${emp.surname}`);
      }
    }
  }, [employees, user, mode, initialData]);

  const selectedPartner = clients.find(p => p.id === partnerId);
  const partnerContacts = selectedPartner?.contacts ?? [];
  const salesPeople = employees.filter(e => e.isSalesPerson && e.isActive);

  const weekNumber = getWeekNumber(new Date(meetingDate || today));

  const handleAddActionItem = () => {
    if (newActionText.trim()) {
      setActionItems(prev => [...prev, { id: Date.now().toString(), text: newActionText.trim(), completed: false }]);
      setNewActionText('');
    }
  };

  const toggleCommunicationMethod = (method: string) => {
    setCommunicationMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const toggleClientParticipant = (name: string) => {
    setClientParticipants(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const toggleCompanyParticipant = (name: string) => {
    setCompanyParticipants(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleSalesAgentChange = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setSalesAgentId(empId);
    setSalesAgent(emp ? `${emp.firstName} ${emp.surname}` : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) { setError('Summary is required'); return; }
    setSaving(true);
    setError(null);
    const payload: Partial<SalesLeadMeetingMinute> = {
      partnerId,
      contactPerson: contactPerson || undefined,
      salesAgentId: salesAgentId || undefined,
      salesAgent,
      contactType,
      meetingDate,
      meetingTime: meetingTime || undefined,
      meetingType: meetingType || undefined,
      location: location || undefined,
      durationMinutes,
      purpose: purpose || undefined,
      summary,
      keyPoints: keyPoints || undefined,
      clientNeeds: clientNeeds || undefined,
      proposedSolutions: proposedSolutions || undefined,
      competitorsMentioned: competitorsMentioned || undefined,
      actionItems,
      communicationMethods,
      clientParticipants,
      companyParticipants,
      nextAction,
      nextActionDate: nextActionDate || undefined,
      status,
    };
    try {
      if (mode === 'edit' && initialData?.id) {
        await salesLeadsApi.updateMinute(initialData.id, payload);
      } else if (leadId) {
        await salesLeadsApi.createMinute(leadId, payload);
      } else {
        await salesLeadsApi.createStandaloneMinute(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'New Meeting Minute' : mode === 'edit' ? 'Edit Meeting Minute' : 'View Meeting Minute'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {mode === 'create' ? 'Record a new client meeting' : `Meeting on ${new Date(meetingDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        {!isViewMode && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-300">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-8">

        {/* Basic Information */}
        <section>
          <h3 className="text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Basic Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Date *</label>
              <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Week Number</label>
              <input type="number" value={weekNumber} disabled className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#262626] text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Time</label>
              <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
          </div>
        </section>

        {/* Sales Person */}
        <section>
          <h3 className="text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Sales Representative</h3>
          <div className="max-w-sm">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Sales Person</label>
            {isViewMode ? (
              <input type="text" value={salesAgent} disabled className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#262626] text-gray-600 dark:text-gray-400" />
            ) : (
              <select value={salesAgentId} onChange={e => handleSalesAgentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select sales person…</option>
                {salesPeople.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.surname}</option>
                ))}
              </select>
            )}
          </div>
        </section>

        {/* Client Details */}
        <section>
          <h3 className="text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Client Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Partner / Client *</label>
              {isViewMode ? (
                <input type="text" value={selectedPartner?.tradingName ?? selectedPartner?.companyLegalName ?? partnerId} disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#262626] text-gray-600 dark:text-gray-400" />
              ) : (
                <select value={partnerId} onChange={e => { setPartnerId(e.target.value); setContactPerson(''); setClientParticipants([]); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Select a client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.tradingName || c.companyLegalName}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
              {isViewMode ? (
                <input type="text" value={contactPerson} disabled className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#262626] text-gray-600 dark:text-gray-400" />
              ) : (
                <select value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a contact…</option>
                  {partnerContacts.map(c => (
                    <option key={c.id} value={c.name}>{c.name}{c.position ? ` — ${c.position}` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </section>

        {/* Meeting Details */}
        <section>
          <h3 className="text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Meeting Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Contact Type *</label>
              <select value={contactType} onChange={e => setContactType(e.target.value as ContactType)} disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800">
                {CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Meeting Type</label>
              <select value={meetingType} onChange={e => setMeetingType(e.target.value)} disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800">
                {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
              <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} disabled={isViewMode} min={1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} disabled={isViewMode}
                placeholder="Meeting location…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
              <textarea value={purpose} onChange={e => setPurpose(e.target.value)} disabled={isViewMode} rows={2}
                placeholder="Describe the purpose of this meeting…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
          </div>

          {/* Participants */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Participants from Client Side</label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-[#262626] max-h-40 overflow-y-auto space-y-2">
                {partnerContacts.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Select a client to see contacts</p>
                ) : (
                  partnerContacts.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={clientParticipants.includes(c.name)} onChange={() => toggleClientParticipant(c.name)} disabled={isViewMode}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Participants from Our Company</label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-[#262626] max-h-40 overflow-y-auto space-y-2">
                {employees.filter(e => e.isActive).map(e => {
                  const name = `${e.firstName} ${e.surname}`;
                  return (
                    <label key={e.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={companyParticipants.includes(name)} onChange={() => toggleCompanyParticipant(name)} disabled={isViewMode}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Discussion Summary */}
        <section>
          <h3 className="text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Discussion Summary</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Summary *</label>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} disabled={isViewMode} rows={3} required
                placeholder="Brief summary of the meeting…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Key Points Discussed</label>
              <textarea value={keyPoints} onChange={e => setKeyPoints(e.target.value)} disabled={isViewMode} rows={3}
                placeholder="Key points from the meeting…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Client Needs / Problems Identified</label>
              <textarea value={clientNeeds} onChange={e => setClientNeeds(e.target.value)} disabled={isViewMode} rows={2}
                placeholder="Document specific needs or pain points…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Proposed Solutions</label>
              <textarea value={proposedSolutions} onChange={e => setProposedSolutions(e.target.value)} disabled={isViewMode} rows={2}
                placeholder="Solutions or approaches discussed…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Competitors Mentioned</label>
              <input type="text" value={competitorsMentioned} onChange={e => setCompetitorsMentioned(e.target.value)} disabled={isViewMode}
                placeholder="List any competitors discussed…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>

            {/* Action Items */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Action Items</label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-[#262626]">
                {actionItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 mb-2 bg-white dark:bg-[#1E1E1E] p-2 rounded border border-gray-200 dark:border-gray-700">
                    <input type="checkbox" checked={item.completed} onChange={() => setActionItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i))}
                      disabled={isViewMode} className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded" />
                    <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>{item.text}</span>
                    {!isViewMode && (
                      <button type="button" onClick={() => setActionItems(prev => prev.filter(i => i.id !== item.id))}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!isViewMode && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={newActionText} onChange={e => setNewActionText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddActionItem(); } }}
                      placeholder="Add action item…"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={handleAddActionItem} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Follow-Up */}
        <section>
          <h3 className="text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Follow-Up</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Next Action</label>
              <select value={nextAction} onChange={e => setNextAction(e.target.value as NextAction)} disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800">
                {NEXT_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Next Action Date</label>
              <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} disabled={isViewMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800" />
            </div>
          </div>
        </section>

        {/* Communication Method */}
        <section>
          <h3 className="text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Communication Method</h3>
          <div className="grid grid-cols-4 gap-3">
            {COMM_METHODS.map(method => (
              <label key={method} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={communicationMethods.includes(method)} onChange={() => toggleCommunicationMethod(method)} disabled={isViewMode}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{method}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Status */}
        <section>
          <h3 className="text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Status</h3>
          <div className="max-w-xs">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Meeting Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as typeof status)} disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800">
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="follow-up-pending">Follow-up Pending</option>
            </select>
          </div>
        </section>

      </form>
    </div>
  );
}
