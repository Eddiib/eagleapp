interface TabsNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabsNav({ activeTab, onTabChange }: TabsNavProps) {
  const tabs = [
    { id: 'equipment', label: 'Equipment Matrix' },
    { id: 'services', label: 'Services' },
    { id: 'docs', label: 'Docs' },
    { id: 'history', label: 'History' }
  ];

  return (
    <div className="bg-white dark:bg-[#262626] border-b border-gray-200 dark:border-[#374151] sticky top-[217px] z-30">
      <div className="px-6">
        <nav className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-3 border-b-2 transition-colors text-sm ${
                activeTab === tab.id
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-[#374151]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}