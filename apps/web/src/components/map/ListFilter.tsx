import { useNavigate } from 'react-router-dom';
import { FolderOpen, Settings } from 'lucide-react';
import type { List } from '#types/list';
import { getListIcon } from '#utils/listIconConfig';

interface ListFilterProps {
  lists: List[];
  selectedListId: string | null;
  onListChange: (listId: string | null) => void;
}

export function ListFilter({
  lists,
  selectedListId,
  onListChange,
}: ListFilterProps) {
  const navigate = useNavigate();

  const handleClick = (listId: string | null) => {
    // 같은 목록을 다시 클릭하면 '전체'로 돌아감
    if (selectedListId === listId && listId !== null) {
      onListChange(null);
    } else {
      onListChange(listId);
    }
  };

  const isSelected = (listId: string | null) => {
    return selectedListId === listId;
  };

  return (
    <div className="relative bg-card border-b border-border">
      <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mb-2">
        {/* 전체 장소 옵션 */}
        <button
          onClick={() => handleClick(null)}
          className={`
            relative px-4 py-3 flex items-center gap-2 whitespace-nowrap snap-start flex-shrink-0
            transition-all duration-200 font-medium rounded-t-lg
            ${
              isSelected(null)
                ? 'bg-primary-50/50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }
          `}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-sm md:text-base">전체 장소</span>
        </button>

        {/* 사용자 목록들 */}
        {lists.map((list) => {
          const selected = isSelected(list.id);
          let IconComponent: React.ComponentType<{ className?: string }> | null = null;

          // 아이콘 타입에 따라 처리
          if (list.iconType === 'category') {
            IconComponent = getListIcon(list.iconValue);
          }

          return (
            <button
              key={list.id}
              onClick={() => handleClick(list.id)}
              className={`
                relative px-4 py-3 flex items-center gap-2 whitespace-nowrap snap-start flex-shrink-0
                transition-all duration-200 font-medium rounded-t-lg
                ${
                  selected
                    ? 'bg-primary-50/50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              {/* 아이콘 렌더링 */}
              {list.iconType === 'category' && IconComponent ? (
                <IconComponent className="w-5 h-5" />
              ) : list.iconType === 'emoji' ? (
                <span className="text-lg">{list.iconValue}</span>
              ) : list.iconType === 'image' ? (
                <img
                  src={list.iconValue}
                  alt={list.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : null}

              <span className="text-sm md:text-base">{list.name}</span>

              {/* 장소 개수 표시 */}
              {list.placesCount > 0 && (
                <span className="text-xs opacity-60">({list.placesCount})</span>
              )}
            </button>
          );
        })}

        {/* 목록 관리 버튼 */}
        <button
          onClick={() => navigate('/lists')}
          className="
            relative px-4 py-3 flex items-center gap-2 whitespace-nowrap snap-start flex-shrink-0
            text-primary-600 dark:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/20
            transition-all duration-200 font-medium rounded-t-lg border border-dashed border-primary-300
          "
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm md:text-base">목록 관리</span>
        </button>
      </div>

      {/* 스크롤 힌트 그라디언트 */}
      <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-card to-transparent pointer-events-none"></div>
    </div>
  );
}
