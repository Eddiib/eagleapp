import { useState } from 'react';
import { SalesLead, SalesLeadMeetingMinute, ContactType, NextAction } from './SalesLeads';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { X, Clock, Calendar, User, MessageSquare } from 'lucide-react';

interface SalesLeadMeetingPanelProps {
  lead: SalesLead;
  onClose: () => void;
  onSave: (meeting: Omit<SalesLeadMeetingMinute, 'id' | 'createdAt' | 'createdBy'>) => Promise<void> | void;
}

export function SalesLeadMeetingPanel({
  lead,
  onClose,
  onSave,
}: SalesLeadMeetingPanelProps) {
  const [formData, setFormData] = useState({
    contactType: 'Phone Call' as ContactType,
    meetingDate: new Date().toISOString().split('T')[0],
    meetingTime: new Date().toTimeString().slice(0, 5),
    summary: '',
    clientNeeds: '',
    nextAction: 'Follow-Up Call' as NextAction,
    nextActionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleSave = async () => {
    if (!formData.summary.trim()) {
      alert('Please enter a summary of the discussion.');
      return;
    }

    try {
      await onSave({
        salesLeadId: lead.id,
        partnerId: lead.partnerId,
        salesAgent: lead.assignedSalesAgent,
        salesAgentId: lead.assignedSalesAgentId,
        contactType: formData.contactType,
        meetingDate: formData.meetingDate,
        meetingTime: formData.meetingTime,
        summary: formData.summary,
        clientNeeds: formData.clientNeeds || undefined,
        nextAction: formData.nextAction,
        nextActionDate: formData.nextActionDate,
        status: 'draft',
        actionItems: [],
        communicationMethods: [],
        clientParticipants: [],
        companyParticipants: [],
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save meeting minutes.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Add Meeting Minutes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {lead.clientName} • {lead.leadId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {/* Lead Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Client:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{lead.clientName}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Sales Agent:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{lead.assignedSalesAgent}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">City:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{lead.city}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Last Contact:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {lead.lastContactDate || 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Type */}
          <div>
            <Label>Contact Type</Label>
            <select
              value={formData.contactType}
              onChange={(e) => setFormData({ ...formData, contactType: e.target.value as ContactType })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="Phone Call">Phone Call</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Physical Meeting">Physical Meeting</option>
              <option value="Video Call">Video Call</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Meeting Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Meeting Date
              </Label>
              <input
                type="date"
                value={formData.meetingDate}
                onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Meeting Time
              </Label>
              <input
                type="time"
                value={formData.meetingTime}
                onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <Label>
              Summary <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief summary of the discussion, key points covered, client's response..."
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Client Needs */}
          <div>
            <Label>Client Needs / Requirements</Label>
            <Textarea
              value={formData.clientNeeds}
              onChange={(e) => setFormData({ ...formData, clientNeeds: e.target.value })}
              placeholder="What does the client need? Any specific requirements, concerns, or preferences discussed..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Next Action */}
          <div>
            <Label>Next Action</Label>
            <select
              value={formData.nextAction}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value as NextAction })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="Send Quotation">Send Quotation</option>
              <option value="Follow-Up Call">Follow-Up Call</option>
              <option value="Schedule Meeting">Schedule Meeting</option>
              <option value="Waiting on Client">Waiting on Client</option>
              <option value="Closed / Not Interested">Closed / Not Interested</option>
            </select>
          </div>

          {/* Next Action Date */}
          <div>
            <Label>Next Action Date</Label>
            <input
              type="date"
              value={formData.nextActionDate}
              onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Meeting Minutes
          </Button>
        </div>
      </div>
    </div>
  );
}
