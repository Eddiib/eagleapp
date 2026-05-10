import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Partner, PartnerType, PartnerCategory, PartnerStatus, PaymentTerms, DefaultServiceType, PartnerContact, DeliveryAddress, PartnerBankDetails, PartnerDocument, TradeMarketInfo } from '../types/partner';
import { Employee } from './EmployeesModule';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Plus, Trash2, FileText, Building2, MapPin, CreditCard, Paperclip, Edit2, Save, Ban, Globe } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { countries, getCountryName } from '../data/countries';
import { MultiSelectCountry } from './MultiSelectCountry';
import { ports, getPortName } from '../data/ports';

import { employeesApi } from '../services/employees';
import { useCompanySettings } from '../context/CompanySettingsContext';

interface PartnerFormProps {
  partner?: Partner | null;
  mode: 'new' | 'edit' | 'view';
  onSave: (partner: Partial<Partner>) => void;
  onCancel: () => void;
  allPartners?: Partner[]; // For filtering carriers in Trade & Market Info
  /** Notifies the parent modal whether the form has unsaved edits. */
  onDirtyChange?: (dirty: boolean) => void;
}

type FormSection = 'basic' | 'delivery' | 'bank' | 'trade' | 'attachments';
const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'AED', 'CNY'];
const CURRENCY_LABELS: Record<string, string> = {
  EUR: 'EUR - Euro',
  USD: 'USD - US Dollar',
  GBP: 'GBP - British Pound',
  AED: 'AED - UAE Dirham',
  CNY: 'CNY - Chinese Yuan',
};

