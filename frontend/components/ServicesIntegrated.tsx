import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { usePartners, getClients, getSuppliers } from '../hooks/usePartners';
import { tableClasses } from './ui/table';

interface ServiceRow {
  id: string;
  equipmentId: string;
  serviceType: string;
  equipment: string;
  invoiceParty: string;
  agreedRate: string;
  serviceProvider: string;
  agreedCost: string;
}

const equipmentTypes = [
  { value: '20DV', label: '20DV - 20ft Dry Van' },
  { value: '40DV', label: '40DV - 40ft Dry Van' },
  { value: '40HC', label: '40HC - 40ft High Cube' },
  { value: '45HC', label: '45HC - 45ft High Cube' },
  { value: '20OT', label: '20OT - 20ft Open Top' },
  { value: '40OT', label: '40OT - 40ft Open Top' },
  { value: '20FR', label: '20FR - 20ft Flat Rack' },
  { value: '40FR', label: '40FR - 40ft Flat Rack' },
  { value: '20RF', label: '20RF - 20ft Reefer' },
  { value: '40RF', label: '40RF - 40ft Reefer' },
  { value: '20TK', label: '20TK - 20ft Tank' },
  { value: 'LCL', label: 'LCL - Less than Container Load' },
  { value: 'CURTAIN', label: 'Curtain Sider' },
  { value: 'BOX', label: 'Box Trailer' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'LOWBED', label: 'Lowbed' },
  { value: 'REEFER_TRAILER', label: 'Reefer Trailer' },
  { value: 'TANKER', label: 'Tanker' },
  { value: 'TIPPER', label: 'Tipper' },
];

