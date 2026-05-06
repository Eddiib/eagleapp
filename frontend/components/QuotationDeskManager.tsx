import { useState } from 'react';
import { QuotationDesk } from './QuotationDesk';
import { QuotationForm } from './QuotationForm';
import { QuotationDetail } from './QuotationDetail';
import { RejectionReasonModal } from './RejectionReasonModal';
import { Quotation, QuotationPayload, quotationsApi } from '../services/quotations';
import { useConfirm } from '../context/ConfirmDialog';

interface QuotationDeskManagerProps {
  onConvertToBooking?: (quotationData: any) => void;
}

function toPayload(quotation: Quotation, patch: Partial<QuotationPayload> = {}): QuotationPayload {
  return {
    quoteNumber: quotation.quoteNumber,
    status: quotation.status,
    clientId: quotation.clientId,
    modeOfTransport: quotation.modeOfTransport,
    originCountry: quotation.originCountry,
    originPort: quotation.originPort,
    destinationCountry: quotation.destinationCountry,
    destinationPort: quotation.destinationPort,
    validUntil: quotation.validUntil,
    totalSell: quotation.totalSell,
    totalCost: quotation.totalCost,
    currency: quotation.currency,
    notes: quotation.notes,
    rejectionReason: quotation.rejectionReason,
    services: quotation.services,
    ...patch,
  };
}

export function QuotationDeskManager({ onConvertToBooking }: QuotationDeskManagerProps) {
  const confirmDialog = useConfirm();
  const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshList = () => setRefreshKey((value) => value + 1);

  const loadQuotation = async (quotationId: string) => {
    const full = await quotationsApi.getById(quotationId);
    setSelectedQuotation(full);
    return full;
  };

  const handleViewQuotation = async (quotation: Quotation) => {
    await loadQuotation(quotation.id);
    setView('detail');
  };

  const handleEditQuotation = async (quotation: Quotation) => {
    await loadQuotation(quotation.id);
    setFormMode('edit');
    setView('form');
  };

  const handleNewQuotation = () => {
    setSelectedQuotation(null);
    setFormMode('new');
    setView('form');
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    await quotationsApi.delete(quotationId);
    if (selectedQuotation?.id === quotationId) {
      setSelectedQuotation(null);
    }
    refreshList();
  };

  const handleSaveQuotation = async (quotationData: QuotationPayload) => {
    if (formMode === 'new') {
      const result = await quotationsApi.create(quotationData);
      const created = await quotationsApi.getById(result.id);
      setSelectedQuotation(created);
    } else if (selectedQuotation) {
      await quotationsApi.update(selectedQuotation.id, quotationData);
      const updated = await quotationsApi.getById(selectedQuotation.id);
      setSelectedQuotation(updated);
    }
    refreshList();
    setView('list');
  };

  const persistSelectedQuotation = async (patch: Partial<QuotationPayload>) => {
    if (!selectedQuotation) return;
    await quotationsApi.update(selectedQuotation.id, toPayload(selectedQuotation, patch));
    const updated = await quotationsApi.getById(selectedQuotation.id);
    setSelectedQuotation(updated);
    refreshList();
  };

  const handleMarkAccepted = async () => {
    if (!selectedQuotation) return;
    const ok = await confirmDialog({
      title: 'Accept quotation?',
      message: `Mark quotation ${selectedQuotation.quoteNumber} as accepted?`,
      confirmLabel: 'Accept',
    });
    if (!ok) return;
    await persistSelectedQuotation({ status: 'Accepted', rejectionReason: undefined });
  };

  const handleMarkRejected = () => {
    setShowRejectionModal(true);
  };

  const handleConfirmRejection = async (reason: string) => {
    await persistSelectedQuotation({ status: 'Rejected', rejectionReason: reason });
    setShowRejectionModal(false);
  };

  const handleProceedToBooking = () => {
    if (!selectedQuotation) return;
    const quotationData = {
      source: 'quotation',
      sourceQuotationId: selectedQuotation.id,
      businessName: selectedQuotation.clientName,
      clientId: selectedQuotation.clientId,
      originCountry: selectedQuotation.originCountry,
      originPort: selectedQuotation.originPort,
      destinationCountry: selectedQuotation.destinationCountry,
      destinationPort: selectedQuotation.destinationPort,
      serviceType: selectedQuotation.modeOfTransport,
    };
    onConvertToBooking?.(quotationData);
  };

  const handleReopen = async () => {
    if (!selectedQuotation) return;
    const ok = await confirmDialog({
      title: 'Re-open quotation?',
      message: `Re-open quotation ${selectedQuotation.quoteNumber} as a draft?`,
      confirmLabel: 'Re-open',
    });
    if (!ok) return;
    await persistSelectedQuotation({ status: 'Draft', rejectionReason: undefined });
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedQuotation(null);
  };

  const handleCancelForm = async () => {
    const ok = await confirmDialog({
      title: 'Cancel editing?',
      message: 'Any unsaved changes will be lost.',
      confirmLabel: 'Discard changes',
    });
    if (!ok) return;
    setView('list');
    setSelectedQuotation(null);
  };

  return (
    <>
      {view === 'list' && (
        <QuotationDesk
          onViewQuotation={handleViewQuotation}
          onEditQuotation={handleEditQuotation}
          onDeleteQuotation={handleDeleteQuotation}
          onNewQuotation={handleNewQuotation}
          refreshKey={refreshKey}
        />
      )}

      {view === 'detail' && selectedQuotation && (
        <QuotationDetail
          quotation={selectedQuotation}
          onBack={handleBackToList}
          onEdit={() => { setFormMode('edit'); setView('form'); }}
          onMarkAccepted={handleMarkAccepted}
          onMarkRejected={handleMarkRejected}
          onProceedToBooking={handleProceedToBooking}
          onReopen={handleReopen}
        />
      )}

      {view === 'form' && (
        <QuotationForm
          quotation={selectedQuotation}
          mode={formMode}
          onSave={handleSaveQuotation}
          onCancel={handleCancelForm}
        />
      )}

      {showRejectionModal && selectedQuotation && (
        <RejectionReasonModal
          quotationNumber={selectedQuotation.quoteNumber}
          onConfirm={handleConfirmRejection}
          onCancel={() => setShowRejectionModal(false)}
        />
      )}
    </>
  );
}
