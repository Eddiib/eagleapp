import { useRef, useState, useCallback } from 'react';
import { Upload, Download, Trash2, FileText, Loader2, FolderOpen } from 'lucide-react';
import { BookingAttachment, bookingAttachmentsApi } from '../services/bookings';
import { authHeader, API_BASE_URL } from '../services/client';

interface Props {
  bookingId?: string | null;
  attachments: BookingAttachment[];
  onAttachmentsChange: (next: BookingAttachment[]) => void;
  disabled?: boolean;
  uploadedBy?: string;
}

function formatBytes(n?: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime?: string) {
  if (!mime) return '📄';
  if (mime.startsWith('image/')) return '🖼';
  if (mime === 'application/pdf') return '📕';
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return '📊';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  return '📄';
}

export function BookingDocsTab({ bookingId, attachments, onAttachmentsChange, disabled, uploadedBy }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        const att = await bookingAttachmentsApi.upload(bookingId, { file, uploadedBy });
        next.push(att);
      }
      onAttachmentsChange(next);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [bookingId, attachments, onAttachmentsChange, uploadedBy]);

  const handleDelete = async (att: BookingAttachment) => {
    if (!bookingId) return;
    setDeletingId(att.id);
    try {
      await bookingAttachmentsApi.delete(bookingId, att.id);
      onAttachmentsChange(attachments.filter(a => a.id !== att.id));
    } catch (err: any) {
      setUploadError(err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (att: BookingAttachment) => {
    if (!bookingId) return;
    const url = `${API_BASE_URL}/bookings/${bookingId}/attachments/${att.id}`;
    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = att.originalFilename || att.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header + upload button */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Documents</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {attachments.length === 0 ? 'No documents uploaded yet' : `${attachments.length} file${attachments.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {uploadError && <span className="text-xs text-red-500 dark:text-red-400">{uploadError}</span>}
          {!bookingId && (
            <span className="text-xs text-gray-400 dark:text-gray-500">Save the booking first to upload files</span>
          )}
          {canAttach && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => e.target.files && handleUploadFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Drop zone + file list */}
      <div
        className={`p-6 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/10' : ''} transition-colors`}
        onDragOver={e => { e.preventDefault(); if (canAttach) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          if (canAttach) handleUploadFiles(e.dataTransfer.files);
        }}
      >
        {attachments.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <FolderOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {canAttach ? 'Drag & drop files here, or click Upload' : 'No documents uploaded yet'}
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">File</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {attachments.map(att => (
                  <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{fileIcon(att.mimeType)}</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs">
                          {att.originalFilename || att.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {att.docType || <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {att.docDate
                        ? new Date(att.docDate).toLocaleDateString()
                        : att.uploadedAt
                          ? new Date(att.uploadedAt).toLocaleDateString()
                          : <span className="text-gray-300 dark:text-gray-600">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {att.uploadedBy || <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 dark:text-gray-500 tabular-nums text-xs">
                      {formatBytes(att.sizeBytes)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleDownload(att)}
                          title="Download"
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleDelete(att)}
                            disabled={deletingId === att.id}
                            title="Delete"
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-40"
                          >
                            {deletingId === att.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Drag overlay hint */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">Drop to upload</p>
          </div>
        )}
      </div>
    </div>
  );
}
