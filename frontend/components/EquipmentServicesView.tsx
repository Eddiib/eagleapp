import { BookingEquipmentLine } from '../services/bookings';

interface Props {
  equipment: BookingEquipmentLine[];
}

export function EquipmentServicesView({ equipment }: Props) {
  // Collect all service rows with their parent equipment context
  const rows = equipment.flatMap((eq, eqIdx) =>
    (eq.equipmentServices || []).map(svc => ({ eq, eqIdx, svc }))
  );

  const th = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider';
  const td = 'px-4 py-3 text-sm text-gray-900 dark:text-gray-100';

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">No services added yet.</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Open the <strong>Equipment Matrix</strong> tab, expand a row, and add services there.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className={th}>Container</th>
            <th className={th}>Service</th>
            <th className={th}>Invoice Party</th>
            <th className={`${th} text-right`}>Agreed Rate</th>
            <th className={th}>Supplier</th>
            <th className={`${th} text-right`}>Agreed Cost</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map(({ eq, eqIdx, svc }, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className={td}>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {eq.containerId || `Row ${eqIdx + 1}`}
                </span>
                {eq.typeSize && (
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{eq.typeSize}</span>
                )}
              </td>
              <td className={td}>
                {svc.serviceName || svc.serviceCode || <span className="text-gray-400">—</span>}
              </td>
              <td className={td}>
                {svc.invoicePartyName || <span className="text-gray-400 dark:text-gray-500">—</span>}
              </td>
              <td className={`${td} text-right tabular-nums`}>
                {svc.agreedRate != null
                  ? svc.agreedRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : <span className="text-gray-400 dark:text-gray-500">—</span>
                }
              </td>
              <td className={td}>
                {svc.supplierName || <span className="text-gray-400 dark:text-gray-500">—</span>}
              </td>
              <td className={`${td} text-right tabular-nums`}>
                {svc.agreedCost != null
                  ? svc.agreedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : <span className="text-gray-400 dark:text-gray-500">—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
            <tr>
              <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">
                Total Agreed Cost
              </td>
              <td className="px-4 py-2 text-sm font-semibold text-right text-gray-900 dark:text-gray-100 tabular-nums">
                {rows
                  .reduce((sum, { svc }) => sum + (svc.agreedCost ?? 0), 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
