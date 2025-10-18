import { Globe, MapPin } from 'lucide-react';

export type PlaceViewTab = 'explore' | 'my-places';

interface PlaceViewTabsProps {
  activeTab: PlaceViewTab;
  onTabChange: (tab: PlaceViewTab) => void;
  isAuthenticated: boolean;
  onLoginRequired?: () => void;
}

export function PlaceViewTabs({
  activeTab,
  onTabChange,
  isAuthenticated,
  onLoginRequired,
}: PlaceViewTabsProps) {
  const handleTabClick = (tab: PlaceViewTab) => {
    // 비인증 사용자가 '내 장소' 탭 클릭 시 로그인 유도
    if (tab === 'my-places' && !isAuthenticated) {
      onLoginRequired?.();
      return;
    }
    onTabChange(tab);
  };

  const tabs = [
    {
      id: 'explore' as PlaceViewTab,
      label: '탐색',
      icon: Globe,
      description: '공개된 장소 둘러보기',
    },
    {
      id: 'my-places' as PlaceViewTab,
      label: '내 목록',
      icon: MapPin,
      description: '목록별 장소 관리',
    },
  ];

  return (
    <div className="bg-card border-b border-border">
      <div className="flex gap-0">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          const Icon = tab.icon;
          const disabled = tab.id === 'my-places' && !isAuthenticated;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              disabled={disabled && false} // Keep button clickable for login prompt
              className={`
                relative flex-1 px-4 py-3 flex items-center justify-center gap-2
                transition-all duration-200 font-medium
                ${
                  selected
                    ? 'bg-primary-50/50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
                ${disabled ? 'opacity-60' : ''}
              `}
              title={tab.description}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm md:text-base">{tab.label}</span>
              {disabled && !selected ? (
                <span className="ml-1 text-xs opacity-75">(로그인 필요)</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
