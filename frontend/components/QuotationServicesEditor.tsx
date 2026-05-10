import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { servicesApi } from '../services/services';
import { usePartners } from '../hooks/usePartners';
import { Service } from '../types/service';
import { QuotationServiceLine } from '../services/quotations';
import { tableClasses } from './ui/table';
import { isPartnerSeller } from '../utils/partnerRoles';

interface Props {
  value: QuotationServiceLine[];
  onChange: (lines: QuotationServiceLine[]) => void;
  defaultCurrency?: string;
  disabled?: boolean;
}

export function QuotationServicesEditor({ value, onChange, defaultCurrency = 'EUR', disabled }: Props) {
  const [catalog, setCatalog] = useState<Service[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { partners } = usePartners();
  const suppliers = partners.filter((partner) => partner.status === 'Active' && isPartnerSeller(partner));
  const currencyOptions = Array.from(new Set([defaultCurrency, 'EUR', 'USD', 'GBP'].filter(Boolean)));

  useEffect(() => {
    servicesApi.getAll()
      .then((list) => setCatalog(list.filter((service) => service.isActive)))
      .catch((err) => setLoadError(err.message || 'Failed to load services'));
  }, []);

  const setLine = (idx: number, patch: Partial<QuotationServiceLine>) => {
    const next = value.map((line, lineIndex) => {
      if (lineIndex !== idx) return line;
      const merged = { ...line, ...patch };
      if (patch.serviceId !== undefined) {
        const service = catalog.find((candidate) => candidate.id === patch.serviceId);
        merged.serviceCode = service?.serviceCode;
        merged.serviceName = service?.serviceName;
        if (!merged.currency) merged.currency = service?.defaultCurrency || defaultCurrency;
      }
      if (patch.supplierId !== undefined) {
        const supplier = suppliers.find((candidate) => candidate.id === patch.supplierId);
        merged.supplierName = supplier ? (supplier.tradingName || supplier.companyLegalName) : undefined;
      }
      return merged;
    });
    onChange(next);
  };

  const addLine = () => {
    const first = catalog[0];
    onChange([
      ...value,
      {
        serviceId: first?.id || '',
        serviceCode: first?.serviceCode,
        serviceName: first?.serviceName,
        quantity: 1,
        costPrice: 0,
        sellPrice: 0,
        currency: first?.defaultCurrency || defaultCurrency,
      },
    ]);
  };

  const removeLine = (idx: number) => onChange(value.filter((_, index) => index !== idx));

  const totalCost = value.reduce((sum, line) => sum + ((line.quantity || 0) * (line.costPrice || 0)), 0);
  const totalSell = value.reduce((sum, line) => sum + ((line.quantity || 0) * (line.sellPrice || 0)), 0);

  const thBase = `${tableClasses.compactHead} text-gray-500 dark:text-gray-400`;
  const th = `${thBase} text-left`;
  const thRight = `${thBase} text-right`;
  const td = `${tableClasses.compactCell} text-gray-900 dark:text-gray-100`;
  const input = 'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800';

  return (
    <div className="space-y-3">
      {loadError && (
        <div className="text-sm text-red-600 dark:text-red-400">{loadError}</div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className={th}>Service</th>
              <th className={th}>Supplier</th>
              <th className={thRight}>Qty</th>
              <th className={thRight}>Cost</th>
              <th className={thRight}>Sell</th>
              <th className={th}>Currency</th>
              <th className={th}>Notes</th>
              <th className={`${th} w-10`}></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {value.length === 0 ? (
              <tr>
                <td colSpan={8} className={`${td} text-center py-6 text-gray-500 dark:text-gray-400`}>
                  No quotation services added yet.
                </td>
              </tr>
            ) : (
              value.map((line, idx) => (
                <tr key={line.id || idx}>
                  <td className={td}>
                    <select
                      value={line.serviceId}
                      onChange={(e) => setLine(idx, { serviceId: e.target.value })}
                      disabled={disabled}
                      className={`${input} min-w-[180px]`}
                    >
                      <option value="">Select service...</option>
                      {catalog.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.serviceName} ({service.serviceCode})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={td}>
                    <select
                      value={line.supplierId || ''}
                      onChange={(e) => setLine(idx, { supplierId: e.target.value || undefined })}
                      disabled={disabled}
                      className={`${input} min-w-[180px]`}
                    >
                      <option value="">—</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.tradingName || supplier.companyLegalName}
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
                      onChange={(e) => setLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                      disabled={disabled}
                      className={`${input} text-right w-20`}
                    />
                  </td>
                  <td className={`${td} text-right`}>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.costPrice}
                      onChange={(e) => setLine(idx, { costPrice: parseFloat(e.target.value) || 0 })}
                      disabled={disabled}
                      className={`${input} text-right w-28`}
                    />
                  </td>
                  <td className={`${td} text-right`}>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.sellPrice}
                      onChange={(e) => setLine(idx, { sellPrice: parseFloat(e.target.value) || 0 })}
                      disabled={disabled}
                      className={`${input} text-right w-28`}
                    />
                  </td>
                  <td className={td}>
                    <select
                      value={line.currency}
                      onChange={(e) => setLine(idx, { currency: e.target.value })}
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
                      onChange={(e) => setLine(idx, { notes: e.target.value })}
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
              ))
            )}
          </tbody>
          {value.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <td colSpan={3} className={`${td} font-medium`}>Totals</td>
                <td className={`${td} text-right font-medium tabular-nums`}>{totalCost.toFixed(2)}</td>
                <td className={`${td} text-right font-medium tabular-nums`}>{totalSell.toFixed(2)}</td>
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
        <Plus className="w-4 h-4" />
        Add Service
      </button>
    </div>
  );
}
