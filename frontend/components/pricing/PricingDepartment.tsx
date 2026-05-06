import { AvailableLoads } from './AvailableLoads';
import { BuyRatesContracts } from './BuyRatesContracts';
import { PricingModels } from './PricingModels';
import { SupplierDirectory } from './SupplierDirectory';

interface PricingDepartmentProps {
  activeSubModule: string;
}

export function PricingDepartment({ activeSubModule }: PricingDepartmentProps) {
  switch (activeSubModule) {
    case 'available-loads':
      return <AvailableLoads />;
    case 'buy-rates-contracts':
      return <BuyRatesContracts />;
    case 'pricing-models':
      return <PricingModels />;
    case 'supplier-directory':
      return <SupplierDirectory />;
    default:
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Select a pricing module from the sidebar.
        </div>
      );
  }
}
