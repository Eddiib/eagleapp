import { useState, useEffect } from 'react';
import { SalesLead, LeadStatus, LeadSource } from './SalesLeads';
import { Partner } from '../types/partner';
import { Employee } from './EmployeesModule';
import { countries } from '../data/countries';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Save, X, Info, Lock, Unlock } from 'lucide-react';
import { ClientSelector } from './ClientSelector';
import { employeesApi } from '../services/employees';
import { useConfirm } from '../context/ConfirmDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface SalesLeadFormProps {
  initialData?: SalesLead;
  mode: 'create' | 'edit';
  currentUser: { id: string; name: string; role: string };
  onSave: (data: Partial<SalesLead>) => void;
  onCancel: () => void;
}

export function SalesLeadForm({
  initialData,
  mode,
  currentUser,
  onSave,
  onCancel,
}: SalesLeadFormProps) {
  const confirmDialog = useConfirm();
  const [formData, setFormData] = useState<Partial<SalesLead>>(
    initialData || {
      partnerId: '',
      contactPerson: '',
      email: '',
      phone: '',
      mobile: '',
      whatsapp: '',
      country: '',
      city: '',
      status: 'New',
      assignedSalesPerson: '',
      assignedSalesPersonId: '',
      source: 'Website',
      potentialVolume: '',
      potentialValue: '',
      notes: '',
      description: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [allowManualAgentChange, setAllowManualAgentChange] = useState(false);
  const [salesPersons, setSalesPersons] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    employeesApi.getAll()
      .then(list => {
        setAllEmployees(list);
        setSalesPersons(list.filter(emp => emp.isActive && emp.isSalesPerson));
      })
      .catch(() => {
        setAllEmployees([]);
        setSalesPersons([]);
      });
  }, []);

  const handleChange = (
    field: keyof SalesLead,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClientSelect = (partnerId: string, partner: Partner | null) => {
    setSelectedPartner(partner);
    setFormData(prev => ({ ...prev, partnerId }));
    
    // Clear partner-related error
    if (errors.partnerId) {
      setErrors(prev => ({ ...prev, partnerId: '' }));
    }

    // Auto-fill sales agent from partner's assigned agent
    if (partner?.assignedAgentId) {
      const assignedAgent = allEmployees.find(
        emp => emp.id === partner.assignedAgentId
      );
      
      if (assignedAgent) {
        setFormData(prev => ({
          ...prev,
          assignedSalesPerson: `${assignedAgent.firstName} ${assignedAgent.surname}`,
          assignedSalesPersonId: assignedAgent.id
        }));
        // Reset manual change toggle when partner changes
        setAllowManualAgentChange(false);
      } else {
        // Partner has assigned agent ID but employee not found
        setFormData(prev => ({
          ...prev,
          assignedSalesPerson: '',
          assignedSalesPersonId: ''
        }));
      }
    } else {
      // No assigned agent in partner
      setFormData(prev => ({
        ...prev,
        assignedSalesPerson: '',
        assignedSalesPersonId: ''
      }));
    }
  };

  const handleSalesAgentChange = (employeeId: string) => {
    const employee = allEmployees.find(emp => emp.id === employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        assignedSalesPerson: `${employee.firstName} ${employee.surname}`,
        assignedSalesPersonId: employee.id
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.partnerId?.trim()) {
      newErrors.partnerId = 'Client selection is required';
    }

    if (!formData.contactPerson?.trim()) {
      newErrors.contactPerson = 'Contact Person is required';
    }

    if (!formData.assignedSalesPerson?.trim()) {
      newErrors.assignedSalesPerson = 'Sales Agent is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onSave(formData);
  };

  const handleCancelClick = async () => {
    const isDirty = mode === 'create' || JSON.stringify(formData) !== JSON.stringify(initialData);
    if (!isDirty) {
      onCancel();
      return;
    }
    const ok = await confirmDialog({
      title: 'Cancel editing?',
      message: 'Any unsaved changes will be lost.',
      confirmLabel: 'Discard changes',
    });
    if (ok) onCancel();
  };

  // Check if partner has no assigned agent
  const partnerHasNoAgent = selectedPartner && !selectedPartner.assignedAgentId;

  // Determine if sales agent field should be disabled
  const isSalesAgentDisabled = !allowManualAgentChange && !!formData.assignedSalesPersonId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-gray-900 dark:text-white">
            {mode === 'create' ? 'New Sales Lead' : 'Edit Sales Lead'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {mode === 'create'
              ? 'Create a new sales opportunity'
              : 'Update lead information'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {/* Lead Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
            <CardDescription>
              Basic information about the sales opportunity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selector */}
            <div>
              <ClientSelector
                selectedPartnerId={formData.partnerId}
                onSelect={handleClientSelect}
                required
                error={errors.partnerId}
              />
            </div>

            {/* Warning if partner has no assigned agent */}
            {partnerHasNoAgent && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Assigned Agent is missing for this Partner. Please update the Partner profile first or enable manual change to select a Sales Agent.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="assignedSalesPerson">
                    Sales Agent <span className="text-red-500">*</span>
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Auto-filled from Partner Assigned Agent.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {isSalesAgentDisabled && (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                  {!isSalesAgentDisabled && formData.assignedSalesPersonId && (
                    <Unlock className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <Select
                  value={formData.assignedSalesPersonId || 'none'}
                  onValueChange={(value) => {
                    if (value !== 'none') {
                      handleSalesAgentChange(value);
                    }
                  }}
                  disabled={isSalesAgentDisabled}
                >
                  <SelectTrigger 
                    id="assignedSalesPerson" 
                    className={`${errors.assignedSalesPerson ? 'border-red-500' : ''} ${isSalesAgentDisabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                  >
                    <SelectValue placeholder="Select sales agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      {salesPersons.length === 0 ? 'No sales persons available' : 'Select sales agent'}
                    </SelectItem>
                    {salesPersons.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.firstName} {person.surname} ({person.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignedSalesPerson && (
                  <p className="text-sm text-red-500">{errors.assignedSalesPerson}</p>
                )}

                {/* Allow Manual Change Toggle */}
                {formData.assignedSalesPersonId && (
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      id="allowManualChange"
                      checked={allowManualAgentChange}
                      onCheckedChange={setAllowManualAgentChange}
                    />
                    <Label htmlFor="allowManualChange" className="text-sm cursor-pointer">
                      Allow Manual Change
                    </Label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => handleChange('source', value as LeadSource)}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Expo">Expo</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                    <SelectItem value="Existing Client">Existing Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="potentialVolume">Potential Volume</Label>
                <Input
                  id="potentialVolume"
                  value={formData.potentialVolume || ''}
                  onChange={(e) => handleChange('potentialVolume', e.target.value)}
                  placeholder="e.g., 500 TEU/year"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="potentialValue">Potential Value</Label>
                <Input
                  id="potentialValue"
                  value={formData.potentialValue || ''}
                  onChange={(e) => handleChange('potentialValue', e.target.value)}
                  placeholder="e.g., $250,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value as LeadStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Quoted">Quoted</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === 'edit' && initialData?.lastContactDate && (
              <div className="space-y-2 pt-4 border-t dark:border-gray-700">
                <Label>Last Contact Date</Label>
                <div className="text-gray-600 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border dark:border-gray-700">
                  {initialData.lastContactDate}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This field is automatically updated when a Meeting Minute is created
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Details for reaching the lead contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">
                  Contact Person <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson || ''}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  placeholder="Enter contact person name"
                  className={errors.contactPerson ? 'border-red-500' : ''}
                />
                {errors.contactPerson && (
                  <p className="text-sm text-red-500">{errors.contactPerson}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 555 0101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile || ''}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="+1 555 0102"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp || ''}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="+1 555 0102"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country || ''}
                  onValueChange={(v) => handleChange('country', v)}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country…" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes & Description</CardTitle>
            <CardDescription>
              Additional information about this lead
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the lead and their business needs..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add internal notes, reminders, or key information..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleCancelClick}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {mode === 'create' ? 'Create Lead' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
