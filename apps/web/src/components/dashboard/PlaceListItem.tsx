import { Link } from 'react-router-dom';
import { UtensilsCrossed, Coffee, Landmark, Hotel, ShoppingBag, MapPin, CheckCircle2 } from 'lucide-react';
import type { Place } from '#types/place';
import type { LucideIcon } from 'lucide-react';

interface PlaceListItemProps {
  place: Place;
}

// 카테고리별 아이콘 매핑
const categoryIcons: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  attraction: Landmark,
  hotel: Hotel,
  shopping: ShoppingBag,
  etc: MapPin,
};

// 상대 시간 표시 함수
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
  }
}

export default function PlaceListItem({ place }: PlaceListItemProps) {
  const CategoryIcon = categoryIcons[place.category] || categoryIcons.etc;
  const relativeTime = getRelativeTime(place.createdAt);

  return (
    <Link
      to={`/places/${place.id}`}
      className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
    >
      {/* Category Icon */}
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded-lg">
        {CategoryIcon && <CategoryIcon className="w-6 h-6 text-muted-foreground" />}
      </div>

      {/* Place Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground mb-1 truncate">
          {place.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate mb-1">{place.address}</p>
        <p className="text-xs text-muted-foreground">{relativeTime}</p>
      </div>

      {/* Visited Status */}
      {place.visited && (
        <div className="flex-shrink-0" title="방문 완료">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
      )}
    </Link>
  );
}
