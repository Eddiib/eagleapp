import { useCallback, useEffect, useState, ComponentProps } from 'react';
import { Partner } from '../types/partner';
import { PartnersList } from './PartnersList';
import { PartnerForm } from './PartnerForm';
import { PartnerProfile } from './PartnerProfile';
import { X, Loader2 } from 'lucide-react';
import { partnersApi } from '../services/partners';
import { invalidatePartnersCache, usePartners } from '../hooks/usePartners';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmDialog';

// The partner form needs the full partner list (for its carrier picker), but the
// list view itself is paginated. This wrapper only mounts when the create/edit
// modal opens, so simply browsing the list never fetches every partner.
function PartnerFormWithPartners(props: Omit<ComponentProps<typeof PartnerForm>, 'allPartners'>) {
  const { partners } = usePartners();
  return <PartnerForm {...props} allPartners={partners} />;
}

export function Partners() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit' | 'view'>('view');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [listKey, setListKey] = useState(0);
  const [dirty, setDirty] = useState(false);

  const refreshList = () => {
    invalidatePartnersCache();
    setListKey(k => k + 1);
  };

  const closeForm = useCallback(() => {
    setIsFormModalOpen(false);
    setSelectedPartner(null);
    setSaveError(null);
    setDirty(false);
  }, []);

  const guardedClose = useCallback(async () => {
    if (saving) return;
    if (!dirty) {
      closeForm();
      return;
    }
    const ok = await confirmDialog({
      title: 'Discard changes?',
      message: 'You have unsaved changes. Closing this form will lose them.',
      tone: 'danger',
      confirmLabel: 'Discard',
    });
    if (ok) closeForm();
  }, [dirty, saving, confirmDialog, closeForm]);

  useEffect(() => {
    if (!isFormModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') guardedClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFormModalOpen, guardedClose]);

  const handleViewPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setView('detail');
  };

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormMode('edit');
    setSaveError(null);
    setDirty(false);
    setIsFormModalOpen(true);
  };

  const handleNewPartner = () => {
    setSelectedPartner(null);
    setFormMode('new');
    setSaveError(null);
    setDirty(false);
    setIsFormModalOpen(true);
  };

  const handleDeletePartner = async (partnerId: string) => {
    const ok = await confirmDialog({
      title: 'Delete partner?',
      message: 'This will permanently delete the partner and all related contacts, addresses, banks and lanes. This cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await partnersApi.delete(partnerId);
      refreshList();
      if (view === 'detail') {
        setView('list');
        setSelectedPartner(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedPartner(null);
  };

  const handleEditFromProfile = () => {
    if (selectedPartner) {
      setFormMode('edit');
      setSaveError(null);
      setDirty(false);
      setIsFormModalOpen(true);
    }
  };

  const handleSavePartner = async (partnerData: Partial<Partner>) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (formMode === 'new') {
        await partnersApi.create(partnerData, user?.username);
      } else if (formMode === 'edit' && selectedPartner?.id) {
        await partnersApi.update(selectedPartner.id, partnerData, user?.username);
      }
      closeForm();
      refreshList();
    } catch (err: any) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {view === 'list' && (
        <PartnersList
          key={listKey}
          onViewPartner={handleViewPartner}
          onEditPartner={handleEditPartner}
          onDeletePartner={handleDeletePartner}
          onNewPartner={handleNewPartner}
        />
      )}

      {view === 'detail' && selectedPartner && (
        <PartnerProfile
          partner={selectedPartner}
          onBack={handleBackToList}
          onEdit={handleEditFromProfile}
        />
      )}

      {/* Partner Form Modal */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) guardedClose(); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col" role="dialog" aria-modal="true">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-gray-900 dark:text-white">
                  {formMode === 'new' ? 'New Partner' : 'Edit Partner'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {formMode === 'new'
                    ? 'Add a new partner to your network'
                    : 'Update partner information'}
                </p>
              </div>
              <button
                onClick={guardedClose}
                disabled={saving}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <PartnerFormWithPartners
                partner={selectedPartner}
                mode={formMode}
                onSave={handleSavePartner}
                onCancel={guardedClose}
                onDirtyChange={setDirty}
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-800">
              {saveError && (
                <span className="text-sm text-red-600 dark:text-red-400 mr-auto">{saveError}</span>
              )}
              <button
                type="button"
                onClick={guardedClose}
                disabled={saving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="partner-form"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : formMode === 'new' ? 'Create Partner' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
