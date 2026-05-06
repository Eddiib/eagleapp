import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { ServiceGroups } from './ServiceGroups';
import { ServicesTable } from './ServicesTable';
import { ServiceDetailDrawer } from './ServiceDetailDrawer';
import { ServiceFormModal } from './ServiceFormModal';
import { Service, ServiceGroup } from '../types/service';
import { servicesApi } from '../services/services';
import { useAuth } from '../context/AuthContext';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function ServiceManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'groups' | 'rules' | 'mapping'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialData, setFormInitialData] = useState<Service | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [groupCreateSignal, setGroupCreateSignal] = useState(0);

  const currentUsername = user?.display_name || user?.username || 'System';

  const activeGroups = useMemo(
    () => serviceGroups.filter((group) => group.isActive),
    [serviceGroups]
  );

  const loadServiceData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [serviceRows, groupRows] = await Promise.all([
        servicesApi.getAll(),
        servicesApi.getAllGroups(),
      ]);
      setServices(serviceRows);
      setServiceGroups(groupRows);
      return { serviceRows, groupRows };
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load service management data.');
      setLoadError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiceData().catch(() => {});
  }, []);

  const openCreateService = (initialData?: Service) => {
    setFormInitialData(initialData);
    setFormMode('create');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleViewService = (service: Service) => {
    setSelectedService(service);
    setIsDrawerOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setFormInitialData(service);
    setFormMode('edit');
    setFormError(null);
    setIsDrawerOpen(false);
    setIsFormModalOpen(true);
  };

  const handleDuplicateService = (service: Service) => {
    const existingCodes = new Set(services.map((s) => s.serviceCode));
    let candidate = `${service.serviceCode}-COPY`;
    let n = 2;
    while (existingCodes.has(candidate)) {
      candidate = `${service.serviceCode}-COPY-${n}`;
      n += 1;
    }
    openCreateService({
      ...service,
      serviceCode: candidate,
      serviceName: `${service.serviceName} (Copy)`,
    });
  };

  const refreshServices = async () => {
    const serviceRows = await servicesApi.getAll();
    setServices(serviceRows);
    return serviceRows;
  };

  const handleToggleActive = async (service: Service) => {
    setFormError(null);
    try {
      await servicesApi.update(
        service.id,
        { ...service, isActive: !service.isActive },
        currentUsername
      );
      const updatedServices = await refreshServices();
      if (selectedService?.id === service.id) {
        const updated = updatedServices.find((item) => item.id === service.id) || null;
        setSelectedService(updated);
      }
    } catch (error) {
      setFormError(getErrorMessage(error, 'Failed to update service status.'));
    }
  };

  const handleSaveService = async (
    data: Partial<Service>,
    options?: { keepOpen?: boolean }
  ) => {
    setIsSavingService(true);
    setFormError(null);
    try {
      if (formMode === 'edit' && formInitialData?.id) {
        await servicesApi.update(formInitialData.id, data, currentUsername);
      } else {
        await servicesApi.create(data, currentUsername);
      }

      const updatedServices = await refreshServices();
      if (formMode === 'edit' && formInitialData?.id) {
        const updated = updatedServices.find((item) => item.id === formInitialData.id) || null;
        setSelectedService(updated);
      }

      if (!options?.keepOpen) {
        setIsFormModalOpen(false);
        setFormInitialData(undefined);
      }
      return true;
    } catch (error) {
      setFormError(getErrorMessage(error, 'Failed to save service.'));
      return false;
    } finally {
      setIsSavingService(false);
    }
  };

  const handleCreateGroup = async (data: Partial<ServiceGroup>) => {
    setGroupsError(null);
    try {
      await servicesApi.createGroup(data, currentUsername);
      const nextGroups = await servicesApi.getAllGroups();
      setServiceGroups(nextGroups);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create service group.');
      setGroupsError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const handleUpdateGroup = async (id: string, data: Partial<ServiceGroup>) => {
    setGroupsError(null);
    try {
      await servicesApi.updateGroup(id, data, currentUsername);
      const nextGroups = await servicesApi.getAllGroups();
      setServiceGroups(nextGroups);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update service group.');
      setGroupsError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    setGroupsError(null);
    try {
      await servicesApi.deleteGroup(id);
      const nextGroups = await servicesApi.getAllGroups();
      setServiceGroups(nextGroups);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete service group.');
      setGroupsError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const handleCreateService = () => openCreateService(undefined);

  const tabButton = (
    key: 'services' | 'groups' | 'rules' | 'mapping',
    label: string,
  ) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      className={`border-b-2 px-1 pb-3 text-sm transition-colors ${
        activeTab === key
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Service Management</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage logistics services, surcharges, and service groups
          </p>
        </div>
        {activeTab === 'services' && (
          <button
            onClick={handleCreateService}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Service
          </button>
        )}
        {activeTab === 'groups' && (
          <button
            onClick={() => setGroupCreateSignal((value) => value + 1)}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Service Group
          </button>
        )}
      </div>

      <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
        {tabButton('services', 'Services')}
        {tabButton('groups', 'Service Groups')}
        {tabButton('rules', 'Rules & Units')}
        {tabButton('mapping', 'Mapping')}
      </div>

      <div>
        {loadError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
            {loadError}
          </div>
        )}

        {activeTab === 'services' && (
          <>
            {formError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            {loading ? (
              <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Loading services...
              </div>
            ) : (
              <ServicesTable
                services={services}
                serviceGroups={activeGroups}
                onView={handleViewService}
                onEdit={handleEditService}
                onDuplicate={handleDuplicateService}
                onToggleActive={handleToggleActive}
              />
            )}
          </>
        )}

        {activeTab === 'groups' && (
          <ServiceGroups
            groups={serviceGroups}
            loading={loading}
            error={groupsError}
            createSignal={groupCreateSignal}
            currentUsername={currentUsername}
            onCreate={handleCreateGroup}
            onUpdate={handleUpdateGroup}
            onDelete={handleDeleteGroup}
          />
        )}

        {activeTab === 'rules' && (
          <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
            <h3 className="mb-2 text-gray-900 dark:text-gray-100">Rules & Units</h3>
            <p className="text-gray-600 dark:text-gray-400">
              This tab is staged for the pricing backend work in Phase 6.
            </p>
          </div>
        )}

        {activeTab === 'mapping' && (
          <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
            <h3 className="mb-2 text-gray-900 dark:text-gray-100">Service Mapping</h3>
            <p className="text-gray-600 dark:text-gray-400">
              External mapping is intentionally staged until the pricing model is finalized.
            </p>
          </div>
        )}
      </div>

      <ServiceDetailDrawer
        service={selectedService}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={handleEditService}
      />

      {isFormModalOpen && (
        <ServiceFormModal
          mode={formMode}
          initialData={formInitialData}
          serviceGroups={activeGroups}
          onSave={handleSaveService}
          onCancel={() => {
            if (isSavingService) return;
            setIsFormModalOpen(false);
            setFormInitialData(undefined);
            setFormError(null);
          }}
          isSaving={isSavingService}
          error={formError}
        />
      )}
    </div>
  );
}
