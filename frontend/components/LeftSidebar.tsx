import { 
  Users, 
  Ship, 
  Handshake,
  Briefcase,
  DollarSign,
  UserCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  Package,
  TrendingUp,
  Building2,
  Calculator,
  Receipt,
  CreditCard,
  Wallet,
  Banknote,
  ArrowUpDown,
  PieChart,
  Percent,
  FileSpreadsheet,
  Tag,
  Truck,
  ClipboardList,
  Database,
  LayoutTemplate,
  UserCheck,
  Settings2,
  LayoutDashboard
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { useAuth } from '../context/AuthContext';
import { modulePermission } from '../lib/modulePermissions';

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    subItems: [
      { id: 'main-dashboard', label: 'Overview', icon: PieChart },
    ]
  },
  { 
    id: 'crm', 
    label: 'CRM', 
    icon: Users,
    subItems: [
      { id: 'sales-leads', label: 'Sales Leads', icon: TrendingUp },
      { id: 'meeting-minutes', label: 'Meeting Minutes', icon: Calendar },
      { id: 'quotation-desk', label: 'Quotation Desk', icon: FileSpreadsheet },
      { id: 'partners-management', label: 'Partners', icon: Handshake },
    ]
  },
  { 
    id: 'pricing', 
    label: 'Pricing', 
    icon: Tag,
    subItems: [
      { id: 'available-loads', label: 'Available Loads', icon: Truck },
      { id: 'buy-rates-contracts', label: 'Buy Rates & Contracts', icon: ClipboardList },
      { id: 'pricing-models', label: 'Pricing Models', icon: LayoutTemplate },
      { id: 'supplier-directory', label: 'Supplier Directory', icon: Database },
    ]
  },
  { 
    id: 'shipments', 
    label: 'Booking Desk', 
    icon: Ship,
    subItems: [
      { id: 'booking-sheet', label: 'Booking Sheet', icon: Package },
      { id: 'booking-details', label: 'Booking Details', icon: FileText },
    ]
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: Briefcase,
    subItems: [
      { id: 'service-management', label: 'Service Management', icon: Settings2 },
      { id: 'equipment', label: 'Equipment', icon: Package },
    ]
  },
  { 
    id: 'financials', 
    label: 'Financials', 
    icon: DollarSign,
    subItems: [
      { id: 'cost-control', label: 'Cost Control', icon: Calculator },
      { id: 'invoicing', label: 'Invoicing', icon: Receipt },
      { id: 'receivables', label: 'Receivables', icon: CreditCard },
      { id: 'payables', label: 'Payables', icon: Wallet },
      { id: 'bank-transactions', label: 'Bank Transactions', icon: Banknote },
      { id: 'forex-management', label: 'Exchange Rates', icon: ArrowUpDown },
      { id: 'profit-loss', label: 'Profit & Loss', icon: PieChart },
      { id: 'tax-compliance', label: 'Tax Compliance', icon: Percent },
    ]
  },
  { 
    id: 'human-resources', 
    label: 'Human Resources', 
    icon: UserCircle,
    subItems: [
      { id: 'employees', label: 'Employees', icon: UserCheck },
    ]
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings2,
    subItems: [
      { id: 'user-management',    label: 'User Management',    icon: UserCheck },
      { id: 'audit-log',          label: 'Audit Log',          icon: ClipboardList },
      { id: 'company-settings',   label: 'Company Settings',   icon: Building2 },
    ]
  },
];

interface LeftSidebarProps {
  activeModule?: string;
  onModuleChange?: (moduleId: string) => void;
  incompleteInvoicesCount?: number;
}

export function LeftSidebar({ activeModule = 'main-dashboard', onModuleChange, incompleteInvoicesCount = 0 }: LeftSidebarProps) {
  const { settings, logoUrl } = useCompanySettings();
  const { can } = useAuth();

  const visibleMenuItems = useMemo(() => {
    return menuItems
      .map((item) => {
        if (!item.subItems?.length) {
          return can(modulePermission(item.id)) ? item : null;
        }
        const subItems = item.subItems.filter((subItem) => can(modulePermission(subItem.id)));
        return subItems.length ? { ...item, subItems } : null;
      })
      .filter((item): item is MenuItem => Boolean(item));
  }, [can]);

  const initialExpanded = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const item of visibleMenuItems) {
      if (item.subItems?.some((s) => s.id === activeModule)) {
        result[item.id] = true;
      }
    }
    return result;
  }, []); // only on mount — intentionally not reactive

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(initialExpanded);
  const brandLine = settings?.trading_name || settings?.legal_name;

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.subItems && item.subItems.length > 0) {
      toggleMenu(item.id);
    } else {
      onModuleChange?.(item.id);
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#1E1E1E] text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-700">
        {logoUrl ? (
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Company logo" className="h-10 w-auto max-w-[140px] object-contain" />
            {brandLine && <span className="text-sm text-white truncate">{brandLine}</span>}
          </div>
        ) : (
          <h1 className="text-xl text-white">
            {brandLine
              ? <span>{brandLine}</span>
              : <><span className="text-[#2563EB]">Eagle</span> Logistics</>}
          </h1>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus[item.id];
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                    isActive && !hasSubItems
                      ? 'bg-[#2563EB] text-white'
                      : 'text-gray-300 hover:bg-[#262626] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm flex-1 text-left">{item.label}</span>
                  {/* Notification Badge for Financials */}
                  {item.id === 'financials' && incompleteInvoicesCount > 0 && (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {incompleteInvoicesCount}
                    </span>
                  )}
                  {hasSubItems && (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )
                  )}
                </button>
                
                {/* Sub Menu Items */}
                {hasSubItems && isExpanded && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {item.subItems!.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeModule === subItem.id;
                      
                      return (
                        <li key={subItem.id}>
                          <button
                            onClick={() => onModuleChange?.(subItem.id)}
                            data-module-id={subItem.id}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                              isSubActive
                                ? 'bg-[#2563EB] text-white'
                                : 'text-gray-400 hover:bg-[#262626] hover:text-white'
                            }`}
                          >
                            <SubIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{subItem.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          Version 2.4.1
        </div>
      </div>
    </aside>
  );
}
