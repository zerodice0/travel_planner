import { AlertCircle } from 'lucide-react';
import AppLayout from '#components/layout/AppLayout';
import StatsCard from '#components/dashboard/StatsCard';
import { useDashboardData } from '#hooks/useDashboardData';

// Skeleton 로딩 컴포넌트
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

export default function StatsPage() {
  const { stats, isLoading, error, refetch } = useDashboardData();

  return (
    <AppLayout title="내 통계">
      <div className="max-w-screen-lg mx-auto p-4 space-y-6">
        {/* 페이지 헤더 */}
        <section>
          <h1 className="text-2xl font-bold text-foreground mb-2">내 통계</h1>
          <p className="text-muted-foreground">
            나의 여행 기록과 활동을 한눈에 확인하세요.
          </p>
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

        {/* 통계 설명 */}
        {!isLoading && !error && stats && (
          <section className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">통계 안내</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">장소:</strong> 저장한 전체 장소 수
              </p>
              <p>
                <strong className="text-foreground">방문:</strong> 방문한 것으로 표시한 장소 수
              </p>
              <p>
                <strong className="text-foreground">방문률:</strong> 전체 장소 중 방문한 장소의 비율
              </p>
              <p>
                <strong className="text-foreground">목록:</strong> 생성한 전체 목록 수
              </p>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
