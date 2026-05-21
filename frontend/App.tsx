import { BookingList } from './components/BookingList';
import { BookingHeader } from './components/BookingHeader';
import { TabsNav } from './components/TabsNav';
import { BookingEquipmentEditor } from './components/BookingEquipmentEditor';
import { EquipmentServicesView } from './components/EquipmentServicesView';
import { BookingDocsTab } from './components/BookingDocsTab';
import { BookingDetails } from './components/BookingDetails';
import { Sidebar } from './components/Sidebar';
import { LeftSidebar } from './components/LeftSidebar';
import { SalesLeads } from './components/SalesLeads';
import { Partners } from './components/Partners';
import { CostControl } from './components/CostControl';
import { CostControlForm } from './components/CostControlForm';
import { CostEntry } from './services/costControl';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { Invoice, invoicesApi } from './services/invoices';
import { Receivables } from './components/Receivables';
import { Payables } from './components/Payables';
import { UserManagement } from './components/UserManagement';
import { ExchangeRatesManager } from './components/ExchangeRatesManager';
import { PnL } from './components/PnL';
import { AuditLog } from './components/AuditLog';
import { CompanySettings } from './components/CompanySettings';
import { MeetingMinutes } from './components/MeetingMinutes';
import { QuotationDeskManager } from './components/QuotationDeskManager';
import { PricingDepartment } from './components/pricing/PricingDepartment';
import { EmployeesModule, Employee } from './components/EmployeesModule';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeDetail } from './components/EmployeeDetail';
import { ServiceManagement } from './components/ServiceManagement';
import { Equipment } from './components/Equipment';
import { Dashboard } from './components/Dashboard';
import { TopNav } from './components/TopNav';
import { LoginPage } from './components/LoginPage';
import { employeesApi } from './services/employees';
import {
  Booking,
  BookingServiceLine,
  BookingEquipmentLine,
  BookingServiceType,
  bookingsApi,
  bookingToPayload,
  emptyBooking,
  generateBookingNumber,
} from './services/bookings';
import { useAuth } from './context/AuthContext';
import { useConfirm } from './context/ConfirmDialog';
import { useCompanySettings } from './context/CompanySettingsContext';
import { useLocation } from 'react-router-dom';
import { moduleIdToPath, pathToModuleId, MODULE_TITLES } from './router';
import { useTabs } from './context/TabsContext';
import { modulePermission } from './lib/modulePermissions';
import { toast } from 'sonner';
import { useCallback, useState, useEffect } from 'react';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#030213] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <AppShell />;
}

function mapPrefillServiceType(value?: string): BookingServiceType {
  switch (value) {
    case 'Air':  return 'Air';
    case 'Road': return 'Road';
    case 'LCL':  return 'LCL';
    default:     return 'FCL';
  }
}

function applyLeadDataToDraft(draft: Booking, leadData: any): Booking {
  if (!leadData) return draft;
  return {
    ...draft,
    clientId: leadData.clientId || leadData.partnerId || draft.clientId,
    originCountry: leadData.originCountry || draft.originCountry,
    originPort: leadData.originPort || draft.originPort,
    destinationCountry: leadData.destinationCountry || draft.destinationCountry,
    destinationPort: leadData.destinationPort || draft.destinationPort,
    serviceType: mapPrefillServiceType(leadData.serviceType),
    sourceSalesLeadId: leadData.sourceSalesLeadId || draft.sourceSalesLeadId,
    sourceQuotationId: leadData.sourceQuotationId || draft.sourceQuotationId,
  };
}

