import { Service, ServiceGroup } from '../types/service';
import { ServiceForm } from './ServiceForm';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useConfirm } from '../context/ConfirmDialog';

interface ServiceFormModalProps {
  mode: 'create' | 'edit';
  initialData?: Service;
  serviceGroups?: ServiceGroup[];
  onSave: (data: Partial<Service>, options?: { keepOpen?: boolean }) => Promise<boolean | void>;
  onCancel: () => void;
  isSaving?: boolean;
  error?: string | null;
}

export function ServiceFormModal({
  mode,
  initialData,
  serviceGroups,
  onSave,
  onCancel,
  isSaving = false,
  error,
}: ServiceFormModalProps) {
  const confirmDialog = useConfirm();
  const [dirty, setDirty] = useState(false);

  const guardedClose = useCallback(async () => {
    if (isSaving) return;
    if (!dirty) {
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
  }, [dirty, isSaving, onCancel, confirmDialog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') guardedClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guardedClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <div
        className="relative my-auto flex w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <h2 className="text-lg text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'Create New Service' : 'Edit Service'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {mode === 'create'
                ? 'Add a new service to the master catalog'
                : 'Update service information'}
            </p>
          </div>
          <button
            type="button"
            onClick={guardedClose}
            disabled={isSaving}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ServiceForm
          mode={mode}
          initialData={initialData}
          serviceGroups={serviceGroups}
          onSave={onSave}
          onCancel={onCancel}
          onDirtyChange={setDirty}
          isSaving={isSaving}
          error={error}
        />
      </div>
    </div>
  );
}
