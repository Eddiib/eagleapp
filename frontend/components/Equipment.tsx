import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { EquipmentType } from '../types/equipment';
import { EquipmentList } from './EquipmentList';
import { EquipmentFormModal } from './EquipmentFormModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { equipmentApi } from '../services/equipment';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmDialog';

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

export function Equipment() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadEquipment = () => {
    setLoading(true);
    setLoadError(null);
    equipmentApi.getAll()
      .then(setEquipment)
      .catch(err => setLoadError(err.message || 'Failed to load equipment'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const handleCreateNew = () => {
    setSaveError(null);
    setViewMode('create');
    setSelectedId(null);
  };

  const handleViewDetail = (id: string) => {
    setSelectedId(id);
    setViewMode('detail');
  };

  const handleEdit = (id: string) => {
    setSaveError(null);
    setSelectedId(id);
    setViewMode('edit');
  };

  const handleToggleActive = async (id: string) => {
    const item = equipment.find(e => e.id === id);
    if (!item) return;

    if (item.isActive) {
      const msg = item.usedInBookings > 0
        ? 'This equipment type is used in bookings. It will be marked as inactive but kept for historical records. Continue?'
        : 'Are you sure you want to deactivate this equipment type?';
      const ok = await confirmDialog({
        title: 'Deactivate equipment type?',
        message: msg,
        confirmLabel: 'Deactivate',
      });
      if (!ok) return;
    }

    try {
      await equipmentApi.update(id, { ...item, isActive: !item.isActive }, user?.username);
      setEquipment(prev =>
        prev.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e)
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleSave = async (data: Partial<EquipmentType>) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (viewMode === 'create') {
        const result = await equipmentApi.create(data, user?.username);
        const created = await equipmentApi.getById(result.id);
        setEquipment(prev => [created, ...prev]);
      } else if (viewMode === 'edit' && selectedId) {
        await equipmentApi.update(selectedId, data, user?.username);
        setEquipment(prev =>
          prev.map(item =>
            item.id === selectedId ? { ...item, ...data } : item
          )
        );
      }
      setViewMode('list');
      setSelectedId(null);
    } catch (err: any) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedId(null);
    setSaveError(null);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (loadError) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-red-600">{loadError}</p>
    </div>
  );

  const selectedEquipment = selectedId
    ? equipment.find(item => item.id === selectedId)
    : undefined;

  return (
    <div>
      {viewMode === 'list' && (
        <EquipmentList
          equipment={equipment}
          onCreateNew={handleCreateNew}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
        />
      )}

      {viewMode === 'create' && (
        <EquipmentFormModal
          mode="create"
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
          saveError={saveError}
        />
      )}

      {viewMode === 'edit' && selectedEquipment && (
        <EquipmentFormModal
          initialData={selectedEquipment}
          mode="edit"
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
          saveError={saveError}
        />
      )}

      {viewMode === 'detail' && selectedEquipment && (
        <EquipmentDetailModal
          equipment={selectedEquipment}
          onEdit={() => handleEdit(selectedEquipment.id)}
          onToggleActive={() => handleToggleActive(selectedEquipment.id)}
          onClose={handleCancel}
        />
      )}
    </div>
  );
}
