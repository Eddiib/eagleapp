import { useEffect, useMemo, useState, FormEvent } from 'react';
import { exchangeRatesApi } from '../services/exchangeRates';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { useConfirm } from '../context/ConfirmDialog';
import {
  Service,
  ServiceCategory,
  ServiceGroup,
  TransportMode,
  AppliesTo,
  ChargeUnit,
  BuySellType,
  PriceBehavior,
  PartnerType,
  LocationType,
} from '../types/service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-react';

interface ServiceFormProps {
  mode: 'create' | 'edit';
  initialData?: Service;
  serviceGroups?: ServiceGroup[];
  onSave: (data: Partial<Service>, options?: { keepOpen?: boolean }) => Promise<boolean | void>;
  onCancel: () => void;
  /** Notifies parent (the modal) whether the form has unsaved edits. */
  onDirtyChange?: (dirty: boolean) => void;
  isSaving?: boolean;
  error?: string | null;
}

const EMPTY_FORM: Partial<Service> = {
  serviceCode: '',
  serviceName: '',
  category: 'Main Freight',
  transportModes: [],
  appliesTo: [],
  chargeUnit: 'Per Container',
  defaultCurrency: 'USD',
  buySellType: 'Both',
  defaultVatRate: 0,
  defaultGlCode: '',
  priceBehavior: 'Fixed',
  pricingModelId: '',
  relatedPartnerTypes: [],
  locationType: 'Not location-specific',
  documentationRequired: false,
  mandatoryForShipmentTypes: [],
  isActive: true,
  visibleToSales: true,
  visibleToMarketplace: false,
  notes: '',
};

const CATEGORIES: ServiceCategory[] = [
  'Main Freight',
  'Local Charge (Origin)',
  'Local Charge (Destination)',
  'Documentation',
  'Handling / Terminal',
  'Trucking',
  'Warehouse',
  'Value-Added Service',
];

const TRANSPORT_MODES: TransportMode[] = ['Sea', 'Air', 'Road', 'Rail', 'Parcel', 'Multimodal'];

const APPLIES_TO_TYPES: AppliesTo[] = ['FCL', 'LCL', 'FTL', 'LTL', 'Air', 'Parcel', 'Rail', 'Other'];

const CHARGE_UNITS: ChargeUnit[] = [
  'Per Container',
  'Per TEU',
  'Per FFE',
  'Per Truck',
  'Per BL / AWB',
  'Per Shipment',
  'Per Booking',
  'Per CBM',
  'Per Ton',
  'Per KG',
  'Per Pallet',
  'Per Document',
  'Per Day',
  'Per Hour',
];

const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CNY', 'JPY', 'CAD', 'AUD', 'SGD'];

const LOCATION_TYPES: LocationType[] = [
  'At Origin',
  'At Destination',
  'In Transit',
  'Not location-specific',
];

const PARTNER_TYPES: PartnerType[] = [
  'Client',
  'Buyer',
  'Shipping Line',
  'Air Carrier',
  'Trucking Company',
  'Rail Operator',
  'Overseas Agent',
  'Customs Broker',
  'Warehouse / Depot',
  'Insurance Company',
  'Surveyor / Inspector',
  'Special Services Provider',
  'Other',
];

const NO_GROUP_VALUE = '__none__';

