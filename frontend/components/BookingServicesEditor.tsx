import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { servicesApi } from '../services/services';
import { usePartners } from '../hooks/usePartners';
import { Service } from '../types/service';
import { BookingServiceLine } from '../services/bookings';
import { tableClasses } from './ui/table';
import { isPartnerSeller } from '../utils/partnerRoles';

interface Props {
  value: BookingServiceLine[];
  onChange: (lines: BookingServiceLine[]) => void;
  defaultCurrency?: string;
  disabled?: boolean;
}

export function BookingServicesEditor({ value, onChange, defaultCurrency = 'EUR', disabled }: Props) {
  const [catalog, setCatalog] = useState<Service[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { partners } = usePartners();
  const suppliers = partners.filter(p => p.status === 'Active' && isPartnerSeller(p));
  const currencyOptions = Array.from(new Set([defaultCurrency, 'EUR', 'USD', 'GBP'].filter(Boolean)));

  useEffect(() => {
    servicesApi.getAll()
      .then(list => setCatalog(list.filter(s => s.isActive)))
      .catch(err => setLoadError(err.message || 'Failed to load services'));
  }, []);

  const setLine = (idx: number, patch: Partial<BookingServiceLine>) => {
    const next = value.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...patch };
      if (patch.serviceId !== undefined) {
        const svc = catalog.find(c => c.id === patch.serviceId);
        merged.serviceCode = svc?.serviceCode;
        merged.serviceName = svc?.serviceName;
        if (svc?.defaultCurrency && !merged.currency) merged.currency = svc.defaultCurrency;
      }
      if (patch.supplierId !== undefined) {
        const sup = suppliers.find(s => s.id === patch.supplierId);
        merged.supplierName = sup ? (sup.tradingName || sup.companyLegalName) : undefined;
      }
      merged.totalPrice = (merged.quantity || 0) * (merged.unitPrice || 0);
      return merged;
    });
    onChange(next);
  };

  const addLine = () => {
    onChange([
      ...value,
      {
        serviceId: catalog[0]?.id || '',
        serviceCode: catalog[0]?.serviceCode,
        serviceName: catalog[0]?.serviceName,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        currency: catalog[0]?.defaultCurrency || defaultCurrency,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const thBase = `${tableClasses.compactHead} text-gray-500 dark:text-gray-400`;
  const th = `${thBase} text-left`;
  const thRight = `${thBase} text-right`;
  const td = `${tableClasses.compactCell} text-gray-900 dark:text-gray-100`;
  const input = 'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800';

  const total = value.reduce((n, l) => n + (l.totalPrice || 0), 0);

  return (
    <div className="space-y-3">
      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">Failed to load services catalog: {loadError}</div>
      )}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className={th}>Service</th>
              <th className={th}>Supplier</th>
              <th className={thRight}>Qty</th>
              <th className={thRight}>Unit Price</th>
              <th className={thRight}>Total</th>
              <th className={th}>Currency</th>
              <th className={th}>Notes</th>
              <th className={`${th} w-10`}></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {value.length === 0 ? (
              <tr>
                <td colSpan={8} className={`${td} text-gray-500 text-center py-6`}>
                  No services added yet.
                </td>
              </tr>
            ) : value.map((line, idx) => (
              <tr key={idx}>
                <td className={td}>
                  <select
                    value={line.serviceId}
                    onChange={e => setLine(idx, { serviceId: e.target.value })}
                    disabled={disabled}
                    className={`${input} min-w-[180px]`}
                  >
                    <option value="">Select service...</option>
                    {catalog.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.serviceName} ({c.serviceCode})
                      </option>
                    ))}
                  </select>
                </td>
                <td className={td}>
                  <select
                    value={line.supplierId || ''}
                    onChange={e => setLine(idx, { supplierId: e.target.value || undefined })}
                    disabled={disabled}
                    className={`${input} min-w-[180px]`}
                  >
                    <option value="">—</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.tradingName || s.companyLegalName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={`${td} text-right`}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.quantity}
                    onChange={e => setLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                    disabled={disabled}
                    className={`${input} text-right w-20`}
                  />
                </td>
                <td className={`${td} text-right`}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={e => setLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                    disabled={disabled}
                    className={`${input} text-right w-28`}
                  />
                </td>
                <td className={`${td} text-right tabular-nums`}>{line.totalPrice.toFixed(2)}</td>
                <td className={td}>
                  <select
                    value={line.currency}
                    onChange={e => setLine(idx, { currency: e.target.value })}
                    disabled={disabled}
                    className={`${input} w-24`}
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </td>
                <td className={td}>
                  <input
                    type="text"
                    value={line.notes || ''}
                    onChange={e => setLine(idx, { notes: e.target.value })}
                    disabled={disabled}
                    className={`${input} min-w-[140px]`}
                  />
                </td>
                <td className={td}>
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    disabled={disabled}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-40"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {value.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <td className={`${td} font-medium`} colSpan={4}>Total</td>
                <td className={`${td} text-right font-medium tabular-nums`}>{total.toFixed(2)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <button
        type="button"
        onClick={addLine}
        disabled={disabled || catalog.length === 0}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" /> Add Service
      </button>
    </div>
  );
}
