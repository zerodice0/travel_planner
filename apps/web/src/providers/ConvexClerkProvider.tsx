/**
 * ConvexClerkProvider - Convex와 Clerk를 통합하는 Provider 컴포넌트
 *
 * Clerk의 인증 상태와 Convex 클라이언트를 연결하여
 * Convex 쿼리/뮤테이션에서 인증된 사용자 정보를 사용할 수 있게 합니다.
 *
 * @see https://docs.convex.dev/auth/clerk
 */

import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

// TODO: Phase 1에서 Convex 패키지 설치 후 주석 해제
// import { useAuth } from '@clerk/clerk-react';
// import { ConvexReactClient } from 'convex/react';
// import { ConvexProviderWithClerk } from 'convex/react-clerk';

/**
 * Convex 클라이언트 인스턴스
 *
 * 환경변수 VITE_CONVEX_URL에서 Convex 배포 URL을 가져옵니다.
 * 형식: https://[your-deployment-name].convex.cloud
 */
// TODO: Phase 1에서 Convex 패키지 설치 후 주석 해제
// const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

/**
 * Provider Props 타입
 */
interface ConvexClerkProviderProps {
  /** Clerk Publishable Key */
  clerkPublishableKey: string;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

/**
 * ConvexClerkProvider 컴포넌트
 *
 * Clerk와 Convex를 함께 사용하기 위한 통합 Provider입니다.
 *
 * Provider 순서 (중요):
 * 1. ClerkProvider (최상위)
 * 2. ConvexProviderWithClerk (Clerk의 인증 상태를 Convex에 전달)
 * 3. 애플리케이션 컴포넌트
 *
 * @example
 * ```tsx
 * <ConvexClerkProvider clerkPublishableKey={clerkPubKey}>
 *   <App />
 * </ConvexClerkProvider>
 * ```
 */
export function ConvexClerkProvider({
  clerkPublishableKey,
  children,
}: ConvexClerkProviderProps) {
  // Phase 0: Clerk만 제공 (Convex는 Phase 1에서 추가)
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {children}
    </ClerkProvider>
  );

  // TODO: Phase 1에서 Convex 패키지 설치 후 아래 코드로 교체
  /*
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
  */
}
