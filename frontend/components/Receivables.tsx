import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Invoice, InvoiceStatus, invoicesApi } from '../services/invoices';

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Draft:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  Sent:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Paid:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Overdue:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500',
  Void:      'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
};

export function Receivables() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoicesApi.getAll()
      .then((all) => setInvoices(all.filter((i) => i.invoiceType === 'Sales' && i.status !== 'Void' && i.status !== 'Cancelled')))
      .catch((err) => setError(err.message || 'Failed to load receivables'))
      .finally(() => setLoading(false));
  }, []);

  const outstanding = invoices.filter((i) => i.status === 'Sent' || i.status === 'Overdue');
  const overdue     = invoices.filter((i) => i.status === 'Overdue');
  const paid        = invoices.filter((i) => i.status === 'Paid');

  const totalOutstanding = outstanding.reduce((s, i) => s + i.balanceDue, 0);
  const totalOverdue     = overdue.reduce((s, i) => s + i.balanceDue, 0);
  const totalPaid        = paid.reduce((s, i) => s + i.totalAmount, 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading receivables…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-gray-100">Receivables</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Outstanding client invoices (Sales type)</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Total Outstanding</div>
              <div className="text-2xl text-orange-600 dark:text-orange-400">
                ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">{outstanding.length} invoice{outstanding.length !== 1 ? 's' : ''}</div>
            </div>
            <Clock className="w-8 h-8 text-orange-400 dark:text-orange-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Overdue</div>
              <div className="text-2xl text-red-600 dark:text-red-400">
                ${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">{overdue.length} invoice{overdue.length !== 1 ? 's' : ''}</div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400 dark:text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Collected (Paid)</div>
              <div className="text-2xl text-green-600 dark:text-green-400">
                ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">{paid.length} invoice{paid.length !== 1 ? 's' : ''}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400 dark:text-green-500" />
          </div>
        </div>
      </div>

      {/* Table */}
      {invoices.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-16 text-center">
          <TrendingUp className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No sales invoices found. Create invoices in the Invoicing module.</p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${inv.status === 'Overdue' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                  <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{inv.clientName || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inv.bookingNumber || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inv.invoiceDate}</td>
                  <td className={`px-4 py-3 ${inv.status === 'Overdue' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {inv.dueDate || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 tabular-nums">
                    {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${inv.balanceDue > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                    {inv.currency} {inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
