/**
 * Convex Authentication Configuration with Clerk
 *
 * Clerk JWT 토큰 검증을 위한 Convex 인증 설정
 *
 * @see https://docs.convex.dev/auth/clerk
 * @see https://clerk.com/docs/backend-requests/handling/manual-jwt
 */

/**
 * Clerk JWT Issuer URL
 *
 * Clerk 대시보드에서 확인 가능:
 * 1. Clerk Dashboard > Configure > JWT Templates
 * 2. Convex template 선택 또는 생성
 * 3. Issuer 필드 확인
 *
 * 형식: https://[your-clerk-domain].clerk.accounts.dev
 */
export const clerkIssuerUrl = process.env.CLERK_JWT_ISSUER_DOMAIN;

/**
 * Clerk JWT 검증을 위한 인증 설정
 *
 * Convex는 이 설정을 사용하여:
 * 1. Clerk에서 발급한 JWT 토큰 검증
 * 2. 토큰의 서명 확인 (JWKS 사용)
 * 3. 인증된 사용자 정보 추출
 */
export default {
  providers: [
    {
      domain: clerkIssuerUrl,
      applicationID: "convex",
    },
  ],
};
