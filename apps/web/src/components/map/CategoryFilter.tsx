// CategoryFilter는 이제 인라인 컴포넌트로 사용됨 (모달 아님)
import { CATEGORIES } from '#utils/categoryConfig';

interface CategoryFilterProps {
  selectedCategory: string; // 단일 선택으로 변경
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const handleClick = (value: string) => {
    // 같은 카테고리를 다시 클릭하면 '전체'로 돌아감
    if (selectedCategory === value && value !== '') {
      onCategoryChange('');
    } else {
      onCategoryChange(value);
    }
  };

  const isSelected = (value: string) => {
    // 'all'은 selectedCategory가 빈 문자열일 때 선택됨
    if (value === 'all') {
      return selectedCategory === '';
    }
    return selectedCategory === value;
  };

  return (
    <div className="relative bg-card border-b border-border">
      <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mb-2">
        {CATEGORIES.map((category) => {
          const selected = isSelected(category.value);
          const Icon = category.icon;
          return (
            <button
              key={category.value}
              onClick={() => handleClick(category.value === 'all' ? '' : category.value)}
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
              <Icon className="w-5 h-5" />
              <span className="text-sm md:text-base">{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* 스크롤 힌트 그라디언트 */}
      <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-card to-transparent pointer-events-none"></div>
    </div>
  );
}
