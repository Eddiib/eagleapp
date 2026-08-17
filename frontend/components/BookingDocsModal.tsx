import { X, Download, Eye, ArrowLeft, FileText, Loader2, FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BookingAttachment } from '../services/bookings';
import { formatDate } from '../utils/date';
import { authHeader, API_BASE_URL } from '../services/client';

interface Props {
  bookingId: string;
  bookingNumber: string;
  attachments: BookingAttachment[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
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

/**
 * Read-only view of a booking's uploaded documents, opened from the booking
 * list quick view. Uploading and deleting stay in the booking sheet's Docs tab.
 */
function isPreviewable(mime?: string) {
  if (!mime) return false;
  return mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('text/');
}

export function BookingDocsModal({ bookingId, bookingNumber, attachments, loading, error, onClose }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // In-modal preview: the file is fetched with the auth header and shown from a
  // blob URL, so no unauthenticated link to the API is ever exposed.
  const [preview, setPreview] = useState<{ att: BookingAttachment; url: string } | null>(null);

  // Blob URLs are released when the preview changes or the modal unmounts.
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);

  const fetchBlob = async (att: BookingAttachment) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/attachments/${att.id}`, {
      headers: authHeader(),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.blob();
  };

  const handleDownload = async (att: BookingAttachment) => {
    setActionError(null);
    setBusyId(att.id);
    try {
      const blob = await fetchBlob(att);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = att.originalFilename || att.filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err: any) {
      setActionError(err.message || 'Download failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleView = async (att: BookingAttachment) => {
    setActionError(null);
    setBusyId(att.id);
    try {
      const blob = await fetchBlob(att);
      // The download route always sends Content-Disposition: attachment, so re-type
      // the blob from the stored mime to let the browser render it inline.
      const typed = att.mimeType ? blob.slice(0, blob.size, att.mimeType) : blob;
      setPreview({ att, url: URL.createObjectURL(typed) });
    } catch (err: any) {
      setActionError(err.message || 'Could not open the document');
    } finally {
      setBusyId(null);
    }
  };

  const closePreview = () => setPreview(null);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-h-[90vh] flex flex-col ${
          preview ? 'max-w-5xl' : 'max-w-3xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 min-w-0">
            {preview ? (
              <button
                onClick={closePreview}
                title="Back to documents"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {preview ? (preview.att.originalFilename || preview.att.filename) : 'Documents'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {bookingNumber}
                {!preview && !loading && !error && ` · ${attachments.length} file${attachments.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {preview && (
              <button
                onClick={() => handleDownload(preview.att)}
                disabled={busyId === preview.att.id}
                title="Download"
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-40"
              >
                {busyId === preview.att.id
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Download className="w-5 h-5" />
                }
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {actionError && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>
          )}
          {preview ? (
            preview.att.mimeType?.startsWith('image/') ? (
              <img
                src={preview.url}
                alt={preview.att.originalFilename || preview.att.filename}
                className="max-w-full mx-auto rounded"
              />
            ) : isPreviewable(preview.att.mimeType) ? (
              <iframe
                src={preview.url}
                title={preview.att.originalFilename || preview.att.filename}
                className="w-full h-[65vh] rounded border border-gray-200 dark:border-gray-700 bg-white"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  This file type can't be previewed in the browser.
                </p>
                <button
                  onClick={() => handleDownload(preview.att)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download to open
                </button>
              </div>
            )
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading documents…
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : attachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <FolderOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
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
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {attachments.map(att => (
                    <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleView(att)}
                          title="View"
                          className="flex items-center gap-2 text-left max-w-full"
                        >
                          <span className="text-base">{fileIcon(att.mimeType)}</span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                            {att.originalFilename || att.filename}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {att.docType || <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {att.docDate
                          ? formatDate(att.docDate)
                          : att.uploadedAt
                            ? formatDate(att.uploadedAt)
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleView(att)}
                            disabled={busyId === att.id}
                            title="View"
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-40"
                          >
                            {busyId === att.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Eye className="w-4 h-4" />
                            }
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(att)}
                            disabled={busyId === att.id}
                            title="Download"
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-40"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