export function ServiceForm({
  mode,
  initialData,
  serviceGroups,
  onSave,
  onCancel,
  onDirtyChange,
  isSaving = false,
  error,
}: ServiceFormProps) {
  const initialFormData = useMemo<Partial<Service>>(
    () => ({ ...EMPTY_FORM, ...initialData }),
    [initialData],
  );
  const [formData, setFormData] = useState<Partial<Service>>(initialFormData);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    basic: true,
    charging: true,
    pricing: false,
    operational: false,
    system: false,
  });

  const confirmDialog = useConfirm();
  const { baseCurrency } = useCompanySettings();
  const [knownCurrencies, setKnownCurrencies] = useState<string[]>([]);

  useEffect(() => {
    exchangeRatesApi
      .getAll()
      .then((rates) => {
        const set = new Set<string>();
        for (const r of rates) {
          if (r.from_currency) set.add(r.from_currency.toUpperCase());
          if (r.to_currency) set.add(r.to_currency.toUpperCase());
        }
        setKnownCurrencies(Array.from(set));
      })
      .catch(() => { /* fallback list still applies */ });
  }, []);

  const currencyOptions = useMemo(() => {
    const set = new Set<string>(COMMON_CURRENCIES);
    if (baseCurrency) set.add(baseCurrency.toUpperCase());
    for (const c of knownCurrencies) set.add(c);
    return Array.from(set).sort();
  }, [baseCurrency, knownCurrencies]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData],
  );

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const guardedCancel = async () => {
    if (!isDirty) {
      onCancel();
      return;
    }
    const ok = await confirmDialog({
      title: 'Discard changes?',
      message: 'You have unsaved changes. Closing this form will lose them.',
      tone: 'danger',
      confirmLabel: 'Discard',
    });
    if (ok) onCancel();
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (e: FormEvent | null, saveAndNew = false) => {
    e?.preventDefault();
    if (isSaving) return;

    if (!formData.serviceCode?.trim() || !formData.serviceName?.trim()) {
      setValidationError('Service Code and Service Name are required.');
      return;
    }
    if (!formData.category) {
      setValidationError('Service Category is required.');
      return;
    }
    if (!formData.chargeUnit) {
      setValidationError('Charge Unit is required.');
      return;
    }
    const vat = Number(formData.defaultVatRate ?? 0);
    if (Number.isNaN(vat) || vat < 0 || vat > 100) {
      setValidationError('Default VAT Rate must be between 0 and 100.');
      return;
    }
    const mandatorySet = new Set(formData.mandatoryForShipmentTypes ?? []);
    const appliesToSet = new Set(formData.appliesTo ?? []);
    for (const m of mandatorySet) {
      if (!appliesToSet.has(m)) {
        setValidationError(`"${m}" is marked mandatory but not in Applies To.`);
        return;
      }
    }

    setValidationError(null);

    const payload: Partial<Service> = { ...formData };
    if (payload.priceBehavior !== 'Formula-based') {
      payload.pricingModelId = '';
    }

    const saved = await onSave(payload, { keepOpen: saveAndNew });
    if (saved === false) return;
    if (saveAndNew) setFormData({ ...EMPTY_FORM });
  };

  const toggleArrayItem = <T extends string>(field: keyof Service, item: T) => {
    const current = (formData[field] as T[]) || [];
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    setFormData({ ...formData, [field]: next });
  };

  const sectionHeader = (
    title: string,
    description: string,
    section: keyof typeof openSections,
    suffix?: string,
  ) => (
    <CollapsibleTrigger className="w-full">
      <CardHeader className="cursor-pointer hover:bg-accent/40">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <CardTitle>
              {title}
              {suffix && <span className="ml-2 text-muted-foreground">{suffix}</span>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {openSections[section] ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
    </CollapsibleTrigger>
  );

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className="flex max-h-[calc(100vh-8rem)] flex-col"
    >
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {(validationError || error) && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
            {validationError || error}
          </div>
        )}

        {/* Basic Information */}
        <Collapsible open={openSections.basic} onOpenChange={() => toggleSection('basic')}>
          <Card>
            {sectionHeader('Basic Information', 'Service identification and classification', 'basic')}
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="serviceCode">
                      Service Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="serviceCode"
                      autoFocus={mode === 'create'}
                      value={formData.serviceCode}
                      onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                      placeholder="e.g. SF-001"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceName">
                      Service Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="serviceName"
                      value={formData.serviceName}
                      onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                      placeholder="e.g. Ocean Freight"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="category">Service Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: ServiceCategory) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="serviceGroupId">Service Group</Label>
                    <Select
                      value={formData.serviceGroupId || NO_GROUP_VALUE}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          serviceGroupId: value === NO_GROUP_VALUE ? null : value,
                        })
                      }
                    >
                      <SelectTrigger id="serviceGroupId" className="mt-1">
                        <SelectValue placeholder={serviceGroups?.length ? 'Select group…' : 'No groups defined'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_GROUP_VALUE}>— None —</SelectItem>
                        {(serviceGroups || []).map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.groupName} <span className="text-muted-foreground">({g.groupCode})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Mode of Transport (multi-select)</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TRANSPORT_MODES.map((m) => (
                      <label
                        key={m}
                        htmlFor={`mode-${m}`}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <Checkbox
                          id={`mode-${m}`}
                          checked={formData.transportModes?.includes(m)}
                          onCheckedChange={() => toggleArrayItem<TransportMode>('transportModes', m)}
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Applies To (multi-select)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {APPLIES_TO_TYPES.map((t) => (
                      <Badge
                        key={t}
                        className={`cursor-pointer ${
                          formData.appliesTo?.includes(t)
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                        onClick={() => toggleArrayItem<AppliesTo>('appliesTo', t)}
                      >
                        {t}
                        {formData.appliesTo?.includes(t) && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Charging Logic */}
        <Collapsible open={openSections.charging} onOpenChange={() => toggleSection('charging')}>
          <Card>
            {sectionHeader('Charging Logic', 'Define how this service is charged', 'charging')}
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="chargeUnit">Charge Unit</Label>
                  <Select
                    value={formData.chargeUnit}
                    onValueChange={(value: ChargeUnit) => setFormData({ ...formData, chargeUnit: value })}
                  >
                    <SelectTrigger id="chargeUnit" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHARGE_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Input
                      id="defaultCurrency"
                      list="serviceform-currency-options"
                      value={formData.defaultCurrency || ''}
                      maxLength={3}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultCurrency: e.target.value.toUpperCase().replace(/[^A-Z]/g, ''),
                        })
                      }
                      placeholder={baseCurrency || 'EUR'}
                      className="mt-1"
                    />
                    <datalist id="serviceform-currency-options">
                      {currencyOptions.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-xs text-muted-foreground">
                      3-letter ISO code · suggestions from Exchange Rates &amp; Company Settings
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultVatRate">Default VAT Rate (%)</Label>
                    <Input
                      id="defaultVatRate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={formData.defaultVatRate ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultVatRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Buy / Sell / Both</Label>
                  <RadioGroup
                    value={formData.buySellType}
                    onValueChange={(value: BuySellType) => setFormData({ ...formData, buySellType: value })}
                    className="mt-2 flex gap-4"
                  >
                    {(['Buy', 'Sell', 'Both'] as BuySellType[]).map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <RadioGroupItem value={v} id={`bs-${v}`} />
                        <Label htmlFor={`bs-${v}`} className="cursor-pointer">{v}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="defaultGlCode">Default GL / Account Code</Label>
                  <Input
                    id="defaultGlCode"
                    value={formData.defaultGlCode || ''}
                    onChange={(e) => setFormData({ ...formData, defaultGlCode: e.target.value })}
                    placeholder="e.g. 4100-FREIGHT"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Pricing Behavior */}
        <Collapsible open={openSections.pricing} onOpenChange={() => toggleSection('pricing')}>
          <Card>
            {sectionHeader('Pricing Behavior', 'Configure pricing logic for this service', 'pricing', '(Advanced)')}
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="priceBehavior">Price Behavior</Label>
                  <Select
                    value={formData.priceBehavior}
                    onValueChange={(value: PriceBehavior) =>
                      setFormData({
                        ...formData,
                        priceBehavior: value,
                        // Clear orphaned model id when leaving Formula-based
                        pricingModelId: value === 'Formula-based' ? formData.pricingModelId : '',
                      })
                    }
                  >
                    <SelectTrigger id="priceBehavior" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                      <SelectItem value="Tiered">Tiered</SelectItem>
                      <SelectItem value="Formula-based">Formula-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.priceBehavior === 'Formula-based' && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200">
                    Pricing models are managed in the Pricing module (not yet wired to this form).
                    The behavior is saved and will resolve once pricing models go live.
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Operational Information */}
        <Collapsible open={openSections.operational} onOpenChange={() => toggleSection('operational')}>
          <Card>
            {sectionHeader('Operational Information', 'Service operational requirements', 'operational')}
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div>
                  <Label>Related Partner Types (multi-select)</Label>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PARTNER_TYPES.map((t) => (
                      <label
                        key={t}
                        htmlFor={`pt-${t}`}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <Checkbox
                          id={`pt-${t}`}
                          checked={formData.relatedPartnerTypes?.includes(t)}
                          onCheckedChange={() => toggleArrayItem<PartnerType>('relatedPartnerTypes', t)}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="locationType">Origin / Destination Type</Label>
                  <Select
                    value={formData.locationType}
                    onValueChange={(value: LocationType) => setFormData({ ...formData, locationType: value })}
                  >
                    <SelectTrigger id="locationType" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="documentationRequired"
                    checked={formData.documentationRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, documentationRequired: checked as boolean })
                    }
                  />
                  <Label htmlFor="documentationRequired" className="cursor-pointer">
                    Documentation Required
                  </Label>
                </div>

                <div>
                  <Label>Mandatory for Shipment Types</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Must also appear in &ldquo;Applies To&rdquo;.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {APPLIES_TO_TYPES.map((t) => (
                      <Badge
                        key={t}
                        className={`cursor-pointer ${
                          formData.mandatoryForShipmentTypes?.includes(t)
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                        onClick={() => toggleArrayItem<AppliesTo>('mandatoryForShipmentTypes', t)}
                      >
                        {t}
                        {formData.mandatoryForShipmentTypes?.includes(t) && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* System Fields */}
        <Collapsible open={openSections.system} onOpenChange={() => toggleSection('system')}>
          <Card>
            {sectionHeader('System Fields', 'Visibility and status settings', 'system')}
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label htmlFor="isActive" className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                    />
                    Active
                  </label>
                  <label htmlFor="visibleToSales" className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      id="visibleToSales"
                      checked={formData.visibleToSales}
                      onCheckedChange={(checked) => setFormData({ ...formData, visibleToSales: checked as boolean })}
                    />
                    Visible to Sales
                  </label>
                  <label htmlFor="visibleToMarketplace" className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      id="visibleToMarketplace"
                      checked={formData.visibleToMarketplace}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, visibleToMarketplace: checked as boolean })
                      }
                    />
                    Visible to External Marketplace
                    <span className="text-muted-foreground">(future use)</span>
                  </label>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes or instructions..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/60">
        <Button type="button" onClick={guardedCancel} variant="ghost" disabled={isSaving}>
          Cancel
        </Button>
        {mode === 'create' && (
          <Button
            type="button"
            onClick={() => handleSubmit(null, true)}
            variant="outline"
            disabled={isSaving}
          >
            <Plus className="mr-1 h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save & New'}
          </Button>
        )}
        <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
