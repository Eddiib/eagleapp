import { ChevronLeft, ChevronRight, StickyNote, MessageSquare, Paperclip, Upload, FileText, Trash2, Download, Loader2, Save } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { BookingAttachment, bookingAttachmentsApi, bookingsApi } from '../services/bookings';
import { useConfirm } from '../context/ConfirmDialog';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  bookingId?: string | null;
  disabled?: boolean;
  internalNotes: string;
  freeTextComments: string;
  onInternalNotesChange: (v: string) => void;
  onFreeTextCommentsChange: (v: string) => void;
  attachments: BookingAttachment[];
  onAttachmentsChange: (next: BookingAttachment[]) => void;
  uploadedBy?: string;
}

function formatBytes(n?: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function inferAbbr(a: BookingAttachment): string {
  const t = (a.docType || '').trim();
  if (t) return t.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const ext = a.originalFilename.split('.').pop();
  return (ext || 'DOC').toUpperCase();
}

export function Sidebar({
  isOpen,
  onToggle,
  bookingId,
  disabled = false,
  internalNotes,
  freeTextComments,
  onInternalNotesChange,
  onFreeTextCommentsChange,
  attachments,
  onAttachmentsChange,
  uploadedBy,
}: SidebarProps) {
  const confirmDialog = useConfirm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Local note state — always editable regardless of booking mode.
  // If there's a saved bookingId we persist directly; otherwise we bubble up
  // via onInternalNotesChange / onFreeTextCommentsChange so the parent draft
  // includes them on the next full save.
  const [localNotes, setLocalNotes] = useState(internalNotes);
  const [localComments, setLocalComments] = useState(freeTextComments);
  const [notesDirty, setNotesDirty] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Sync local state when parent reloads the booking (e.g. after a full save).
  useEffect(() => { setLocalNotes(internalNotes); }, [internalNotes]);
  useEffect(() => { setLocalComments(freeTextComments); }, [freeTextComments]);

  const handleNotesChange = (v: string) => {
    setLocalNotes(v);
    setNotesDirty(true);
    setNotesSaved(false);
    onInternalNotesChange(v);
  };

  const handleCommentsChange = (v: string) => {
    setLocalComments(v);
    setNotesDirty(true);
    setNotesSaved(false);
    onFreeTextCommentsChange(v);
  };

  const handleSaveNotes = async () => {
    if (!bookingId) return;
    setNotesSaving(true);
    try {
      await bookingsApi.saveNotes(bookingId, localNotes, localComments);
      setNotesDirty(false);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      // silent — main save flow will also persist these
    } finally {
      setNotesSaving(false);
    }
  };

  const canAttach = !!bookingId && !disabled;

  const handleUploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!bookingId) return;
    const list = Array.from(files);
    if (!list.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      const next = [...attachments];
      for (const file of list) {
        const created = await bookingAttachmentsApi.upload(bookingId, { file, uploadedBy });
        next.unshift(created);
      }
      onAttachmentsChange(next);
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [bookingId, attachments, onAttachmentsChange, uploadedBy]);

  const handleDelete = async (id: string) => {
    if (!bookingId) return;
    const ok = await confirmDialog({
      title: 'Delete attachment?',
      message: 'This file will be permanently removed.',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await bookingAttachmentsApi.delete(bookingId, id);
      onAttachmentsChange(attachments.filter(a => a.id !== id));
    } catch (err: any) {
      setUploadError(err?.message || 'Delete failed');
    }
  };

  const handleDownload = async (a: BookingAttachment) => {
    if (!bookingId) return;
    try {
      const res = await fetch(bookingAttachmentsApi.downloadUrl(bookingId, a.id), {
        headers: bookingAttachmentsApi.downloadHeaders(),
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = a.originalFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setUploadError(err?.message || 'Download failed');
    }
  };

  return (
    <>
      <aside
        className={`fixed right-0 top-0 h-full bg-white dark:bg-[#262626] border-l border-gray-200 dark:border-[#374151] shadow-lg transition-all duration-300 z-50 ${
          isOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Notes Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm text-gray-900 dark:text-gray-300 flex-1">Notes & Internal Comments</h3>
              </div>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#374151] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-300"
                rows={4}
                placeholder="Internal notes visible only to team..."
                value={localNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Free Text Comments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm text-gray-900 dark:text-gray-300 flex-1">Free Text Comments</h3>
              </div>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#374151] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-300"
                rows={4}
                placeholder="Enter notes..."
                value={localComments}
                onChange={(e) => handleCommentsChange(e.target.value)}
              />
            </div>

            {/* Save Notes button — always available when there's an existing booking */}
            {bookingId && (
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={!notesDirty || notesSaving}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-40 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-500"
              >
                {notesSaving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                {notesSaved ? 'Saved!' : 'Save Notes'}
              </button>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Attachments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm text-gray-900 dark:text-gray-300">Attachments</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{attachments.length}</span>
              </div>
              {attachments.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-3">
                  No files attached yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1E1E1E] rounded-md hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors group"
                    >
                      <div className="w-8 h-8 bg-blue-100 dark:bg-[#2563EB]/20 rounded flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-[#2563EB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 dark:text-gray-300 truncate" title={doc.originalFilename}>
                          {doc.originalFilename}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatBytes(doc.sizeBytes)}
                          {doc.uploadedAt && <> · {String(doc.uploadedAt).split('T')[0]}</>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-[#262626] px-2 py-1 rounded border border-gray-200 dark:border-[#374151]">
                        {inferAbbr(doc)}
                      </span>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!disabled && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-[#374151]"></div>

            {/* Upload Area */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm text-gray-900 dark:text-gray-300">Upload Documents</h3>
              </div>
              {!bookingId ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-3">
                  Save the booking first to enable attachments.
                </p>
              ) : (
                <>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleUploadFiles(e.target.files);
                      e.currentTarget.value = '';
                    }}
                  />
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-[#2563EB]/10'
                        : 'border-gray-300 dark:border-[#374151] hover:border-blue-400 dark:hover:border-[#2563EB] hover:bg-blue-50/50 dark:hover:bg-[#2563EB]/10'
                    } ${canAttach ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                    onClick={() => canAttach && fileInputRef.current?.click()}
                    onDragOver={(e) => { if (canAttach) { e.preventDefault(); setIsDragging(true); } }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (canAttach && e.dataTransfer.files.length) handleUploadFiles(e.dataTransfer.files);
                    }}
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {uploading ? 'Uploading…' : 'Drag & drop files here'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">or click to browse · 25 MB max</p>
                    <button
                      type="button"
                      disabled={!canAttach || uploading}
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-60"
                    >
                      Choose Files
                    </button>
                  </div>
                </>
              )}
              {uploadError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#374151] rounded-l-lg shadow-lg p-2 hover:bg-gray-50 dark:hover:bg-[#1E1E1E] transition-all duration-300 ${
          isOpen ? 'right-80' : 'right-0'
        }`}
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </>
  );
}
