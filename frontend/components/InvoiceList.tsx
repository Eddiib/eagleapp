import { useEffect, useState } from 'react';
import {
  Plus, Search, FileText, Loader2, AlertCircle,
  CheckCircle, Clock, Ban, RefreshCw, Edit2, Trash2,
} from 'lucide-react';
import { Invoice, InvoiceStatus, invoicesApi } from '../services/invoices';
import { useConfirm } from '../context/ConfirmDialog';
import { PaginationBar } from './ui/PaginationBar';

interface InvoiceListProps {
  onNew: () => void;
  onEdit: (invoice: Invoice) => void;
  listKey?: number;
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Draft:     'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Sent:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Paid:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Overdue:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Cancelled: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Void:      'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

function StatusIcon({ status }: { status: InvoiceStatus }) {
  switch (status) {
    case 'Paid':      return <CheckCircle className="w-3.5 h-3.5" />;
    case 'Overdue':   return <AlertCircle className="w-3.5 h-3.5" />;
    case 'Cancelled':
    case 'Void':      return <Ban className="w-3.5 h-3.5" />;
    default:          return <Clock className="w-3.5 h-3.5" />;
  }
}

export function InvoiceList({ onNew, onEdit, listKey }: InvoiceListProps) {
  const confirmDialog = useConfirm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);

  const load = () => {
    setLoading(true);
    setError(null);
    invoicesApi.getAll()
      .then(setInvoices)
      .catch((err) => setError(err.message || 'Failed to load invoices'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [listKey]);

  const handleDelete = async (inv: Invoice) => {
    const ok = await confirmDialog({
      title: 'Delete invoice?',
      message: `Invoice ${inv.invoiceNumber} will be permanently removed. This cannot be undone.`,
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setDeleting(inv.id);
    try {
      await invoicesApi.delete(inv.id);
      setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.clientName || '').toLowerCase().includes(q) ||
      (inv.bookingNumber || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalOutstanding = invoices
    .filter((i) => i.status === 'Sent' || i.status === 'Overdue')
    .reduce((s, i) => s + i.balanceDue, 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((s, i) => s + i.totalAmount, 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading invoices…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Invoicing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Total Invoices</div>
          <div className="text-2xl text-gray-900 dark:text-gray-100">{invoices.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Outstanding</div>
          <div className="text-2xl text-orange-600 dark:text-orange-400">
            {totalOutstanding.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Total Paid</div>
          <div className="text-2xl text-green-600 dark:text-green-400">
            {totalPaid.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, client, booking…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Statuses</option>
          {(['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Void'] as InvoiceStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-16 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {invoices.length === 0 ? 'No invoices yet — create your first one.' : 'No invoices match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Booking</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance Due</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paged.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
                  <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{inv.clientName || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inv.bookingNumber || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inv.invoiceDate}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inv.dueDate || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 tabular-nums">
                    {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${inv.balanceDue > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                    {inv.currency} {inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[inv.status]}`}>
                      <StatusIcon status={inv.status} />
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(inv)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {inv.status === 'Draft' && (
                        <button
                          onClick={() => handleDelete(inv)}
                          disabled={deleting === inv.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deleting === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              label="invoices"
            />
          </div>
        </div>
      )}
    </div>
  );
}
