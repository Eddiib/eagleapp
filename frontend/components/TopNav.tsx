import { useState } from 'react';
import { Search, Bell, ChevronDown, Moon, Sun, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrator',
  management: 'Management',
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

  return (
    <nav className="bg-white dark:bg-[#262626] border-b border-gray-200 dark:border-[#374151] sticky top-0 z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">

          {/* Search */}
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search across Eagle Logistics…"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#374151] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-300 placeholder-gray-400 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                    {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
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
                          {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
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
