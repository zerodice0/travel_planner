import { Link } from 'react-router-dom';
import { FolderOpen, AlertCircle, Activity as ActivityIcon } from 'lucide-react';
import AppLayout from '#components/layout/AppLayout';
import SearchBar from '#components/dashboard/SearchBar';
import StatsCard from '#components/dashboard/StatsCard';
import ListCard from '#components/dashboard/ListCard';
import ActivityCard from '#components/dashboard/ActivityCard';
import { useDashboardData } from '#hooks/useDashboardData';

// Skeleton 로딩 컴포넌트들
function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center p-4 bg-card rounded-lg border border-border animate-pulse"
        >
          <div className="w-8 h-8 bg-muted rounded-full mb-2"></div>
          <div className="w-12 h-6 bg-muted rounded mb-1"></div>
          <div className="w-8 h-3 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-40 p-4 bg-card rounded-xl border border-border animate-pulse"
        >
          <div className="w-12 h-12 bg-muted rounded-full mb-3"></div>
          <div className="w-24 h-4 bg-muted rounded mb-2"></div>
          <div className="w-16 h-3 bg-muted rounded mb-2"></div>
          <div className="w-full h-1.5 bg-muted rounded-full mb-1"></div>
          <div className="w-12 h-3 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  );
}

function PlaceListItemSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border animate-pulse"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-muted rounded mb-2"></div>
            <div className="w-48 h-3 bg-muted rounded mb-1"></div>
            <div className="w-16 h-3 bg-muted rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 에러 표시 컴포넌트
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4 text-center">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { stats, lists, activities, isLoading, error, refetch } = useDashboardData();

  return (
    <AppLayout title="Travel Planner">
      <div className="max-w-screen-lg mx-auto p-4 space-y-6">
        {/* 검색 바 */}
        <section>
          <SearchBar />
        </section>

        {/* 통계 카드 */}
        <section>
          {isLoading ? (
            <StatsCardSkeleton />
          ) : error ? (
            <ErrorMessage message="통계를 불러오는데 실패했습니다." onRetry={refetch} />
          ) : stats ? (
            <StatsCard stats={stats} />
          ) : null}
        </section>

        {/* 내 목록 섹션 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">내 목록</h2>
            <Link
              to="/lists"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              전체 보기 →
            </Link>
          </div>

          {isLoading ? (
            <ListCardSkeleton />
          ) : lists.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">아직 생성된 목록이 없습니다.</p>
              <Link
                to="/lists/new"
                className="inline-block mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
              >
                첫 목록 만들기
              </Link>
            </div>
          )}
        </section>

        {/* 최근 활동 섹션 */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">최근 활동</h2>

          {isLoading ? (
            <PlaceListItemSkeleton />
          ) : activities.length > 0 ? (
            <div className="space-y-2">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ActivityIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">아직 활동 내역이 없습니다.</p>
              <Link
                to="/map"
                className="inline-block mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
              >
                장소 추가하기
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