export function PartnerForm({ partner, mode, onSave, onCancel, allPartners = [], onDirtyChange }: PartnerFormProps) {
  const { user } = useAuth();
  const { baseCurrency } = useCompanySettings();
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isNewMode = mode === 'new';

  // Filter carriers for Preferred Carrier dropdown
  const carrierPartners = allPartners.filter(p => p.partnerClass === 'Carrier' && p.status === 'Active');

  const carrierCategories = ['Shipping Line', 'Air Carrier', 'Trucking Company', 'Rail Operator'];
  const nonCarrierCategories = [
    'Overseas Agent', 'Customs Broker', 'Warehouse / Depot', 'Insurance Company',
    'Surveyor / Inspector', 'Special Services Provider', 'Client', 'Buyer'
  ];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const currencyOptions = useMemo(() => {
    const set = new Set<string>([baseCurrency, ...COMMON_CURRENCIES].filter(Boolean));
    return Array.from(set);
  }, [baseCurrency]);
  const renderCurrencyOptions = () => currencyOptions.map((currency) => (
    <SelectItem key={currency} value={currency}>
      {CURRENCY_LABELS[currency] || currency}
    </SelectItem>
  ));

  useEffect(() => {
    employeesApi.getAll().then(setEmployees).catch(() => {});
  }, []);

  const [activeSection, setActiveSection] = useState<FormSection>('basic');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankModalError, setBankModalError] = useState('');
  const [addressModalError, setAddressModalError] = useState('');
  const [newBankData, setNewBankData] = useState<PartnerBankDetails>({
    id: '',
    bankName: '',
    swift: '',
    iban: '',
    accountNumber: '',
    currency: baseCurrency,
    intermediaryBankName: '',
    intermediarySwift: '',
    isDefault: false
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddressData, setNewAddressData] = useState<DeliveryAddress>({
    id: '',
    addressName: '',
    fullAddress: '',
    city: '',
    country: '',
    zipCode: '',
    contactPerson: '',
    contactPhone: '',
    isDefault: false
  });
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [newTradeData, setNewTradeData] = useState<TradeMarketInfo>({
    id: '',
    countryOfOrigin: '',
    countryOfDestination: '',
    placeOfLoading: '',
    pol: '',
    pod: '',
    finalDestination: '',
    totalAnnualVolume: '',
    preferredCarrierId: '',
    preferredCorridor: '',
    modeOfTransport: undefined,
    modeOfTrailer: undefined
  });

  // Partner code is server-assigned on create; we never generate it client-side.
  // (Random generation here used to risk collisions with the unique DB index.)

  // Form state
  const [formData, setFormData] = useState<Partial<Partner>>({
    partnerCode: partner?.partnerCode || '',
    companyLegalName: partner?.companyLegalName || '',
    tradingName: partner?.tradingName || '',
    businessNumber: partner?.businessNumber || '',
    eoriNumber: partner?.eoriNumber || '',
    partnerClass: partner?.partnerClass || 'Carrier',
    partnerType: partner?.partnerType || 'Shipping Line',
    country: partner?.country || '',
    city: partner?.city || '',
    address: partner?.address || '',
    zipCode: partner?.zipCode || '',
    website: partner?.website || '',
    taxNumber: partner?.taxNumber || '',
    registrationNumber: partner?.registrationNumber || '',
    assignedAgentId: partner?.assignedAgentId || '',
    paymentTermsAsSupplier: partner?.paymentTermsAsSupplier || '30 Days',
    paymentTermsAsClient: partner?.paymentTermsAsClient || '30 Days',
    creditTerms: partner?.creditTerms || '',
    currency: partner?.currency || baseCurrency,
    defaultServiceType: partner?.defaultServiceType || 'Sea',
    notes: partner?.notes || '',
    status: partner?.status || 'Active',
    rating: partner?.rating || 3,
    openBalance: partner?.openBalance || 0, // displayed read-only; never sent
    creditLimit: partner?.creditLimit || 0,
    bankDetails: Array.isArray(partner?.bankDetails) ? partner.bankDetails : [],
    deliveryAddresses: Array.isArray(partner?.deliveryAddresses) ? partner.deliveryAddresses : [],
    tradeMarketInfo: Array.isArray(partner?.tradeMarketInfo) ? partner.tradeMarketInfo : [],
    contacts: Array.isArray(partner?.contacts) && partner.contacts.length > 0 ? partner.contacts : [{
      id: '1',
      name: '',
      position: '',
      phone: '',
      email: '',
      isPrimary: true
    }],
    documents: Array.isArray(partner?.documents) ? partner.documents : []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dirty tracking — bubble up to the modal so the X / overlay / Esc can
  // confirm before discarding edits. We snapshot the seed state once.
  const [seedSnapshot] = useState(() => JSON.stringify(formData));
  useEffect(() => {
    onDirtyChange?.(JSON.stringify(formData) !== seedSnapshot);
  }, [formData, seedSnapshot, onDirtyChange]);

  const categoryOptions = formData.partnerClass === 'Carrier' ? carrierCategories : nonCarrierCategories;

  const handlePartnerClassChange = (value: 'Carrier' | 'Non Carrier') => {
    const newCategories = value === 'Carrier' ? carrierCategories : nonCarrierCategories;
    const currentTypeValid = newCategories.includes(formData.partnerType || '');
    setFormData({
      ...formData,
      partnerClass: value,
      partnerType: (currentTypeValid ? formData.partnerType : newCategories[0]) as PartnerType,
    });
  };

  useEffect(() => {
    if (partner) {
      setFormData({
        ...partner,
        contacts: Array.isArray(partner.contacts) && partner.contacts.length > 0 ? partner.contacts : [{
          id: '1',
          name: '',
          position: '',
          phone: '',
          email: '',
          isPrimary: true
        }],
        bankDetails: Array.isArray(partner.bankDetails) ? partner.bankDetails : [],
        deliveryAddresses: Array.isArray(partner.deliveryAddresses) ? partner.deliveryAddresses : [],
        documents: Array.isArray(partner.documents) ? partner.documents : []
      });
    }
  }, [partner]);

  // Loose, real-world-friendly format validators. Strict per-country rules can
  // be layered later — these reject only obvious junk.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^\+?[\d\s().\-]{6,}$/;
  const WEBSITE_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i;
  // IBAN: 15-34 alphanumeric chars; SWIFT/BIC: 8 or 11 alphanumeric.
  const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i;
  const SWIFT_RE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i;
  // EORI: ISO country prefix + up to 15 alphanumerics.
  const EORI_RE = /^[A-Z]{2}[A-Z0-9]{1,15}$/i;

  const ERROR_TO_SECTION: Record<string, FormSection> = {
    companyLegalName: 'basic', tradingName: 'basic', country: 'basic', city: 'basic',
    address: 'basic', taxNumber: 'basic', eoriNumber: 'basic', website: 'basic',
    contactName: 'basic', contactEmail: 'basic', contactPhone: 'basic',
    contacts: 'basic',
    bankDetails: 'bank',
    deliveryAddresses: 'delivery',
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyLegalName?.trim()) newErrors.companyLegalName = 'Business Legal Name is required';
    if (!formData.tradingName?.trim())      newErrors.tradingName = 'Business Trade Name is required';
    if (!formData.country?.trim())          newErrors.country = 'Country is required';
    if (!formData.city?.trim())             newErrors.city = 'City is required';
    if (!formData.address?.trim())          newErrors.address = 'Address is required';
    if (!formData.taxNumber?.trim())        newErrors.taxNumber = 'Tax ID is required';

    if (formData.eoriNumber && !EORI_RE.test(formData.eoriNumber.trim())) {
      newErrors.eoriNumber = 'EORI must start with a 2-letter country code';
    }
    if (formData.website && !WEBSITE_RE.test(formData.website.trim())) {
      newErrors.website = 'Website must look like example.com';
    }

    const primaryContacts = (formData.contacts ?? []).filter((c) => c.isPrimary).length;
    if ((formData.contacts ?? []).length === 0 || primaryContacts === 0) {
      newErrors.contacts = 'At least one primary contact is required';
    }
    if (primaryContacts > 1) {
      newErrors.contacts = 'Only one contact may be marked Primary';
    }
    (formData.contacts ?? []).forEach((c, i) => {
      if (!c.name?.trim() && i === 0) newErrors.contactName = 'Contact Person is required';
      if (c.email && !EMAIL_RE.test(c.email.trim())) {
        newErrors[`contactEmail_${i}`] = `Contact ${i + 1}: invalid email`;
      }
      if (c.phone && !PHONE_RE.test(c.phone.trim())) {
        newErrors[`contactPhone_${i}`] = `Contact ${i + 1}: invalid phone`;
      }
      if (i === 0) {
        if (!c.email?.trim()) newErrors.contactEmail = 'Contact Email is required';
        if (!c.phone?.trim()) newErrors.contactPhone = 'Contact Phone is required';
      }
    });

    const banks = formData.bankDetails ?? [];
    if (banks.filter((b) => b.isDefault).length > 1) {
      newErrors.bankDetails = 'Only one bank account may be marked default';
    }
    banks.forEach((b, i) => {
      if (b.iban && !IBAN_RE.test(b.iban.replace(/\s+/g, ''))) {
        newErrors[`bank_iban_${i}`] = `Bank ${i + 1}: invalid IBAN`;
      }
      if (b.swift && !SWIFT_RE.test(b.swift.trim())) {
        newErrors[`bank_swift_${i}`] = `Bank ${i + 1}: invalid SWIFT/BIC`;
      }
    });

    const addresses = formData.deliveryAddresses ?? [];
    if (addresses.filter((a) => a.isDefault).length > 1) {
      newErrors.deliveryAddresses = 'Only one delivery address may be marked default';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const jumpToFirstError = (newErrors: Record<string, string>) => {
    const firstKey = Object.keys(newErrors)[0];
    if (!firstKey) return;
    const direct = ERROR_TO_SECTION[firstKey];
    if (direct) { setActiveSection(direct); return; }
    if (firstKey.startsWith('bank_'))    { setActiveSection('bank'); return; }
    if (firstKey.startsWith('contact'))  { setActiveSection('basic'); return; }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validateForm();
    if (Object.keys(errs).length === 0) {
      const partnerData: Partial<Partner> = {
        ...formData,
        createdDate: partner?.createdDate || new Date().toISOString().split('T')[0],
        createdBy: partner?.createdBy || user?.username || 'unknown',
        lastUpdatedDate: new Date().toISOString().split('T')[0],
        lastUpdatedBy: user?.username || 'unknown'
      };
      onSave(partnerData);
    } else {
      jumpToFirstError(errs);
    }
  };

  // ============= CONTACT CRUD OPERATIONS =============
  const handleContactChange = (index: number, field: keyof PartnerContact, value: string | boolean) => {
    let updatedContacts = [...(formData.contacts || [])];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };
    // Single-primary: toggling one Primary on clears all others.
    if (field === 'isPrimary' && value === true) {
      updatedContacts = updatedContacts.map((c, i) =>
        i === index ? c : { ...c, isPrimary: false },
      );
    }
    setFormData({ ...formData, contacts: updatedContacts });
  };

  const addContact = () => {
    const newContact: PartnerContact = {
      id: Date.now().toString(),
      name: '',
      position: '',
      phone: '',
      email: '',
      isPrimary: false
    };
    setFormData({ 
      ...formData, 
      contacts: [...(formData.contacts || []), newContact] 
    });
    setEditingContactId(newContact.id);
  };

  const removeContact = (index: number) => {
    if (formData.contacts && formData.contacts.length > 1) {
      const updatedContacts = formData.contacts.filter((_, i) => i !== index);
      setFormData({ ...formData, contacts: updatedContacts });
    }
  };

  const startEditingContact = (id: string) => {
    setEditingContactId(id);
  };

  const saveContact = (id: string) => {
    setEditingContactId(null);
  };

  // ============= DELIVERY ADDRESS CRUD OPERATIONS =============
  const addDeliveryAddress = () => {
    // Reset and open modal
    setNewAddressData({
      id: Date.now().toString(),
      addressName: '',
      fullAddress: '',
      city: '',
      country: '',
      zipCode: '',
      contactPerson: '',
      contactPhone: '',
      isDefault: (formData.deliveryAddresses?.length || 0) === 0
    });
    setShowAddressModal(true);
  };

  const handleSaveNewAddress = () => {
    if (!newAddressData.addressName || !newAddressData.fullAddress) {
      setAddressModalError('Address Name and Full Address are required.');
      return;
    }
    setAddressModalError('');
    setFormData({
      ...formData,
      deliveryAddresses: [...(formData.deliveryAddresses || []), newAddressData]
    });
    setShowAddressModal(false);
  };

  const handleCancelNewAddress = () => {
    setShowAddressModal(false);
    setAddressModalError('');
    setNewAddressData({
      id: '',
      addressName: '',
      fullAddress: '',
      city: '',
      country: '',
      zipCode: '',
      contactPerson: '',
      contactPhone: '',
      isDefault: false
    });
  };

  const updateNewAddressField = (field: keyof DeliveryAddress, value: string | boolean) => {
    setNewAddressData({
      ...newAddressData,
      [field]: value
    });
  };

  const updateDeliveryAddress = (index: number, field: keyof DeliveryAddress, value: string | boolean) => {
    let updatedAddresses = [...(formData.deliveryAddresses || [])];
    updatedAddresses[index] = {
      ...updatedAddresses[index],
      [field]: value,
    };
    if (field === 'isDefault' && value === true) {
      updatedAddresses = updatedAddresses.map((a, i) =>
        i === index ? a : { ...a, isDefault: false },
      );
    }
    setFormData({ ...formData, deliveryAddresses: updatedAddresses });
  };

  const removeDeliveryAddress = (index: number) => {
    const updatedAddresses = formData.deliveryAddresses?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, deliveryAddresses: updatedAddresses });
  };

  const startEditingAddress = (id: string) => {
    setEditingAddressId(id);
  };

  const saveAddress = (id: string) => {
    setEditingAddressId(null);
  };

  // ============= BANK DETAILS CRUD OPERATIONS =============
  const addBankDetails = () => {
    // Reset and open modal
    setNewBankData({
      id: Date.now().toString(),
      bankName: '',
      iban: '',
      swift: '',
      accountNumber: '',
      currency: baseCurrency,
      intermediaryBankName: '',
      intermediarySwift: '',
      isDefault: (formData.bankDetails?.length || 0) === 0
    });
    setShowBankModal(true);
  };

  const handleSaveNewBank = () => {
    if (!newBankData.bankName) {
      setBankModalError('Bank Name is required.');
      return;
    }
    setBankModalError('');
    setFormData({
      ...formData,
      bankDetails: [...(formData.bankDetails || []), newBankData]
    });
    setShowBankModal(false);
  };

  const handleCancelNewBank = () => {
    setShowBankModal(false);
    setBankModalError('');
    setNewBankData({
      id: '',
      bankName: '',
      swift: '',
      iban: '',
      accountNumber: '',
      currency: baseCurrency,
      intermediaryBankName: '',
      intermediarySwift: '',
      isDefault: false
    });
  };

  const updateNewBankField = (field: keyof PartnerBankDetails, value: string | boolean) => {
    setNewBankData({
      ...newBankData,
      [field]: value
    });
  };

  const updateBankDetails = (index: number, field: keyof PartnerBankDetails, value: string | boolean) => {
    let updatedBanks = [...(formData.bankDetails || [])];
    updatedBanks[index] = {
      ...updatedBanks[index],
      [field]: value,
    };
    if (field === 'isDefault' && value === true) {
      updatedBanks = updatedBanks.map((b, i) =>
        i === index ? b : { ...b, isDefault: false },
      );
    }
    setFormData({ ...formData, bankDetails: updatedBanks });
  };

  const removeBankDetails = (index: number) => {
    const updatedBanks = formData.bankDetails?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, bankDetails: updatedBanks });
  };

  const startEditingBank = (id: string) => {
    setEditingBankId(id);
  };

  const saveBank = (id: string) => {
    setEditingBankId(null);
  };

  // ============= TRADE & MARKET INFO CRUD OPERATIONS =============
  const addTradeInfo = () => {
    // Reset and open modal
    setNewTradeData({
      id: Date.now().toString(),
      countryOfOrigin: '',
      countryOfDestination: '',
      placeOfLoading: '',
      pol: '',
      pod: '',
      finalDestination: '',
      totalAnnualVolume: '',
      preferredCarrierId: '',
      preferredCorridor: '',
      modeOfTransport: undefined,
      modeOfTrailer: undefined
    });
    setShowTradeModal(true);
  };

  const handleSaveNewTrade = () => {
    setFormData({
      ...formData,
      tradeMarketInfo: [...(formData.tradeMarketInfo || []), newTradeData]
    });
    setShowTradeModal(false);
  };

  const handleCancelNewTrade = () => {
    setShowTradeModal(false);
    setNewTradeData({
      id: '',
      countryOfOrigin: '',
      countryOfDestination: '',
      placeOfLoading: '',
      pol: '',
      pod: '',
      finalDestination: '',
      totalAnnualVolume: '',
      preferredCarrierId: '',
      preferredCorridor: '',
      modeOfTransport: undefined,
      modeOfTrailer: undefined
    });
  };

  const updateNewTradeField = (field: keyof TradeMarketInfo, value: string | undefined) => {
    setNewTradeData({
      ...newTradeData,
      [field]: value
    });
  };

  const removeTradeInfo = (index: number) => {
    const updatedTrades = formData.tradeMarketInfo?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, tradeMarketInfo: updatedTrades });
  };

  // ============= DOCUMENT CRUD OPERATIONS =============
  const addDocument = () => {
    const newDoc: PartnerDocument = {
      id: Date.now().toString(),
      name: 'New Document',
      type: 'Other',
      url: '',
      uploadedDate: new Date().toISOString().split('T')[0],
      uploadedBy: user?.username || 'unknown'
    };
    setFormData({
      ...formData,
      documents: [...(formData.documents || []), newDoc]
    });
  };

  const removeDocument = (index: number) => {
    const updatedDocs = formData.documents?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, documents: updatedDocs });
  };

  const sidebarItems = [
    { id: 'basic' as FormSection, label: 'Basic Information', icon: Building2 },
    { id: 'delivery' as FormSection, label: 'Delivery Addresses', icon: MapPin },
    { id: 'bank' as FormSection, label: 'Bank Details', icon: CreditCard },
    { id: 'trade' as FormSection, label: 'Trade & Market Information', icon: Globe },
    { id: 'attachments' as FormSection, label: 'Attachments', icon: Paperclip }
  ];

  return (
    <form id="partner-form" onSubmit={handleSubmit} className="flex gap-6 h-full">
      {/* Sidebar Navigation */}
      <div className="w-56 flex-shrink-0">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Form Content */}
      <div className="form-compact flex-1 space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(95vh - 160px)' }}>
        {/* Basic Information Section */}
        {activeSection === 'basic' && (
          <div className="space-y-3">
            {/* Business Legal Information + Partner Identification side by side */}
            <div className="grid grid-cols-2 gap-6">

            {/* Business Legal Information */}
            <div>
              <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">Business Legal Information</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="partnerCode">Partner Code</Label>
                  <Input
                    id="partnerCode"
                    value={formData.partnerCode || ''}
                    placeholder={isNewMode ? 'Auto-assigned on save' : ''}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                <div>
                  <Label htmlFor="companyLegalName">
                    Business Legal Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyLegalName"
                    autoFocus={isNewMode}
                    value={formData.companyLegalName || ''}
                    onChange={(e) => setFormData({ ...formData, companyLegalName: e.target.value })}
                    disabled={isViewMode}
                    className={errors.companyLegalName ? 'border-red-500' : ''}
                  />
                  {errors.companyLegalName && (
                    <p className="text-red-500 text-sm mt-1">{errors.companyLegalName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tradingName">
                    Business Trade Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tradingName"
                    value={formData.tradingName || ''}
                    onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                    disabled={isViewMode}
                    className={errors.tradingName ? 'border-red-500' : ''}
                  />
                  {errors.tradingName && (
                    <p className="text-red-500 text-sm mt-1">{errors.tradingName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="businessNumber">Business Number</Label>
                  <Input
                    id="businessNumber"
                    value={formData.businessNumber || ''}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    disabled={isViewMode}
                    placeholder="Company registration number"
                  />
                </div>

                <div>
                  <Label htmlFor="taxNumber">
                    Tax ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber || ''}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    disabled={isViewMode}
                    className={errors.taxNumber ? 'border-red-500' : ''}
                  />
                  {errors.taxNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.taxNumber}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="eoriNumber">EORI Number</Label>
                  <Input
                    id="eoriNumber"
                    value={formData.eoriNumber || ''}
                    onChange={(e) => setFormData({ ...formData, eoriNumber: e.target.value })}
                    disabled={isViewMode}
                    placeholder="EU customs number (e.g. IT01234567890)"
                    className={errors.eoriNumber ? 'border-red-500' : ''}
                  />
                  {errors.eoriNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.eoriNumber}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    disabled={isViewMode}
                    placeholder="Company registration number"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={isViewMode}
                    placeholder="www.example.com"
                    className={errors.website ? 'border-red-500' : ''}
                  />
                  {errors.website && (
                    <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Partner Identification */}
            <div>
              <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">Partner Identification</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="partnerClass">
                    Partner Class <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.partnerClass}
                    onValueChange={(value) => handlePartnerClassChange(value as 'Carrier' | 'Non Carrier')}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="partnerClass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Carrier">Carrier</SelectItem>
                      <SelectItem value="Non Carrier">Non Carrier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="partnerType">
                    Partner Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.partnerType}
                    onValueChange={(value) => setFormData({ ...formData, partnerType: value as PartnerType })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="partnerType">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as PartnerStatus })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignedAgent">Assigned Agent</Label>
                  <Select
                    value={formData.assignedAgentId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, assignedAgentId: value === 'none' ? '' : value })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="assignedAgent" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                      <SelectValue placeholder="Select an agent..." />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="none">None</SelectItem>
                      {employees.filter(emp => emp.isActive).map((employee) => (
                        <SelectItem key={employee.id} value={employee.id} className="dark:text-gray-100 dark:hover:bg-gray-700">
                          {employee.firstName} {employee.surname} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            </div>{/* end two-column wrapper */}

            {/* Business Address + Contact Information side by side */}
            <div className="grid grid-cols-2 gap-6">

            {/* Business Address */}
            <div>
              <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">Business Address</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="address">
                    Full Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    autoComplete="off"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={isViewMode}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={isViewMode}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.country || ''}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="country" className={errors.country ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode || ''}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information - CRUD Format */}
            <div>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">Contact Information</h3>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Contact
                  </Button>
                )}
              </div>
              
              {formData.contacts && formData.contacts.length > 0 ? (
                <div className="space-y-3">
                  {formData.contacts?.map((contact, index) => {
                    const isEditing = editingContactId === contact.id || contact.name === '';
                    
                    return (
                      <div key={contact.id} className="border border-gray-200 dark:border-gray-700 rounded-md">
                        {/* Contact Header - Read Mode */}
                        {!isEditing && (
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-900">{contact.name}</span>
                                {contact.isPrimary && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0">Primary</Badge>
                                )}
                                <span className="text-xs text-gray-500">{contact.position} • {contact.email} • {contact.phone}</span>
                              </div>
                            </div>
                            {!isViewMode && (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingContact(contact.id)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                {formData.contacts && formData.contacts.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeContact(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Contact Edit Mode */}
                        {isEditing && (
                          <div className="px-3 py-2">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {contact.isPrimary && (
                                  <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                                )}
                                <span className="text-gray-600 text-sm">Contact {index + 1}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveContact(contact.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                {formData.contacts && formData.contacts.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeContact(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`contact-name-${index}`}>
                                  Name {index === 0 && <span className="text-red-500">*</span>}
                                </Label>
                                <Input
                                  id={`contact-name-${index}`}
                                  value={contact.name}
                                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                  disabled={isViewMode}
                                  className={index === 0 && errors.contactName ? 'border-red-500' : ''}
                                />
                                {index === 0 && errors.contactName && (
                                  <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor={`contact-position-${index}`}>Position / Role</Label>
                                <Input
                                  id={`contact-position-${index}`}
                                  value={contact.position}
                                  onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                                  disabled={isViewMode}
                                />
                              </div>

                              <div>
                                <Label htmlFor={`contact-phone-${index}`}>
                                  Phone {index === 0 && <span className="text-red-500">*</span>}
                                </Label>
                                <Input
                                  id={`contact-phone-${index}`}
                                  value={contact.phone}
                                  onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                  disabled={isViewMode}
                                  className={index === 0 && errors.contactPhone ? 'border-red-500' : ''}
                                />
                                {index === 0 && errors.contactPhone && (
                                  <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor={`contact-email-${index}`}>
                                  Email {index === 0 && <span className="text-red-500">*</span>}
                                </Label>
                                <Input
                                  id={`contact-email-${index}`}
                                  type="email"
                                  value={contact.email}
                                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                                  disabled={isViewMode}
                                  className={index === 0 && errors.contactEmail ? 'border-red-500' : ''}
                                />
                                {index === 0 && errors.contactEmail && (
                                  <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No contacts added</p>
                </div>
              )}
            </div>
            </div>{/* end address+contact wrapper */}

            {/* Payment Terms + Trade & Market Information side by side */}
            <div className="grid grid-cols-2 gap-6">

            {/* Payment Terms */}
            <div>
              <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">Payment Terms</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="paymentTermsAsSupplier">Payment Terms as Supplier</Label>
                  <Select
                    value={formData.paymentTermsAsSupplier}
                    onValueChange={(value) => setFormData({ ...formData, paymentTermsAsSupplier: value as PaymentTerms })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="paymentTermsAsSupplier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prepaid">Prepaid</SelectItem>
                      <SelectItem value="15 Days">15 Days</SelectItem>
                      <SelectItem value="30 Days">30 Days</SelectItem>
                      <SelectItem value="60 Days">60 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentTermsAsClient">Payment Terms as Client</Label>
                  <Select
                    value={formData.paymentTermsAsClient}
                    onValueChange={(value) => setFormData({ ...formData, paymentTermsAsClient: value as PaymentTerms })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="paymentTermsAsClient">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prepaid">Prepaid</SelectItem>
                      <SelectItem value="15 Days">15 Days</SelectItem>
                      <SelectItem value="30 Days">30 Days</SelectItem>
                      <SelectItem value="60 Days">60 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit || 0}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    disabled={isViewMode}
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {renderCurrencyOptions()}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 md:col-span-4">
                  <Label htmlFor="creditTerms">Credit Terms</Label>
                  <Textarea
                    id="creditTerms"
                    value={formData.creditTerms || ''}
                    onChange={(e) => setFormData({ ...formData, creditTerms: e.target.value })}
                    disabled={isViewMode}
                    rows={2}
                    placeholder="Additional credit terms and conditions..."
                  />
                </div>
              </div>
            </div>

            {/* Trade & Market Information */}
            <div>
              <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">Trade & Market Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="defaultServiceType">Service Types Offered</Label>
                  <Select
                    value={formData.defaultServiceType}
                    onValueChange={(value) => setFormData({ ...formData, defaultServiceType: value as DefaultServiceType })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="defaultServiceType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sea">Sea Freight</SelectItem>
                      <SelectItem value="Air">Air Freight</SelectItem>
                      <SelectItem value="Road">Road / Trucking</SelectItem>
                      <SelectItem value="Rail">Rail Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  {isViewMode ? (
                    <>
                      <Label htmlFor="mainTrades">Main / Preferred Trades</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.mainTrades && formData.mainTrades.length > 0 ? (
                          formData.mainTrades.map((countryCode) => (
                            <Badge
                              key={countryCode}
                              variant="secondary"
                              className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              {getCountryName(countryCode)}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No preferred trades selected</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <MultiSelectCountry
                      selectedCountries={formData.mainTrades || []}
                      onChange={(countries) => setFormData({ ...formData, mainTrades: countries })}
                      label="Main / Preferred Trades"
                      placeholder="Search and select countries representing preferred trade lanes..."
                      maxDisplay={10}
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Select countries to help the system match this partner with relevant loads and pricing opportunities.
                    Useful for Pricing Department rate suggestions and future marketplace matching.
                  </p>
                </div>
              </div>
            </div>
            </div>{/* end payment+trade wrapper */}

            {/* Rating & Notes */}
            <div>
              <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">Rating & Notes</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                <div>
                  <Label htmlFor="rating">Partner Rating (1–5)</Label>
                  <Select
                    value={String(formData.rating || 3)}
                    onValueChange={(value) => setFormData({ ...formData, rating: Number(value) })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger id="rating">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 — Poor</SelectItem>
                      <SelectItem value="2">2 — Below Average</SelectItem>
                      <SelectItem value="3">3 — Average</SelectItem>
                      <SelectItem value="4">4 — Good</SelectItem>
                      <SelectItem value="5">5 — Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 md:col-span-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={isViewMode}
                    rows={3}
                    placeholder="Internal notes about this partner..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Addresses Section - CRUD Format */}
        {activeSection === 'delivery' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-900">Delivery Addresses</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Manage multiple delivery locations for this partner
                  </p>
                </div>
                {!isViewMode && (
                  <Button type="button" variant="outline" onClick={addDeliveryAddress} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Address
                  </Button>
                )}
              </div>

              {formData.deliveryAddresses && formData.deliveryAddresses.length > 0 ? (
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 text-sm text-gray-600">
                    <div className="col-span-3">Address Name</div>
                    <div className="col-span-3">Location</div>
                    <div className="col-span-2">Contact Person</div>
                    <div className="col-span-2">Phone</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  {/* Address Rows */}
                  {formData.deliveryAddresses.map((address, index) => {
                    const isEditing = editingAddressId === address.id || address.addressName === '';
                    
                    return (
                      <div key={address.id}>
                        {/* Address Row - Read Mode */}
                        {!isEditing && (
                          <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg px-2">
                            <div className="col-span-3">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900">{address.addressName || 'Unnamed Address'}</span>
                                {address.isDefault && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">Default</Badge>
                                )}
                              </div>
                            </div>
                            <div className="col-span-3 text-gray-600 text-sm">
                              {address.city}, {getCountryName(address.country)}
                            </div>
                            <div className="col-span-2 text-gray-600 text-sm">
                              {address.contactPerson || '-'}
                            </div>
                            <div className="col-span-2 text-gray-600 text-sm">
                              {address.contactPhone || '-'}
                            </div>
                            <div className="col-span-1">
                              {address.isDefault ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <div className="col-span-1 flex items-center justify-end gap-1">
                              {!isViewMode && (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingAddress(address.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDeliveryAddress(index)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Address Form - Edit/Create Mode */}
                        {isEditing && (
                          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-gray-900">
                                {address.addressName === '' ? 'New Delivery Address' : 'Edit Delivery Address'}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => saveAddress(address.id)}
                                  className="gap-2 bg-white"
                                >
                                  <Save className="w-4 h-4" />
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (address.addressName === '') {
                                      removeDeliveryAddress(index);
                                    } else {
                                      setEditingAddressId(null);
                                    }
                                  }}
                                  className="gap-2 bg-white"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                              <div className="col-span-2 md:col-span-4">
                                <Label htmlFor={`address-name-${index}`}>
                                  Address Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`address-name-${index}`}
                                  value={address.addressName}
                                  onChange={(e) => updateDeliveryAddress(index, 'addressName', e.target.value)}
                                  disabled={isViewMode}
                                  placeholder="e.g., IKEA Warehouse 2, Distribution Center North"
                                  className="bg-white"
                                />
                              </div>

                              <div className="col-span-2 md:col-span-4">
                                <Label htmlFor={`full-address-${index}`}>
                                  Full Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`full-address-${index}`}
                                  value={address.fullAddress}
                                  onChange={(e) => updateDeliveryAddress(index, 'fullAddress', e.target.value)}
                                  disabled={isViewMode}
                                  placeholder="Street address, building number"
                                  className="bg-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`address-city-${index}`}>
                                  City <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`address-city-${index}`}
                                  value={address.city}
                                  onChange={(e) => updateDeliveryAddress(index, 'city', e.target.value)}
                                  disabled={isViewMode}
                                  className="bg-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`address-country-${index}`}>
                                  Country <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={address.country}
                                  onValueChange={(value) => updateDeliveryAddress(index, 'country', value)}
                                  disabled={isViewMode}
                                >
                                  <SelectTrigger id={`address-country-${index}`} className="bg-white">
                                    <SelectValue placeholder="Select country..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {countries.map(c => (
                                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor={`address-zip-${index}`}>Zip Code</Label>
                                <Input
                                  id={`address-zip-${index}`}
                                  value={address.zipCode}
                                  onChange={(e) => updateDeliveryAddress(index, 'zipCode', e.target.value)}
                                  disabled={isViewMode}
                                  className="bg-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`address-contact-${index}`}>Contact Person</Label>
                                <Input
                                  id={`address-contact-${index}`}
                                  value={address.contactPerson}
                                  onChange={(e) => updateDeliveryAddress(index, 'contactPerson', e.target.value)}
                                  disabled={isViewMode}
                                  className="bg-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`address-phone-${index}`}>Contact Phone</Label>
                                <Input
                                  id={`address-phone-${index}`}
                                  value={address.contactPhone}
                                  onChange={(e) => updateDeliveryAddress(index, 'contactPhone', e.target.value)}
                                  disabled={isViewMode}
                                  className="bg-white"
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-6">
                                <input
                                  type="checkbox"
                                  id={`address-default-${index}`}
                                  checked={address.isDefault}
                                  onChange={(e) => updateDeliveryAddress(index, 'isDefault', e.target.checked)}
                                  disabled={isViewMode}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                />
                                <Label htmlFor={`address-default-${index}`} className="cursor-pointer">
                                  Set as default delivery address
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <h4 className="text-gray-900 mb-1">No Delivery Addresses</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Add delivery addresses for this partner to manage multiple locations
                  </p>
                  {!isViewMode && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addDeliveryAddress} 
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Address
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Address Modal */}
            <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Delivery Address</DialogTitle>
                  <DialogDescription>
                    Enter the delivery address details for this partner. Required fields are marked with an asterisk (*).
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 py-3">
                  <div className="col-span-2 md:col-span-4">
                    <Label htmlFor="modal-address-name">
                      Address Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-address-name"
                      value={newAddressData.addressName}
                      onChange={(e) => updateNewAddressField('addressName', e.target.value)}
                      placeholder="e.g., Main Warehouse, Distribution Center North"
                    />
                  </div>

                  <div className="col-span-2 md:col-span-4">
                    <Label htmlFor="modal-full-address">
                      Full Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-full-address"
                      autoComplete="off"
                      value={newAddressData.fullAddress}
                      onChange={(e) => updateNewAddressField('fullAddress', e.target.value)}
                      placeholder="e.g., 123 Industrial Park Road, Building 5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modal-address-city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-address-city"
                      autoComplete="off"
                      value={newAddressData.city}
                      onChange={(e) => updateNewAddressField('city', e.target.value)}
                      placeholder="e.g., Dubai, Shanghai"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modal-address-country">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newAddressData.country}
                      onValueChange={(value) => updateNewAddressField('country', value)}
                    >
                      <SelectTrigger id="modal-address-country">
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="modal-address-zipcode">Zip Code</Label>
                    <Input
                      id="modal-address-zipcode"
                      autoComplete="off"
                      value={newAddressData.zipCode}
                      onChange={(e) => updateNewAddressField('zipCode', e.target.value)}
                      placeholder="e.g., 12345"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modal-address-contact">Contact Person</Label>
                    <Input
                      id="modal-address-contact"
                      autoComplete="off"
                      value={newAddressData.contactPerson}
                      onChange={(e) => updateNewAddressField('contactPerson', e.target.value)}
                      placeholder="e.g., John Smith"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modal-address-phone">Contact Phone</Label>
                    <Input
                      id="modal-address-phone"
                      autoComplete="off"
                      value={newAddressData.contactPhone}
                      onChange={(e) => updateNewAddressField('contactPhone', e.target.value)}
                      placeholder="e.g., +971 50 123 4567"
                    />
                  </div>

                  <div className="col-span-2 md:col-span-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="modal-address-default"
                      checked={newAddressData.isDefault}
                      onChange={(e) => updateNewAddressField('isDefault', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <Label htmlFor="modal-address-default" className="cursor-pointer">
                      Set as default delivery address
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  {addressModalError && (
                    <p className="text-red-500 text-sm mr-auto">{addressModalError}</p>
                  )}
                  <Button type="button" variant="outline" onClick={handleCancelNewAddress}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSaveNewAddress}>
                    Add Delivery Address
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Bank Details Section - CRUD Format */}
        {activeSection === 'bank' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-900">Bank Details</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Manage multiple bank accounts for this partner
                  </p>
                </div>
                {!isViewMode && (
                  <Button type="button" variant="outline" onClick={addBankDetails} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Bank
                  </Button>
                )}
              </div>

              {formData.bankDetails && formData.bankDetails.length > 0 ? (
                <div className="space-y-4">
                  {/* Table Header - Scrollable for many columns */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                      <div className="grid grid-cols-20 gap-3 pb-3 border-b border-gray-200 text-sm text-gray-600">
                        <div className="col-span-3">Bank Name</div>
                        <div className="col-span-2">SWIFT Code</div>
                        <div className="col-span-3">IBAN</div>
                        <div className="col-span-2">Account Number</div>
                        <div className="col-span-2">Currency</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-3">Intermediary Bank</div>
                        <div className="col-span-2">Intermediary SWIFT</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>

                      {/* Bank Rows */}
                      {formData.bankDetails.map((bank, index) => {
                        const isEditing = editingBankId === bank.id || bank.bankName === '';
                        
                        return (
                          <div key={bank.id}>
                            {/* Bank Row - Read Mode */}
                            {!isEditing && (
                              <div className="grid grid-cols-20 gap-3 items-center py-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg px-2">
                                <div className="col-span-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 text-sm">{bank.bankName || 'Unnamed Bank'}</span>
                                    {bank.isDefault && (
                                      <Badge className="bg-green-100 text-green-800 text-xs">Default</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="col-span-2 text-gray-600 text-sm">
                                  {bank.swift || '-'}
                                </div>
                                <div className="col-span-3 text-gray-600 text-sm truncate">
                                  {bank.iban || '-'}
                                </div>
                                <div className="col-span-2 text-gray-600 text-sm truncate">
                                  {bank.accountNumber || '-'}
                                </div>
                                <div className="col-span-2">
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">{bank.currency}</Badge>
                                </div>
                                <div className="col-span-1">
                                  {bank.isDefault ? (
                                    <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                                  )}
                                </div>
                                <div className="col-span-3 text-gray-600 text-sm truncate">
                                  {bank.intermediaryBankName || '-'}
                                </div>
                                <div className="col-span-2 text-gray-600 text-sm">
                                  {bank.intermediarySwift || '-'}
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-1">
                                  {!isViewMode && (
                                    <>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEditingBank(bank.id)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeBankDetails(index)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                        {/* Bank Form - Edit/Create Mode */}
                        {isEditing && (
                          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-gray-900">
                                {bank.bankName === '' ? 'New Bank Account' : 'Edit Bank Account'}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => saveBank(bank.id)}
                                  className="gap-2 bg-white"
                                >
                                  <Save className="w-4 h-4" />
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (bank.bankName === '') {
                                      removeBankDetails(index);
                                    } else {
                                      setEditingBankId(null);
                                    }
                                  }}
                                  className="gap-2 bg-white"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                              <div className="col-span-2 md:col-span-4">
                                <Label htmlFor={`bank-name-${index}`}>
                                  Bank Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`bank-name-${index}`}
                                  value={bank.bankName}
                                  onChange={(e) => updateBankDetails(index, 'bankName', e.target.value)}
                                  disabled={isViewMode}
                                  placeholder="e.g., HSBC Bank, Bank of America"
                                  className="bg-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`bank-swift-${index}`}>
                                  SWIFT Code
                                </Label>
                                <Input
                                  id={`bank-swift-${index}`}
                                  value={bank.swift}
                                  onChange={(e) => updateBankDetails(index, 'swift', e.target.value)}
                                  disabled={isViewMode}
                                  placeholder="e.g., HSBCAEAD"
                                  className="bg-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`bank-iban-${index}`}>IBAN</Label>
                                <Input
                                  id={`bank-iban-${index}`}
                                  value={bank.iban}
                                  onChange={(e) => updateBankDetails(index, 'iban', e.target.value)}
                                  disabled={isViewMode}
                                  placeholder="e.g., AE070331234567890123456"
                                  className="bg-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`bank-account-${index}`}>Account Number</Label>
                                <Input
                                  id={`bank-account-${index}`}
                                  value={bank.accountNumber}
                                  onChange={(e) => updateBankDetails(index, 'accountNumber', e.target.value)}
                                  disabled={isViewMode}
                                  className="bg-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`bank-currency-${index}`}>
                                  Currency <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={bank.currency}
                                  onValueChange={(value) => updateBankDetails(index, 'currency', value)}
                                  disabled={isViewMode}
                                >
                                  <SelectTrigger id={`bank-currency-${index}`} className="bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {renderCurrencyOptions()}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="col-span-2 md:col-span-4 border-t pt-3 mt-1">
                                <h4 className="text-gray-700 mb-3 text-sm">Intermediary Bank (Optional)</h4>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                  <div>
                                    <Label htmlFor={`intermediary-bank-${index}`}>Intermediary Bank Name</Label>
                                    <Input
                                      id={`intermediary-bank-${index}`}
                                      value={bank.intermediaryBankName}
                                      onChange={(e) => updateBankDetails(index, 'intermediaryBankName', e.target.value)}
                                      disabled={isViewMode}
                                      className="bg-white"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor={`intermediary-swift-${index}`}>Intermediary SWIFT</Label>
                                    <Input
                                      id={`intermediary-swift-${index}`}
                                      value={bank.intermediarySwift}
                                      onChange={(e) => updateBankDetails(index, 'intermediarySwift', e.target.value)}
                                      disabled={isViewMode}
                                      className="bg-white"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2">
                                <input
                                  type="checkbox"
                                  id={`bank-default-${index}`}
                                  checked={bank.isDefault}
                                  onChange={(e) => updateBankDetails(index, 'isDefault', e.target.checked)}
                                  disabled={isViewMode}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                />
                                <Label htmlFor={`bank-default-${index}`} className="cursor-pointer">
                                  Set as default bank account
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <h4 className="text-gray-900 mb-1">No Bank Details</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Add bank accounts for this partner to manage payment information
                  </p>
                  {!isViewMode && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addBankDetails} 
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Bank
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Bank Details Modal */}
            <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Bank Account</DialogTitle>
                  <DialogDescription>
                    Enter the bank account details for this partner. Required fields are marked with an asterisk (*).
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 py-3">
                  <div className="col-span-2 md:col-span-4">
                    <Label htmlFor="modal-bank-name">
                      Bank Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-bank-name"
                      value={newBankData.bankName}
                      onChange={(e) => updateNewBankField('bankName', e.target.value)}
                      placeholder="e.g., HSBC Bank, Bank of America"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modal-swift">
                      SWIFT Code
                    </Label>
                    <Input
                      id="modal-swift"
                      value={newBankData.swift}
                      onChange={(e) => updateNewBankField('swift', e.target.value)}
                      placeholder="e.g., HSBCAEAD"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modal-currency">
                      Currency <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newBankData.currency}
                      onValueChange={(value) => updateNewBankField('currency', value)}
                    >
                      <SelectTrigger id="modal-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {renderCurrencyOptions()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="modal-iban">IBAN</Label>
                    <Input
                      id="modal-iban"
                      value={newBankData.iban}
                      onChange={(e) => updateNewBankField('iban', e.target.value)}
                      placeholder="e.g., AE070331234567890123456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="modal-account">Account Number</Label>
                    <Input
                      id="modal-account"
                      value={newBankData.accountNumber}
                      onChange={(e) => updateNewBankField('accountNumber', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 md:col-span-4 border-t pt-3 mt-1">
                    <h4 className="text-gray-700 mb-3">Intermediary Bank (Optional)</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      <div>
                        <Label htmlFor="modal-intermediary-bank">Intermediary Bank Name</Label>
                        <Input
                          id="modal-intermediary-bank"
                          value={newBankData.intermediaryBankName}
                          onChange={(e) => updateNewBankField('intermediaryBankName', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="modal-intermediary-swift">Intermediary SWIFT</Label>
                        <Input
                          id="modal-intermediary-swift"
                          value={newBankData.intermediarySwift}
                          onChange={(e) => updateNewBankField('intermediarySwift', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="modal-bank-default"
                      checked={newBankData.isDefault}
                      onChange={(e) => updateNewBankField('isDefault', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <Label htmlFor="modal-bank-default" className="cursor-pointer">
                      Set as default bank account
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  {bankModalError && (
                    <p className="text-red-500 text-sm mr-auto">{bankModalError}</p>
                  )}
                  <Button type="button" variant="outline" onClick={handleCancelNewBank}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSaveNewBank}>
                    Add Bank Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Trade & Market Information Section - List CRUD Format */}
        {activeSection === 'trade' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-900">Trade & Market Information</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Define the commercial scope under which this partner provides rates to your system
                  </p>
                </div>
                {!isViewMode && (
                  <Button type="button" variant="outline" onClick={addTradeInfo} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Trade Info
                  </Button>
                )}
              </div>

              {formData.tradeMarketInfo && formData.tradeMarketInfo.length > 0 ? (
                <div className="space-y-3">
                  {formData.tradeMarketInfo.map((trade, index) => {
                    return (
                      <div key={trade.id} className="border border-gray-200 rounded-lg p-5 bg-white hover:border-gray-300 transition-colors">
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-gray-900 font-medium">
                                {trade.countryOfOrigin && trade.countryOfDestination 
                                  ? `${getCountryName(trade.countryOfOrigin)} → ${getCountryName(trade.countryOfDestination)}`
                                  : trade.countryOfOrigin 
                                    ? getCountryName(trade.countryOfOrigin)
                                    : `Trade Route ${index + 1}`
                                }
                              </h4>
                              {trade.preferredCorridor && (
                                <p className="text-sm text-gray-600 mt-0.5">{trade.preferredCorridor}</p>
                              )}
                            </div>
                          </div>
                          {!isViewMode && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTradeInfo(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                          {trade.modeOfTransport && (
                            <div>
                              <span className="text-gray-500 block mb-1">Mode of Transport</span>
                              <span className="text-gray-900">{trade.modeOfTransport}</span>
                            </div>
                          )}
                          {trade.modeOfTrailer && (
                            <div>
                              <span className="text-gray-500 block mb-1">Mode of Trailer</span>
                              <span className="text-gray-900">{trade.modeOfTrailer}</span>
                            </div>
                          )}
                          {trade.totalAnnualVolume && (
                            <div>
                              <span className="text-gray-500 block mb-1">Total Annual Volume</span>
                              <span className="text-gray-900">{trade.totalAnnualVolume}</span>
                            </div>
                          )}
                          {trade.placeOfLoading && (
                            <div>
                              <span className="text-gray-500 block mb-1">Place of Loading</span>
                              <span className="text-gray-900">{trade.placeOfLoading}</span>
                            </div>
                          )}
                          {trade.pol && (
                            <div>
                              <span className="text-gray-500 block mb-1">POL</span>
                              <span className="text-gray-900">{getPortName(trade.pol)}</span>
                            </div>
                          )}
                          {trade.pod && (
                            <div>
                              <span className="text-gray-500 block mb-1">POD</span>
                              <span className="text-gray-900">{getPortName(trade.pod)}</span>
                            </div>
                          )}
                          {trade.finalDestination && (
                            <div>
                              <span className="text-gray-500 block mb-1">Final Destination</span>
                              <span className="text-gray-900">{trade.finalDestination}</span>
                            </div>
                          )}
                          {trade.preferredCarrierId && (
                            <div>
                              <span className="text-gray-500 block mb-1">Preferred Carrier</span>
                              <span className="text-gray-900">
                                {allPartners.find(p => p.id === trade.preferredCarrierId)?.tradingName || 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Globe className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <h4 className="text-gray-900 mb-1">No Trade & Market Information</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Define where and how this partner's rates apply
                  </p>
                  {!isViewMode && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addTradeInfo} 
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Trade Info
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Trade & Market Info Modal */}
            <Dialog open={showTradeModal} onOpenChange={setShowTradeModal}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Trade & Market Information</DialogTitle>
                  <DialogDescription>
                    Define the commercial scope under which this partner provides rates. All fields are optional.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 py-3">
                  {/* Origin & Destination */}
                  <div>
                    <Label htmlFor="countryOfOrigin">Country of Origin</Label>
                    <Select
                      value={newTradeData.countryOfOrigin || ''}
                      onValueChange={(value) => updateNewTradeField('countryOfOrigin', value)}
                    >
                      <SelectTrigger id="countryOfOrigin">
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="countryOfDestination">Country of Destination</Label>
                    <Select
                      value={newTradeData.countryOfDestination || ''}
                      onValueChange={(value) => updateNewTradeField('countryOfDestination', value)}
                    >
                      <SelectTrigger id="countryOfDestination">
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Loading & Routing */}
                  <div>
                    <Label htmlFor="placeOfLoading">Place of Loading</Label>
                    <Input
                      id="placeOfLoading"
                      placeholder="e.g., Tirana"
                      value={newTradeData.placeOfLoading || ''}
                      onChange={(e) => updateNewTradeField('placeOfLoading', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pol">POL – Port of Loading</Label>
                    <Select
                      value={newTradeData.pol || ''}
                      onValueChange={(value) => updateNewTradeField('pol', value)}
                    >
                      <SelectTrigger id="pol">
                        <SelectValue placeholder="Select port..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ports.map((port) => (
                          <SelectItem key={port.code} value={port.code}>
                            {port.name} ({port.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="pod">POD – Port of Discharge</Label>
                    <Select
                      value={newTradeData.pod || ''}
                      onValueChange={(value) => updateNewTradeField('pod', value)}
                    >
                      <SelectTrigger id="pod">
                        <SelectValue placeholder="Select port..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ports.map((port) => (
                          <SelectItem key={port.code} value={port.code}>
                            {port.name} ({port.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="finalDestination">Final Destination</Label>
                    <Input
                      id="finalDestination"
                      placeholder="e.g., Tirana, Albania"
                      value={newTradeData.finalDestination || ''}
                      onChange={(e) => updateNewTradeField('finalDestination', e.target.value)}
                    />
                  </div>

                  {/* Volume & Commercial Scope */}
                  <div>
                    <Label htmlFor="totalAnnualVolume">Total Annual Volume</Label>
                    <Input
                      id="totalAnnualVolume"
                      placeholder="e.g., 500 TEU, 1,000 CBM"
                      value={newTradeData.totalAnnualVolume || ''}
                      onChange={(e) => updateNewTradeField('totalAnnualVolume', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferredCarrierId">Preferred Carrier</Label>
                    <Select
                      value={newTradeData.preferredCarrierId || ''}
                      onValueChange={(value) => updateNewTradeField('preferredCarrierId', value)}
                    >
                      <SelectTrigger id="preferredCarrierId">
                        <SelectValue placeholder="Select carrier..." />
                      </SelectTrigger>
                      <SelectContent>
                        {carrierPartners.map((carrier) => (
                          <SelectItem key={carrier.id} value={carrier.id}>
                            {carrier.tradingName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferredCorridor">Preferred Corridor</Label>
                    <Input
                      id="preferredCorridor"
                      placeholder="e.g., Adriatic Express"
                      value={newTradeData.preferredCorridor || ''}
                      onChange={(e) => updateNewTradeField('preferredCorridor', e.target.value)}
                    />
                  </div>

                  {/* Transport & Equipment */}
                  <div>
                    <Label htmlFor="modeOfTransport">Mode of Transport</Label>
                    <Select
                      value={newTradeData.modeOfTransport || ''}
                      onValueChange={(value) => updateNewTradeField('modeOfTransport', value as any)}
                    >
                      <SelectTrigger id="modeOfTransport">
                        <SelectValue placeholder="Select mode..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sea">Sea</SelectItem>
                        <SelectItem value="Air">Air</SelectItem>
                        <SelectItem value="Road">Road</SelectItem>
                        <SelectItem value="Rail">Rail</SelectItem>
                        <SelectItem value="Intermodal">Intermodal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="modeOfTrailer">Mode of Trailer</Label>
                    <Select
                      value={newTradeData.modeOfTrailer || ''}
                      onValueChange={(value) => updateNewTradeField('modeOfTrailer', value as any)}
                    >
                      <SelectTrigger id="modeOfTrailer">
                        <SelectValue placeholder="Select trailer..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Curtain Sider">Curtain Sider</SelectItem>
                        <SelectItem value="Box Trailer">Box Trailer</SelectItem>
                        <SelectItem value="Flatbed">Flatbed</SelectItem>
                        <SelectItem value="Reefer">Reefer</SelectItem>
                        <SelectItem value="Tanker">Tanker</SelectItem>
                        <SelectItem value="Lowbed">Lowbed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCancelNewTrade}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSaveNewTrade}>
                    Add Trade Information
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Attachments Section - CRUD Format */}
        {activeSection === 'attachments' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-900">Attachments</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Upload contracts, certificates, and other documents
                  </p>
                </div>
                {!isViewMode && (
                  <Button type="button" variant="outline" onClick={addDocument} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Document
                  </Button>
                )}
              </div>

              {formData.documents && formData.documents.length > 0 ? (
                <div className="space-y-2">
                  {formData.documents.map((doc, index) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-900">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                            <span>•</span>
                            <span>Uploaded on {doc.uploadedDate}</span>
                            <span>•</span>
                            <span>by {doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>
                      {!isViewMode && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <Paperclip className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-gray-900 mb-2">No Documents Uploaded</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Upload contracts, business certificates, owner ID, and other documents
                    </p>
                    <p className="text-gray-500 text-xs mb-4">
                      Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                    </p>
                    {!isViewMode && (
                      <Button type="button" variant="outline" onClick={addDocument} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add First Document
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