const serviceTypeOptions = [
  { value: 'Sea Freight', label: 'Sea Freight' },
  { value: 'Air Freight', label: 'Air Freight' },
  { value: 'Road Transport', label: 'Road Transport' },
  { value: 'Rail Transport', label: 'Rail Transport' },
  { value: 'Customs Clearance', label: 'Customs Clearance' },
  { value: 'Warehousing', label: 'Warehousing' },
  { value: 'Port Charges', label: 'Port Charges' },
  { value: 'Terminal Handling Charges (THC)', label: 'Terminal Handling Charges (THC)' },
  { value: 'Documentation Fee', label: 'Documentation Fee' },
  { value: 'Bill of Lading Fee', label: 'Bill of Lading Fee' },
  { value: 'VGM (Verified Gross Mass)', label: 'VGM (Verified Gross Mass)' },
  { value: 'Container Seal', label: 'Container Seal' },
  { value: 'Container Detention', label: 'Container Detention' },
  { value: 'Container Demurrage', label: 'Container Demurrage' },
  { value: 'Storage', label: 'Storage' },
  { value: 'Empty Container Repositioning', label: 'Empty Container Repositioning' },
  { value: 'Fumigation', label: 'Fumigation' },
  { value: 'Inspection Services', label: 'Inspection Services' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Cargo Survey', label: 'Cargo Survey' },
  { value: 'Stuffing/Unstuffing', label: 'Stuffing/Unstuffing' },
  { value: 'Lashing & Securing', label: 'Lashing & Securing' },
  { value: 'Pallet Services', label: 'Pallet Services' },
  { value: 'Cross Docking', label: 'Cross Docking' },
  { value: 'Pick & Pack', label: 'Pick & Pack' },
  { value: 'Escort/Convoy Service', label: 'Escort/Convoy Service' },
  { value: 'Overweight Permit', label: 'Overweight Permit' },
  { value: 'Special Equipment', label: 'Special Equipment' },
  { value: 'Reefer Monitoring', label: 'Reefer Monitoring' },
  { value: 'Pre-Carriage', label: 'Pre-Carriage' },
  { value: 'On-Carriage', label: 'On-Carriage' },
  { value: 'AMS/AES Filing', label: 'AMS/AES Filing' },
  { value: 'ISF Filing', label: 'ISF Filing' },
  { value: 'Transit Document T1/T2', label: 'Transit Document T1/T2' },
  { value: 'Certificate of Origin', label: 'Certificate of Origin' },
  { value: 'Phytosanitary Certificate', label: 'Phytosanitary Certificate' },
  { value: 'Dangerous Goods Handling', label: 'Dangerous Goods Handling' },
  { value: 'Other', label: 'Other' },
];

interface ServicesIntegratedProps {
  equipmentId: string;
  containerId: string;
}

export function ServicesIntegrated({ equipmentId, containerId }: ServicesIntegratedProps) {
  const denseHeadBase = `${tableClasses.denseHead} text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700`;
  const denseHead = `${denseHeadBase} text-left`;
  const denseHeadRight = `${denseHeadBase} text-right`;
  const denseCell = `${tableClasses.denseCell} border-r border-gray-200 dark:border-gray-700`;
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>(() => {
    // Initialize with mock data for this specific equipment/container
    if (equipmentId === '1' && containerId === 'MSCU1234567') {
      return [
        {
          id: '1',
          equipmentId: equipmentId,
          serviceType: 'Sea Freight',
          equipment: '40HC',
          invoiceParty: 'client1',
          agreedRate: '2450.00',
          serviceProvider: 'msc',
          agreedCost: '1850.00',
        },
        {
          id: '2',
          equipmentId: equipmentId,
          serviceType: 'Customs Clearance',
          equipment: '40HC',
          invoiceParty: 'client1',
          agreedRate: '350.00',
          serviceProvider: 'eagle',
          agreedCost: '250.00',
        },
        {
          id: '3',
          equipmentId: equipmentId,
          serviceType: 'Road Transport',
          equipment: 'CURTAIN',
          invoiceParty: 'client1',
          agreedRate: '650.00',
          serviceProvider: 'eagle',
          agreedCost: '450.00',
        }
      ];
    }
    
    // Default empty row for new equipment
    return [{
      id: '1',
      equipmentId: equipmentId,
      serviceType: '',
      equipment: '',
      invoiceParty: '',
      agreedRate: '',
      serviceProvider: '',
      agreedCost: '',
    }];
  });

  const handleAddRow = () => {
    const newRow: ServiceRow = {
      id: String(Date.now()),
      equipmentId: equipmentId,
      serviceType: '',
      equipment: '',
      invoiceParty: '',
      agreedRate: '',
      serviceProvider: '',
      agreedCost: '',
    };
    setServiceRows([...serviceRows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (serviceRows.length > 1) {
      setServiceRows(serviceRows.filter(r => r.id !== id));
    }
  };

  const handleUpdateRow = (id: string, field: keyof ServiceRow, value: string) => {
    setServiceRows(serviceRows.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-100 dark:bg-[#262626]">
            <th className={denseHead}>
              Equipment ID
            </th>
            <th className={denseHead}>
              Service Type
            </th>
            <th className={denseHead}>
              Equipment
            </th>
            <th className={denseHead}>
              Invoice Party
            </th>
            <th className={denseHeadRight}>
              Agreed Rate
            </th>
            <th className={denseHead}>
              Supplier
            </th>
            <th className={denseHeadRight}>
              Agreed Cost
            </th>
            <th className={`${tableClasses.denseHead} w-10`}></th>
          </tr>
        </thead>
        <tbody>
          {serviceRows.map((serviceRow, idx) => (
            <tr key={serviceRow.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50/50 dark:bg-[#262626]'} hover:bg-gray-50 dark:hover:bg-gray-800`}>
              <td className={denseCell}>
                <input
                  type="text"
                  value={serviceRow.equipmentId}
                  onChange={(e) => handleUpdateRow(serviceRow.id, 'equipmentId', e.target.value)}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Enter equipment ID"
                />
              </td>
              <td className={denseCell}>
                <select
                  value={serviceRow.serviceType}
                  onChange={(e) => handleUpdateRow(serviceRow.id, 'serviceType', e.target.value)}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select Service Type...</option>
                  {serviceTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
              <td className={denseCell}>
                <select
                  value={serviceRow.equipment}
                  onChange={(e) => handleUpdateRow(serviceRow.id, 'equipment', e.target.value)}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select Equipment...</option>
                  {equipmentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </td>
              <td className={denseCell}>
                <select
                  value={serviceRow.invoiceParty}
                  onChange={(e) => handleUpdateRow(serviceRow.id, 'invoiceParty', e.target.value)}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select Invoice Party...</option>
                  {getClients().map(client => (
                    <option key={client.value} value={client.value}>{client.label}</option>
                  ))}
                </select>
              </td>
              <td className={denseCell}>
                <input
                  type="number"
                  value={serviceRow.agreedRate}
                  onChange={(e) => handleUpdateRow(serviceRow.id, 'agreedRate', e.target.value)}
                  className="w-full px-1.5 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100 tabular-nums"
                  placeholder="0.00"
                  step="0.01"
                />
              </td>
              <td className={denseCell}>
                <select
                  value={serviceRow.serviceProvider}
                  onChange={(e) => handleUpdateRow(serviceRow.id, 'serviceProvider', e.target.value)}
                  className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select Supplier...</option>
                  {getSuppliers().map(supplier => (
                    <option key={supplier.value} value={supplier.value}>{supplier.label}</option>
                  ))}
                </select>
              </td>
              <td className={denseCell}>
                <input
                  type="number"
                  value={serviceRow.agreedCost}
                  onChange={(e) => handleUpdateRow(serviceRow.id, 'agreedCost', e.target.value)}
                  className="w-full px-1.5 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100 tabular-nums"
                  placeholder="0.00"
                  step="0.01"
                />
              </td>
              <td className={`${tableClasses.denseCell} text-center`}>
                <button
                  onClick={() => handleDeleteRow(serviceRow.id)}
                  disabled={serviceRows.length === 1}
                  className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Delete row"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 bg-gray-50 dark:bg-[#262626] border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Service
        </button>
      </div>
    </div>
  );
}
