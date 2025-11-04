import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '#contexts/AuthContext';
import { LoginDialog } from '#components/LoginDialog';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// 페이지 경로에서 사용자 친화적인 이름 추출
function getPageName(pathname: string): string {
  const pathMap: Record<string, string> = {
    '/map': '지도',
    '/dashboard': '대시보드',
    '/places': '장소 상세',
    '/lists': '장소 리스트',
    '/search': '검색',
    '/categories': '카테고리 관리',
    '/settings': '설정',
  };

  for (const [path, name] of Object.entries(pathMap)) {
    if (pathname.startsWith(path)) {
      return name;
    }
  }

  return '이 페이지';
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // LoginDialog 표시 (페이지 리다이렉트 대신)
    return (
      <LoginDialog
        isOpen={true}
        onClose={() => {
          // 닫기 버튼을 누르면 /explore로 이동
          navigate('/explore', { replace: true });
        }}
        onLoginSuccess={() => {
          // 로그인 성공 시 다이얼로그가 자동으로 닫히고 children이 렌더링됨
          // 추가 작업 불필요 (AuthContext가 isAuthenticated를 업데이트)
        }}
        title="로그인이 필요합니다"
        message={`${getPageName(location.pathname)}에 접근하려면 로그인이 필요합니다.`}
      />
    );
  }

  return <>{children}</>;
}
