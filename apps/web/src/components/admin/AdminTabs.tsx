type TabType = 'founders' | 'predicates' | 'objects' | 'ofc-categories';

interface TabConfig {
  id: TabType;
  label: string;
  count: number;
  total: number;
}

interface AdminTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  tabs: TabConfig[];
}

export function AdminTabs({ activeTab, setActiveTab, tabs }: AdminTabsProps) {
  return (
    <div className="flex gap-2 border-b border-white/10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          {tab.label} ({tab.count}/{tab.total})
        </button>
      ))}
    </div>
  );
}

export type { TabType, TabConfig };
