import { Link, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Edit, CheckCircle, FolderPlus, FolderOpen, FileEdit } from 'lucide-react';
import type { Activity, ActivityType } from '#types/activity';
import type { LucideIcon } from 'lucide-react';
import { getCategoryIcon, getCategoryLabel } from '#utils/categoryConfig';

interface ActivityCardProps {
  activity: Activity;
}

// 활동 타입별 설정
const activityConfig: Record<
  ActivityType,
  {
    icon: LucideIcon;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  place_added: {
    icon: MapPin,
    label: '장소 추가',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  place_updated: {
    icon: Edit,
    label: '장소 수정',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  place_visited: {
    icon: CheckCircle,
    label: '방문 완료',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  place_added_to_list: {
    icon: FolderPlus,
    label: '리스트에 추가',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  list_created: {
    icon: FolderOpen,
    label: '리스트 생성',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  list_updated: {
    icon: FileEdit,
    label: '리스트 수정',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
};

// 활동 링크 생성
function getActivityLink(activity: Activity): string {
  if (activity.place) return `/places/${activity.place.id}`;
  if (activity.list) return `/lists/${activity.list.id}`;
  return '#';
}

// 활동 제목 생성
function getActivityTitle(activity: Activity): string {
  switch (activity.type) {
    case 'place_added':
      return `"${activity.place?.name}" 추가`;
    case 'place_updated':
      return `"${activity.place?.name}" 수정`;
    case 'place_visited':
      return `"${activity.place?.name}" 방문 완료`;
    case 'place_added_to_list':
      return `"${activity.list?.name}"에 장소 추가`;
    case 'list_created':
      return `"${activity.list?.name}" 리스트 생성`;
    case 'list_updated':
      return `"${activity.list?.name}" 리스트 수정`;
    default:
      return '활동';
  }
}

// 활동 설명 생성
function getActivityDescription(activity: Activity): {
  text: string;
  icon?: LucideIcon;
} {
  switch (activity.type) {
    case 'place_added':
    case 'place_updated':
    case 'place_visited':
      return {
        text: activity.place?.category ? getCategoryLabel(activity.place.category) : '',
        icon: activity.place?.category ? getCategoryIcon(activity.place.category) : undefined,
      };
    case 'place_added_to_list':
      return { text: `${activity.place?.name}` };
    case 'list_created':
    case 'list_updated':
      return { text: activity.list?.name || '' };
    default:
      return { text: '' };
  }
}

// 상대 시간 표시
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return '방금 전';
  } else if (diffInMinutes < 60) {
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

export default function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate();
  const config = activityConfig[activity.type];
  const Icon = config.icon;
  const description = getActivityDescription(activity);

  // 근처 탐색 기능
  const handleExploreNearby = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (activity.place) {
      navigate(
        `/map?lat=${activity.place.latitude}&lng=${activity.place.longitude}&zoom=15`
      );
    }
  };

  return (
    <Link
      to={getActivityLink(activity)}
      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
    >
      {/* Activity Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground mb-0.5">
          {getActivityTitle(activity)}
        </p>
        <p className="text-xs text-muted-foreground truncate mb-1 flex items-center gap-1">
          {description.icon && <description.icon className="inline w-3 h-3" />}
          {description.text}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="inline w-3 h-3" />
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>

      {/* Action Button (장소 활동일 경우에만 표시) */}
      {activity.place && (
        <button
          onClick={handleExploreNearby}
          className="flex-shrink-0 px-3 py-1.5 text-xs bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 transition-colors"
        >
          근처 탐색
        </button>
      )}
    </Link>
  );
}
