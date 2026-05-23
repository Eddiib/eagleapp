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
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen
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
      { id: 'partners-management', label: 'Partners', icon: Handshake },
      { id: 'sales-leads', label: 'Sales Leads', icon: TrendingUp },
      { id: 'meeting-minutes', label: 'Meeting Minutes', icon: Calendar },
      { id: 'quotation-desk', label: 'Quotation Desk', icon: FileSpreadsheet },
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
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function LeftSidebar({
  activeModule = 'main-dashboard',
  onModuleChange,
  incompleteInvoicesCount = 0,
  collapsed = false,
  onCollapsedChange,
}: LeftSidebarProps) {
  const { settings, logoUrl } = useCompanySettings();
  const { can } = useAuth();
  const [isHovering, setIsHovering] = useState(false);
  const isExpandedView = !collapsed || isHovering;

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
  const brandInitial = (brandLine || 'Eagle Logistics').trim().charAt(0).toUpperCase();

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
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-[#1E1E1E] text-white flex flex-col z-[60] transition-[width,box-shadow] duration-300 ${
        isExpandedView ? 'w-60 shadow-2xl' : 'w-16 shadow-lg'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label="Primary navigation"
    >
      {/* Logo */}
      <div className={`${isExpandedView ? 'px-4 py-5' : 'px-2 py-4'} border-b border-gray-700`}>
        <div className={`flex items-center ${isExpandedView ? 'gap-2' : 'flex-col gap-3'}`}>
          <div className={`min-w-0 flex items-center ${isExpandedView ? 'flex-1 gap-3' : 'justify-center'}`}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company logo"
                className={`${isExpandedView ? 'h-10 max-w-[140px]' : 'h-8 w-8 max-w-8'} shrink-0 object-contain`}
              />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-[#2563EB] flex items-center justify-center text-sm font-semibold">
                {brandInitial}
              </div>
            )}
            {isExpandedView && (
              brandLine ? (
                <span className="min-w-0 truncate text-sm text-white">{brandLine}</span>
              ) : (
                <h1 className="min-w-0 truncate text-xl text-white">
                  <span className="text-[#2563EB]">Eagle</span> Logistics
                </h1>
              )
            )}
          </div>
          <button
            type="button"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="shrink-0 rounded-md p-2 text-gray-300 hover:bg-[#262626] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            title={collapsed ? 'Pin menu open' : 'Collapse menu'}
            aria-label={collapsed ? 'Pin menu open' : 'Collapse menu'}
          >
            {collapsed
              ? <PanelLeftOpen className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />
            }
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 ${isExpandedView ? 'px-3' : 'px-2'} py-4 overflow-y-auto overflow-x-hidden`}>
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus[item.id];
            const hasActiveSubItem = item.subItems?.some((subItem) => subItem.id === activeModule) ?? false;
            const isRailActive = isActive || hasActiveSubItem;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  title={!isExpandedView ? item.label : undefined}
                  aria-label={!isExpandedView ? item.label : undefined}
                  aria-expanded={hasSubItems ? isExpanded : undefined}
                  className={`relative flex w-full items-center rounded-md py-2.5 transition-colors ${
                    isExpandedView ? 'gap-3 px-3' : 'justify-center px-2'
                  } ${
                    (isActive && !hasSubItems) || (!isExpandedView && isRailActive)
                      ? 'bg-[#2563EB] text-white'
                      : 'text-gray-300 hover:bg-[#262626] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isExpandedView && (
                    <>
                      <span className="text-sm flex-1 text-left truncate">{item.label}</span>
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
                    </>
                  )}
                  {!isExpandedView && item.id === 'financials' && incompleteInvoicesCount > 0 && (
                    <span className="absolute ml-6 mt-[-18px] h-2.5 w-2.5 rounded-full bg-yellow-500 ring-2 ring-[#1E1E1E]" />
                  )}
                </button>
                
                {/* Sub Menu Items */}
                {hasSubItems && isExpanded && isExpandedView && (
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
                            <span className="text-sm truncate">{subItem.label}</span>
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
      <div className={`${isExpandedView ? 'px-4' : 'px-2'} py-4 border-t border-gray-700`}>
        {isExpandedView ? (
          <div className="text-xs text-gray-500">
            Version 2.4.1
          </div>
        ) : (
          <div className="mx-auto h-1.5 w-1.5 rounded-full bg-gray-600" aria-hidden="true" />
        )}
      </div>
    </aside>
  );
}