function AccessDenied() {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
        <h2 className="mb-2">Access denied</h2>
        <p className="text-sm">Your role does not include permission for this module.</p>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, can } = useAuth();
  const { baseCurrency } = useCompanySettings();
  const confirmDialog = useConfirm();
  const location = useLocation();
  const { openTab, navigateInActiveTab, setNavigationGuard } = useTabs();
  const activeModule = pathToModuleId(location.pathname);
  const [activeTab, setActiveTab] = useState('equipment');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookingView, setBookingView] = useState<'list' | 'detail'>('list');

  // Booking editor state — single draft that Header + Form + Sidebar all mutate.
  const [bookingDraft, setBookingDraft] = useState<Booking | null>(null);
  const [editServices, setEditServices] = useState<BookingServiceLine[]>([]);
  const [editEquipment, setEditEquipment] = useState<BookingEquipmentLine[]>([]);
  const [bookingMode, setBookingMode] = useState<'view' | 'edit' | 'new'>('view');
  const [, setLeadDataForBooking] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // bookingListKey: incrementing this forces BookingList to re-mount and re-fetch
  const [bookingListKey, setBookingListKey] = useState(0);
  const refreshBookingList = () => setBookingListKey(k => k + 1);

  // Track whether the booking editor (header + form + tabs) has pending edits.
  // Set by every patch and cleared on save / discard. Used as a guard when the
  // user navigates away mid-edit via the LeftSidebar.
  const [bookingDirty, setBookingDirty] = useState(false);

  // Employees Module State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeView, setEmployeeView] = useState<'list' | 'detail' | 'form'>('list');
  const [employeeMode, setEmployeeMode] = useState<'create' | 'edit'>('create');
  const [employeeBusy, setEmployeeBusy] = useState(false);
  const [employeesListKey, setEmployeesListKey] = useState(0);

  const refreshEmployeesList = () => setEmployeesListKey(k => k + 1);

  // Invoicing module state
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceListKey, setInvoiceListKey] = useState(0);
  const refreshInvoiceList = () => setInvoiceListKey((k) => k + 1);

  // Cost Control form state
  const [costFormOpen, setCostFormOpen] = useState(false);
  const [editingCostEntry, setEditingCostEntry] = useState<CostEntry | null>(null);
  const [costControlKey, setCostControlKey] = useState(0);
  const refreshCostControl = () => setCostControlKey((k) => k + 1);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('eagleLogisticsDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [incompleteInvoicesCount, setIncompleteInvoicesCount] = useState(0);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('eagleLogisticsDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const canViewInvoicing = can(modulePermission('invoicing'));

  useEffect(() => {
    if (!canViewInvoicing) {
      setIncompleteInvoicesCount(0);
      return;
    }
    let cancelled = false;
    invoicesApi.getAll()
      .then((invoices) => {
        if (cancelled) return;
        setIncompleteInvoicesCount(
          invoices.filter((invoice) => !['Paid', 'Cancelled', 'Void'].includes(invoice.status)).length,
        );
      })
      .catch(() => {
        if (!cancelled) setIncompleteInvoicesCount(0);
      });
    return () => { cancelled = true; };
  }, [canViewInvoicing, invoiceListKey]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // If someone opens /bookings/new directly (no draft in memory), redirect to the list.
  useEffect(() => {
    if (activeModule === 'new-booking' && !bookingDraft) {
      navigateInActiveTab(moduleIdToPath('booking-sheet'), { replace: true });
    }
  }, [activeModule, bookingDraft, navigateInActiveTab]);

  const isNewBookingModule = activeModule === 'new-booking';
  const isBookingSheetModule = activeModule === 'booking-sheet';
  const isBookingDetailsModule = activeModule === 'booking-details';
  const isMeetingMinutesModule = activeModule === 'meeting-minutes';
  const isSalesLeadsModule = activeModule === 'sales-leads';
  const isPartnersModule = activeModule === 'partners-management';
  const isCostControlModule    = activeModule === 'cost-control';
  const isInvoicingModule      = activeModule === 'invoicing';
  const isReceivablesModule    = activeModule === 'receivables';
  const isPayablesModule       = activeModule === 'payables';
  const isAdministrationModule = activeModule === 'user-management' || activeModule === 'administration';
  const isAuditLogModule       = activeModule === 'audit-log';
  const isCompanySettingsModule = activeModule === 'company-settings';
  const isQuotationDeskModule = activeModule === 'quotation-desk';
  const isEmployeesModule = activeModule === 'employees';
  const isServiceManagementModule = activeModule === 'service-management';
  const isEquipmentModule = activeModule === 'equipment';
  const isDashboardModule = activeModule === 'main-dashboard';
  const isPricingModule = ['available-loads', 'buy-rates-contracts', 'pricing-models', 'supplier-directory'].includes(activeModule);
  const isExchangeRatesModule = activeModule === 'forex-management';
  const isPnLModule = activeModule === 'profit-loss';
  const hasActiveModuleAccess = can(modulePermission(activeModule));
  const canViewBookings = can(modulePermission('booking-sheet'));
  const canEditBookings = can(modulePermission('booking-sheet', 'edit'));

  const confirmModuleNavigation = useCallback(async (targetPath: string) => {
    const targetModule = pathToModuleId(targetPath);
    if (targetModule === activeModule) return true;

    const editingBooking = (bookingMode === 'edit' || bookingMode === 'new') && bookingView === 'detail';
    if (editingBooking && bookingDirty) {
      const ok = await confirmDialog({
        title: 'Discard booking changes?',
        message: 'You have unsaved changes on this booking. Closing this tab will lose them.',
        tone: 'danger',
        confirmLabel: 'Discard',
      });
      if (!ok) return false;
      setBookingDirty(false);
    }

    return true;
  }, [activeModule, bookingDirty, bookingMode, bookingView, confirmDialog]);

  useEffect(() => {
    setNavigationGuard(confirmModuleNavigation);
    return () => setNavigationGuard(null);
  }, [confirmModuleNavigation, setNavigationGuard]);

  const stagedModuleTitles: Record<string, string> = {
    'receivables': 'Receivables',
    'payables': 'Payables',
    'bank-transactions': 'Bank Transactions',
    'forex-management': 'Forex Management',
    'profit-loss': 'Profit & Loss',
    'tax-compliance': 'Tax Compliance',
    'administration': 'Administration',
  };

  const renderStagedModule = (title: string, description: string) => (
    <div className="p-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
        <h2 className="mb-2">{title}</h2>
        <p className="text-sm text-amber-800 dark:text-amber-200">{description}</p>
      </div>
    </div>
  );

  const handleModuleChange = async (moduleId: string) => {
    if (moduleId === activeModule) return;
    const opened = await openTab(moduleIdToPath(moduleId), MODULE_TITLES[moduleId]);
    if (!opened) return;
    if (moduleId === 'booking-sheet') {
      setBookingView('list');
      setBookingDraft(null);
    }
    if (moduleId === 'employees') {
      setEmployeeView('list');
      setSelectedEmployee(null);
    }
  };

  const loadBookingIntoEditor = async (booking: Booking) => {
    setSaveError(null);
    const full = await bookingsApi.getById(booking.id);
    setBookingDraft(full);
    setEditServices(full.services);
    setEditEquipment(full.equipment);
    setBookingDirty(false);
  };

  const handleViewBooking = async (booking: Booking) => {
    try {
      await loadBookingIntoEditor(booking);
      setBookingMode('view');
      setBookingView('detail');
    } catch (err: any) {
      alert(err?.message || 'Failed to load booking');
    }
  };

  const handleEditBooking = async (booking: Booking) => {
    try {
      await loadBookingIntoEditor(booking);
      setBookingMode('edit');
      setBookingView('detail');
    } catch (err: any) {
      alert(err?.message || 'Failed to load booking');
    }
  };

  const openCreateBookingWorkspace = async (prefillData: any = null) => {
    setLeadDataForBooking(prefillData);
    const nextBookingNumber = await bookingsApi.getNextNumber().catch(() => generateBookingNumber());
    const base = emptyBooking(nextBookingNumber, baseCurrency);
    const seeded = applyLeadDataToDraft(base, prefillData);
    setBookingDraft(seeded);
    setEditServices([]);
    setEditEquipment([]);
    setSaveError(null);
    setBookingDirty(false);
    setBookingMode('new');
    setBookingView('detail');
    setActiveTab('equipment');
    navigateInActiveTab(moduleIdToPath('new-booking'));
  };

  const handleNewBooking = () => {
    openCreateBookingWorkspace().catch((err: any) => {
      alert(err?.message || 'Failed to start booking creation');
    });
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const ok = await confirmDialog({
      title: 'Delete booking?',
      message: 'This will permanently delete the booking and all its line items. This cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await bookingsApi.delete(bookingId);
      refreshBookingList();
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    }
  };

  const handleBackToList = () => {
    setBookingView('list');
    setBookingDraft(null);
  };

  const handleCancelEdit = async () => {
    if (bookingDirty) {
      const ok = await confirmDialog({
        title: 'Cancel editing?',
        message: 'Any unsaved changes will be lost.',
        confirmLabel: 'Discard changes',
      });
      if (!ok) return;
    }
    setBookingDirty(false);
    setBookingView('list');
    setBookingDraft(null);
  };

  const handleCancelNewBooking = async () => {
    if (bookingDirty) {
      const ok = await confirmDialog({
        title: 'Cancel booking creation?',
        message: 'All unsaved data will be lost.',
        confirmLabel: 'Discard',
      });
      if (!ok) return;
    }
    setBookingDirty(false);
    setLeadDataForBooking(null);
    setBookingDraft(null);
    setEditServices([]);
    setEditEquipment([]);
    setBookingMode('view');
    setBookingView('list');
    navigateInActiveTab(moduleIdToPath('booking-sheet'));
  };

  const handleEnableEdit = () => {
    setSaveError(null);
    setBookingMode('edit');
  };

  const patchDraft = useCallback((patch: Partial<Booking>) => {
    setBookingDraft(prev => (prev ? { ...prev, ...patch } : prev));
    setBookingDirty(true);
  }, []);

  const validateDraft = (d: Booking): string | null => {
    if (!d.consigneeId) return 'Please select a consignee';
    if (editServices.some(s => !s.serviceId)) return 'All service lines need a service selected';
    if (editEquipment.some(e => !e.equipmentId)) return 'All equipment lines need an equipment type selected';
    if (d.estimatedDeparture && d.estimatedArrival && new Date(d.estimatedArrival) < new Date(d.estimatedDeparture)) {
      return 'ETA cannot be earlier than ETD';
    }
    if (d.estimatedDeparture && d.cargoReadinessDate && new Date(d.cargoReadinessDate) > new Date(d.estimatedDeparture)) {
      return 'Cargo readiness date must be on or before ETD';
    }
    const BL_RE = /^[A-Z0-9-]{3,30}$/i;
    const REF_RE = /^[A-Za-z0-9_\-./ ]{2,40}$/;
    if (d.masterBl?.trim() && !BL_RE.test(d.masterBl.trim())) return 'Master B/L looks malformed';
    if (d.houseBl?.trim()  && !BL_RE.test(d.houseBl.trim()))  return 'House B/L looks malformed';
    if (d.carrierRef?.trim() && !REF_RE.test(d.carrierRef.trim()))   return 'Carrier ref looks malformed';
    if (d.supplierRef?.trim() && !REF_RE.test(d.supplierRef.trim())) return 'Supplier ref looks malformed';
    return null;
  };

  const persistDraft = async () => {
    if (!bookingDraft) return;
    const problem = validateDraft(bookingDraft);
    if (problem) {
      setSaveError(problem);
      toast.error(problem);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = bookingToPayload(bookingDraft, editServices, editEquipment);
      if (bookingMode === 'new') {
        const { bookingNumber: _bookingNumber, ...createPayload } = payload;
        const created = await bookingsApi.create(createPayload, user?.username);
        const refreshed = await bookingsApi.getById(created.id);
        setBookingDraft(refreshed);
        setEditServices(refreshed.services);
        setEditEquipment(refreshed.equipment);
        setLeadDataForBooking(null);
        setBookingDirty(false);
        refreshBookingList();
        navigateInActiveTab(moduleIdToPath('booking-sheet'));
        setBookingMode('view');
        setBookingView('detail');
        setActiveTab('equipment');
        toast.success(`Booking ${refreshed.bookingNumber} created`);
      } else if (bookingMode === 'edit' && bookingDraft.id) {
        await bookingsApi.update(bookingDraft.id, payload, user?.username);
        const refreshed = await bookingsApi.getById(bookingDraft.id);
        setBookingDraft(refreshed);
        setEditServices(refreshed.services);
        setEditEquipment(refreshed.equipment);
        setBookingDirty(false);
        refreshBookingList();
        setBookingMode('view');
        toast.success('Booking saved');
      }
    } catch (err: any) {
      const msg = err?.message || 'Save failed';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBookingFromLead = (leadData: any) => {
    openCreateBookingWorkspace(leadData).catch((err: any) => {
      alert(err?.message || 'Failed to start booking creation');
    });
  };
  const handleConvertQuotationToBooking = (quotationData: any) => {
    openCreateBookingWorkspace(quotationData).catch((err: any) => {
      alert(err?.message || 'Failed to start booking creation');
    });
  };

  const handleGenerateInvoiceFromBooking = (booking: Booking) => {
    if (!booking.id) return;
    const today = new Date().toISOString().split('T')[0];
    const seed = {
      invoiceType: 'Sales' as const,
      status: 'Draft' as const,
      clientId: booking.clientId || undefined,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      invoiceDate: today,
      currency: booking.currency || baseCurrency,
      exchangeRate: 1,
      lines: [],
    } as unknown as Invoice;
    setEditingInvoice(seed);
    setInvoiceFormOpen(true);
    navigateInActiveTab(moduleIdToPath('invoicing'));
  };

  const handleCloseEmployeeForm = () => {
    if (employeeMode === 'edit' && selectedEmployee) {
      setEmployeeView('detail');
      return;
    }
    setEmployeeView('list');
    setSelectedEmployee(null);
  };

  const handleEmployeeSave = async (employee: Employee, options?: { saveAndNew?: boolean }) => {
    setEmployeeBusy(true);
    try {
      let refreshedEmployee: Employee;
      if (employeeMode === 'create') {
        const created = await employeesApi.create(employee);
        refreshedEmployee = await employeesApi.getById(created.id);
      } else {
        await employeesApi.update(employee.id, employee);
        refreshedEmployee = await employeesApi.getById(employee.id);
      }

      refreshEmployeesList();

      if (options?.saveAndNew) {
        setSelectedEmployee(null);
        setEmployeeMode('create');
        setEmployeeView('form');
        return;
      }

      setSelectedEmployee(refreshedEmployee);
      setEmployeeMode('edit');
      setEmployeeView('detail');
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to save employee');
    } finally {
      setEmployeeBusy(false);
    }
  };

  const handleToggleEmployeeActive = async (employeeId: string) => {
    if (!selectedEmployee || employeeBusy || selectedEmployee.id !== employeeId) return;

    setEmployeeBusy(true);
    try {
      await employeesApi.update(employeeId, {
        ...selectedEmployee,
        isActive: !selectedEmployee.isActive,
      });
      const refreshedEmployee = await employeesApi.getById(employeeId);
      setSelectedEmployee(refreshedEmployee);
      refreshEmployeesList();
    } catch (err: any) {
      alert(err?.message || 'Failed to update employee');
    } finally {
      setEmployeeBusy(false);
    }
  };

  const renderBookingEditorShell = (mode: 'view' | 'edit' | 'new') => {
    if (!bookingDraft) return null;
    return (
      <div className="flex flex-col">
        <BookingHeader
          bookingMode={mode}
          onBack={mode === 'new' ? handleCancelNewBooking : handleBackToList}
          draft={bookingDraft}
          onChange={patchDraft}
          onEdit={mode === 'view' ? handleEnableEdit : undefined}
          onSave={mode === 'view' ? undefined : persistDraft}
          onCancel={mode === 'new' ? handleCancelNewBooking : mode === 'edit' ? handleCancelEdit : undefined}
          saving={saving}
          error={saveError}
          onGenerateInvoice={
            mode === 'view' && bookingDraft.id
              ? () => handleGenerateInvoiceFromBooking(bookingDraft)
              : undefined
          }
        />
        <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex flex-1">
          <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-80' : 'mr-0'}`}>
            <div className="p-6">
              {activeTab === 'equipment' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <BookingEquipmentEditor
                    value={editEquipment}
                    onChange={(next) => { setEditEquipment(next); setBookingDirty(true); }}
                    disabled={mode === 'view'}
                  />
                </div>
              )}
              {activeTab === 'services' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <EquipmentServicesView equipment={editEquipment} />
                </div>
              )}
              {activeTab === 'docs' && (
                <BookingDocsTab
                  bookingId={bookingDraft.id || null}
                  attachments={bookingDraft.attachments}
                  onAttachmentsChange={(next) => patchDraft({ attachments: next })}
                  disabled={mode === 'view'}
                  uploadedBy={user?.username}
                />
              )}
            </div>
          </main>
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            bookingId={bookingDraft.id || null}
            disabled={mode === 'view'}
            internalNotes={bookingDraft.internalNotes}
            freeTextComments={bookingDraft.freeTextComments}
            onInternalNotesChange={(v) => patchDraft({ internalNotes: v })}
            onFreeTextCommentsChange={(v) => patchDraft({ freeTextComments: v })}
            attachments={bookingDraft.attachments}
            onAttachmentsChange={(next) => patchDraft({ attachments: next })}
            uploadedBy={user?.username}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E]">
      <LeftSidebar
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        incompleteInvoicesCount={incompleteInvoicesCount}
      />

      <div className="ml-60">
        <TopNav onToggleDarkMode={toggleDarkMode} darkMode={darkMode} />

        {!hasActiveModuleAccess ? (
          <AccessDenied />
        ) : isDashboardModule ? (
          <Dashboard
            onNewBooking={canEditBookings ? handleNewBooking : undefined}
            onViewAllBookings={canViewBookings ? () => { navigateInActiveTab(moduleIdToPath('booking-sheet')); setBookingView('list'); } : undefined}
            onViewBooking={async (booking: any) => {
              if (!canViewBookings) return;
              if (!booking?.id) return;
              try {
                const full = await bookingsApi.getById(booking.id);
                navigateInActiveTab(moduleIdToPath('booking-sheet'));
                setBookingDraft(full);
                setEditServices(full.services);
                setEditEquipment(full.equipment);
                setBookingMode('view');
                setBookingView('detail');
              } catch (err) {
                console.error('Failed to load booking', err);
              }
            }}
          />
        ) : isMeetingMinutesModule ? (
          <div className="p-6">
            <MeetingMinutes />
          </div>
        ) : isSalesLeadsModule ? (
          <div className="p-6">
            <SalesLeads onCreateBookingFromLead={canEditBookings ? handleCreateBookingFromLead : undefined} />
          </div>
        ) : isPartnersModule ? (
          <div className="p-6">
            <Partners />
          </div>
        ) : isCostControlModule ? (
          <div className="p-6">
            <CostControl
              key={costControlKey}
              onAddEntry={() => { setEditingCostEntry(null); setCostFormOpen(true); }}
              onEditEntry={(entry) => { setEditingCostEntry(entry); setCostFormOpen(true); }}
            />
            {costFormOpen && (
              <CostControlForm
                entry={editingCostEntry}
                mode={editingCostEntry ? 'edit' : 'add'}
                onSaved={() => { setCostFormOpen(false); setEditingCostEntry(null); refreshCostControl(); }}
                onCancel={() => { setCostFormOpen(false); setEditingCostEntry(null); }}
              />
            )}
          </div>
        ) : isQuotationDeskModule ? (
          <div className="p-6">
            <QuotationDeskManager onConvertToBooking={canEditBookings ? handleConvertQuotationToBooking : undefined} />
          </div>
        ) : isPricingModule ? (
          <div className="p-6">
            <PricingDepartment activeSubModule={activeModule} />
          </div>
        ) : isEmployeesModule ? (
          <div className="h-screen flex flex-col pt-16">
            <EmployeesModule
              key={employeesListKey}
              onEmployeeSelect={(employee) => { setSelectedEmployee(employee); setEmployeeView('detail'); }}
              onEditEmployee={(employee) => { setSelectedEmployee(employee); setEmployeeMode('edit'); setEmployeeView('form'); }}
              onCreateNew={() => { setSelectedEmployee(null); setEmployeeMode('create'); setEmployeeView('form'); }}
            />
            {employeeView === 'detail' && selectedEmployee && (
              <EmployeeDetail
                employee={selectedEmployee}
                onClose={() => { setEmployeeView('list'); setSelectedEmployee(null); }}
                onEdit={() => { setEmployeeMode('edit'); setEmployeeView('form'); }}
                onToggleActive={handleToggleEmployeeActive}
                busy={employeeBusy}
              />
            )}
            {employeeView === 'form' && (
              <EmployeeForm
                employee={selectedEmployee || undefined}
                mode={employeeMode}
                onSave={handleEmployeeSave}
                onCancel={handleCloseEmployeeForm}
              />
            )}
          </div>
        ) : isServiceManagementModule ? (
          <div className="p-6">
            <ServiceManagement />
          </div>
        ) : isEquipmentModule ? (
          <div className="p-6">
            <Equipment />
          </div>
        ) : isNewBookingModule ? (
          renderBookingEditorShell('new')
        ) : isBookingDetailsModule ? (
          <div className="p-6">
            <BookingDetails
              onNavigateToBooking={async (bookingId) => {
                try {
                  const full = await bookingsApi.getById(bookingId);
                  navigateInActiveTab(moduleIdToPath('booking-sheet'));
                  setBookingDraft(full);
                  setEditServices(full.services);
                  setEditEquipment(full.equipment);
                  setBookingDirty(false);
                  setBookingMode('view');
                  setBookingView('detail');
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load booking');
                }
              }}
            />
          </div>
        ) : isBookingSheetModule ? (
          bookingView === 'list' ? (
            <BookingList
              key={bookingListKey}
              onViewBooking={handleViewBooking}
              onEditBooking={canEditBookings ? handleEditBooking : undefined}
              onDeleteBooking={canEditBookings ? handleDeleteBooking : undefined}
              onNewBooking={canEditBookings ? handleNewBooking : undefined}
            />
          ) : (
            renderBookingEditorShell(bookingMode)
          )
        ) : isReceivablesModule ? (
          <div className="p-6"><Receivables /></div>
        ) : isPayablesModule ? (
          <div className="p-6"><Payables /></div>
        ) : isAdministrationModule ? (
          <div className="p-6"><UserManagement /></div>
        ) : isAuditLogModule ? (
          <div className="p-6"><AuditLog /></div>
        ) : isCompanySettingsModule ? (
          <div className="p-6"><CompanySettings /></div>
        ) : isExchangeRatesModule ? (
          <div className="p-6"><ExchangeRatesManager /></div>
        ) : isPnLModule ? (
          <div className="p-6"><PnL /></div>
        ) : isInvoicingModule ? (
          <div className="p-6">
            <InvoiceList
              key={invoiceListKey}
              onNew={() => { setEditingInvoice(null); setInvoiceFormOpen(true); }}
              onEdit={(inv) => { setEditingInvoice(inv); setInvoiceFormOpen(true); }}
            />
            {invoiceFormOpen && (
              <InvoiceForm
                invoice={editingInvoice}
                mode={editingInvoice ? 'edit' : 'new'}
                onSaved={() => { setInvoiceFormOpen(false); setEditingInvoice(null); refreshInvoiceList(); }}
                onCancel={() => { setInvoiceFormOpen(false); setEditingInvoice(null); }}
              />
            )}
          </div>
        ) : (
          renderStagedModule(
            stagedModuleTitles[activeModule] || 'Staged Module',
            'This module is intentionally staged and is not part of the current MVP release. Use the documented live modules and check the known limitations list for deferred areas.'
          )
        )}
      </div>
    </div>
  );
}
