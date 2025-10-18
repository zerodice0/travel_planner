import { Trash2 } from 'lucide-react';
import type { Place } from '#types/place';
import { getCategoryIcon, getCategoryLabel } from '#utils/categoryConfig';

interface PlaceCardProps {
  place: Place;
  isSelected?: boolean;
  onClick: (place: Place) => void;
  onDelete?: (place: Place) => void;
}

export default function PlaceCard({ place, isSelected = false, onClick, onDelete }: PlaceCardProps) {
  const CategoryIcon = getCategoryIcon(place.category);
  const categoryLabel = getCategoryLabel(place.category);

  return (
    <div
      onClick={() => onClick(place)}
      className={`
        group p-3 rounded-lg cursor-pointer transition-all relative
        ${
          isSelected
            ? 'bg-primary/10 border-2 border-primary shadow-md'
            : 'bg-card border border-border hover:bg-muted hover:shadow-sm'
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(place);
        }
      }}
      aria-label={`${place.name} - ${categoryLabel}`}
    >
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(place);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-card border border-border hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
          aria-label="장소 삭제"
          title="장소 삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Header: Name and Icon */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight flex-1 pr-2">
          {place.name}
        </h3>
        <CategoryIcon className="w-5 h-5 flex-shrink-0 text-muted-foreground" aria-label={categoryLabel} />
      </div>

      {/* Category */}
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs text-muted-foreground">{categoryLabel}</span>
      </div>

      {/* Address */}
      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{place.address}</p>

      {/* Description */}
      {place.description ? (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
          {place.description}
        </p>
      ) : null}

      {/* Visited Badge */}
      {place.visited ? (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
          <span>✓</span>
          <span>방문 완료</span>
        </div>
      ) : null}
    </div>
  );
}
