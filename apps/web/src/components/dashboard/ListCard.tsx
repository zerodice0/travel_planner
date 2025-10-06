import { Link } from 'react-router-dom';
import { Folder } from 'lucide-react';
import type { List } from '#types/list';

interface ListCardProps {
  list: List;
}

export default function ListCard({ list }: ListCardProps) {
  const progressPercentage =
    list.placesCount > 0 ? (list.visitedCount / list.placesCount) * 100 : 0;

  return (
    <Link
      to={`/lists/${list.id}`}
      className="flex-shrink-0 w-40 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-primary-50">
        {list.iconType === 'emoji' ? (
          <span className="text-2xl">{list.iconValue}</span>
        ) : (
          <Folder className="w-6 h-6 text-primary-600" />
        )}
      </div>

      {/* List Name */}
      <h3 className="text-sm font-semibold text-foreground mb-1 truncate">
        {list.name}
      </h3>

      {/* Places Count */}
      <p className="text-xs text-muted-foreground mb-2">{list.placesCount}개 장소</p>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-primary-500 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Progress Text */}
      <p className="text-xs text-muted-foreground">
        {list.visitedCount}/{list.placesCount} 방문
      </p>
    </Link>
  );
}
