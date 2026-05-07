import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ServicesIntegrated } from './ServicesIntegrated';
import { tableClasses } from './ui/table';

interface EquipmentRowExpandedProps {
  row: {
    id: string;
    containerId: string;
    type: string;
    carrier: string;
    placeOfLoading: string;
    placeOfLoadingCountry: string;
    finalDestinationCity: string;
    finalDestinationCountry: string;
    grossWeight: number;
    volume: number;
    packages: number;
    commodity: string;
  };
}

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
  // Container Types
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
  // Trailer Types
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
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Documentation', label: 'Documentation' },
  { value: 'Container Detention', label: 'Container Detention' },
  { value: 'Storage', label: 'Storage' },
];

export function EquipmentRowExpanded({ row }: EquipmentRowExpandedProps) {
  const [activeTab, setActiveTab] = useState('services');
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([
    {
      id: '1',
      equipmentId: row.id,
      serviceType: 'Sea Freight',
      equipment: '40HC',
      invoiceParty: '',
      agreedRate: '',
      serviceProvider: '',
      agreedCost: '',
    }
  ]);

  const [netWeight, setNetWeight] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const denseHeadBase = `${tableClasses.denseHead} text-left text-gray-400`;
  const denseHead = `${denseHeadBase} border-r border-gray-700`;
  const denseCell = `${tableClasses.denseCell} border-r border-gray-700`;

  // Auto-calculated values
  const totalVolume = length && width && height 
    ? (parseFloat(length) * parseFloat(width) * parseFloat(height)).toFixed(2)
    : '0.00';
  
  const totalDensity = grossWeight && totalVolume && parseFloat(totalVolume) > 0
    ? (parseFloat(grossWeight) / parseFloat(totalVolume)).toFixed(2)
    : '0.00';

  const handleAddRow = () => {
    const newRow: ServiceRow = {
      id: String(Date.now()),
      equipmentId: row.id,
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
    <div className="bg-[#1E1E1E]">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex gap-6 px-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-1 border-b-2 text-sm transition-colors ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('weight-dimensions')}
            className={`py-3 px-1 border-b-2 text-sm transition-colors ${
              activeTab === 'weight-dimensions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Weight & Dimensions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'services' && (
        <ServicesIntegrated equipmentId={row.id} containerId={row.containerId} />
      )}

      {activeTab === 'weight-dimensions' && (
        <div className="border-t border-gray-700">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-800">
                <th className={denseHead}>
                  Net Weight
                </th>
                <th className={denseHead}>
                  Gross Weight
                </th>
                <th className={denseHead}>
                  Length
                </th>
                <th className={denseHead}>
                  Width
                </th>
                <th className={denseHead}>
                  Height
                </th>
                <th className={denseHead}>
                  Total Volume
                </th>
                <th className={denseHeadBase}>
                  Total Density
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#1E1E1E] hover:bg-gray-800">
                {/* Net Weight */}
                <td className={denseCell}>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={netWeight}
                      onChange={(e) => setNetWeight(e.target.value)}
                      className="flex-1 px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300"
                      placeholder="0.00"
                      step="0.01"
                    />
                    <select className="px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300">
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                      <option value="tons">tons</option>
                    </select>
                  </div>
                </td>

                {/* Gross Weight */}
                <td className={denseCell}>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value)}
                      className="flex-1 px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300"
                      placeholder="0.00"
                      step="0.01"
                    />
                    <select className="px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300">
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                      <option value="tons">tons</option>
                    </select>
                  </div>
                </td>

                {/* Length */}
                <td className={denseCell}>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="flex-1 px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300"
                      placeholder="0.00"
                      step="0.01"
                    />
                    <select className="px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300">
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                      <option value="in">in</option>
                      <option value="ft">ft</option>
                    </select>
                  </div>
                </td>

                {/* Width */}
                <td className={denseCell}>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="flex-1 px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300"
                      placeholder="0.00"
                      step="0.01"
                    />
                    <select className="px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300">
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                      <option value="in">in</option>
                      <option value="ft">ft</option>
                    </select>
                  </div>
                </td>

                {/* Height */}
                <td className={denseCell}>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="flex-1 px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300"
                      placeholder="0.00"
                      step="0.01"
                    />
                    <select className="px-1.5 py-1 text-xs border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-800 text-gray-300">
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                      <option value="in">in</option>
                      <option value="ft">ft</option>
                    </select>
                  </div>
                </td>

                {/* Total Volume - Auto Calculated */}
                <td className={denseCell}>
                  <input
                    type="text"
                    value={totalVolume}
                    className="w-full px-1.5 py-1 text-xs border border-gray-600 rounded bg-gray-900 text-gray-400"
                    placeholder="0.00"
                    readOnly
                  />
                </td>

                {/* Total Density - Auto Calculated */}
                <td className={tableClasses.denseCell}>
                  <input
                    type="text"
                    value={totalDensity}
                    className="w-full px-1.5 py-1 text-xs border border-gray-600 rounded bg-gray-900 text-gray-400"
                    placeholder="0.00"
                    readOnly
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
