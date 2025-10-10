import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '#components/ui/Button';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'restaurant', label: '맛집' },
  { value: 'cafe', label: '카페' },
  { value: 'attraction', label: '관광' },
  { value: 'shopping', label: '쇼핑' },
  { value: 'culture', label: '문화' },
  { value: 'nature', label: '자연' },
  { value: 'accommodation', label: '숙박' },
  { value: 'etc', label: '기타' },
];

export function CategoryFilter({
  selectedCategories,
  onCategoryChange,
  onClose,
}: CategoryFilterProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedCategories);

  const handleToggle = (value: string) => {
    if (value === 'all') {
      setTempSelected([]);
      return;
    }

    if (tempSelected.includes(value)) {
      setTempSelected(tempSelected.filter((c) => c !== value));
    } else {
      setTempSelected([...tempSelected, value]);
    }
  };

  const handleApply = () => {
    onCategoryChange(tempSelected);
    onClose();
  };

  const handleReset = () => {
    setTempSelected([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">카테고리 필터</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {CATEGORIES.map((category) => {
            const isSelected =
              category.value === 'all'
                ? tempSelected.length === 0
                : tempSelected.includes(category.value);

            return (
              <label
                key={category.value}
                className={`
                  flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                  ${
                    isSelected
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-background border-2 border-transparent hover:bg-muted'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(category.value)}
                  className="w-5 h-5 text-primary bg-background border-input rounded focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-foreground font-medium">{category.label}</span>
              </label>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReset} className="flex-1">
            초기화
          </Button>
          <Button onClick={handleApply} className="flex-1">
            적용
          </Button>
        </div>
      </div>
    </div>
  );
}
