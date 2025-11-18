# Phase 0: Convex + Clerk 설정 가이드

Phase 0 완료 후 Convex와 Clerk를 실제로 사용하기 위한 설정 가이드입니다.

## 1. Clerk 설정

### 1.1 Clerk Application 생성

1. [Clerk Dashboard](https://dashboard.clerk.com/) 접속
2. "Add application" 클릭
3. Application name 입력 (예: "Travel Planner")
4. Sign-in options 선택 (이메일, 소셜 로그인 등)

### 1.2 Publishable Key 복사

1. Clerk Dashboard > API Keys
2. Publishable Key 복사
3. `apps/web/.env` 파일에 추가:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
   ```

### 1.3 JWT Template 생성 (Convex 연동용)

1. Clerk Dashboard > Configure > JWT Templates
2. "New template" 클릭
3. Template name: "Convex"
4. Claims 설정:
   ```json
   {
     "aud": "convex"
   }
   ```
5. "Apply" 클릭
6. Issuer URL 복사 (예: `https://your-app.clerk.accounts.dev`)

## 2. Convex 설정

### 2.1 Convex 프로젝트 생성

```bash
# Convex CLI 설치 (이미 설치된 경우 생략)
npm install -g convex

# Convex 프로젝트 초기화
npx convex dev
```

프롬프트에 따라:
- Login/Signup 진행
- 프로젝트 이름 입력
- Team 선택

### 2.2 Convex URL 복사

`npx convex dev` 실행 시 출력되는 URL 복사:

```
Convex functions ready! (19.31ms)
  https://your-deployment.convex.cloud
```

`apps/web/.env` 파일에 추가:
```bash
VITE_CONVEX_URL="https://your-deployment.convex.cloud"
```

### 2.3 Clerk JWT Issuer 설정

`convex/.env` 파일 생성 후 추가:

```bash
CLERK_JWT_ISSUER_DOMAIN="https://your-app.clerk.accounts.dev"
```

⚠️ **주의**: Clerk Dashboard에서 복사한 Issuer URL과 정확히 일치해야 합니다.

### 2.4 Google Places API Key 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. API 및 서비스 > 사용자 인증 정보
3. API 키 생성
4. Places API (New) 활성화
5. `convex/.env` 파일에 추가:
   ```bash
   GOOGLE_PLACES_API_KEY="your-google-places-api-key"
   ```

## 3. 환경변수 검증

### 3.1 Frontend (.env)

```bash
# apps/web/.env
VITE_CONVEX_URL="https://your-deployment.convex.cloud"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_KAKAO_MAP_KEY="your-kakao-map-javascript-key"
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
VITE_GOOGLE_MAP_ID="your-google-map-id"
```

### 3.2 Backend (.env)

```bash
# convex/.env
CLERK_JWT_ISSUER_DOMAIN="https://your-app.clerk.accounts.dev"
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
```

## 4. Phase 1 준비 사항

Phase 1에서 실제 Convex를 활성화하려면:

### 4.1 Convex 패키지 설치

```bash
npm install convex
```

### 4.2 ConvexClerkProvider 활성화

`apps/web/src/providers/ConvexClerkProvider.tsx`:
- TODO 주석 해제
- Phase 0 임시 코드 삭제
- Convex Provider 코드 활성화

### 4.3 main.tsx 검증 활성화

`apps/web/src/main.tsx`:
- Convex URL 검증 주석 해제

## 5. 트러블슈팅

### Clerk 인증 오류

**증상**: "Invalid publishable key" 에러

**해결**:
1. `.env` 파일 확인 (VITE_ 접두사 필수)
2. Clerk Dashboard에서 키 재확인
3. 개발 서버 재시작 (`npm run dev`)

### Convex 연결 오류

**증상**: "Failed to connect to Convex" 에러

**해결**:
1. `npx convex dev`가 실행 중인지 확인
2. VITE_CONVEX_URL 환경변수 확인
3. 네트워크 방화벽 확인

### JWT 검증 오류

**증상**: "Invalid JWT token" 에러

**해결**:
1. Clerk JWT Template의 Issuer URL 확인
2. `convex/.env`의 CLERK_JWT_ISSUER_DOMAIN 일치 확인
3. Template의 Claims에 `"aud": "convex"` 포함 확인

## 6. 참고 문서

- [Convex Quickstart](https://docs.convex.dev/quickstart)
- [Convex + Clerk 공식 문서](https://docs.convex.dev/auth/clerk)
- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)
