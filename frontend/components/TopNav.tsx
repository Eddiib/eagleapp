import { useState } from 'react';
import { Bell, ChevronDown, Moon, Sun, LogOut, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTabs } from '../context/TabsContext';

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrator',
  manager:    'Manager',
  sales:      'Sales',
  operations: 'Operations',
  accounting: 'Accounting',
  viewer:     'Viewer',
};

interface TopNavProps {
  onToggleDarkMode?: () => void;
  darkMode?: boolean;
}

export function TopNav({ onToggleDarkMode, darkMode = false }: TopNavProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { tabs, activeTabId, selectTab, closeTab } = useTabs();

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-[#374151] dark:bg-[#262626]">
      <div className="min-w-0 px-3 py-2 sm:px-6">
        <div className="flex items-center justify-between gap-4">

          {/* Tabs */}
          <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Open pages">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  className={`group flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-t-md border-b-2 max-w-[200px] flex-shrink-0 ${
                    isActive
                      ? 'bg-gray-100 dark:bg-[#1E1E1E] border-[#2563EB] text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E1E]'
                  }`}
                  title={tab.title}
                >
                  <button
                    type="button"
                    onClick={() => { void selectTab(tab.id); }}
                    className="min-w-0 flex-1 truncate text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#262626] rounded-sm"
                    role="tab"
                    aria-selected={isActive}
                  >
                    {tab.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => { void closeTab(tab.id); }}
                    className={`shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#262626] ${
                      isActive ? 'opacity-70' : 'opacity-0 group-hover:opacity-70 group-focus-within:opacity-70 focus:opacity-100'
                    }`}
                    aria-label={`Close ${tab.title}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode
                ? <Sun className="w-5 h-5 text-yellow-500" />
                : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-[#374151]" />

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-50 dark:hover:bg-[#1E1E1E] rounded-md transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-[#374151]" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1E1E1E] rounded-md transition-colors"
              >
                <div className="w-7 h-7 bg-[#030213] dark:bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-semibold">
                    {user?.display_name?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">
                    {user?.display_name ?? user?.username}
                  </div>
                  <div className="text-xs text-gray-400 leading-tight">
                    {user?.role_name ?? ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#374151] rounded-lg shadow-lg z-20 py-1">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#374151]">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.display_name ?? user?.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {user?.role_name ?? ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
