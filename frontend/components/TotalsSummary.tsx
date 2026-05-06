import { Package, Weight, Box } from 'lucide-react';

export function TotalsSummary() {
  return (
    <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <Package className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm text-gray-600 uppercase tracking-wide">Totals Summary</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Weight className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Gross Weight</div>
              <div className="text-2xl text-gray-900 tabular-nums">51,800 <span className="text-sm text-gray-500">kg</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Volume</div>
              <div className="text-2xl text-gray-900 tabular-nums">133 <span className="text-sm text-gray-500">m³</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Packages</div>
              <div className="text-2xl text-gray-900 tabular-nums">265</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
