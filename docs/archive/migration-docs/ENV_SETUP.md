# 환경 변수 설정 가이드

Travel Planner 프로젝트의 환경 변수 설정 가이드입니다.

## 환경 변수 파일 위치

```
travel-planner/
├── .env.local              # 프로젝트 루트 환경 변수 (Convex 백엔드용)
└── apps/web/.env.local     # Frontend 환경 변수
```

## 1. 프로젝트 루트 환경 변수 (.env.local)

Convex 백엔드에서 사용하는 환경 변수입니다.

```bash
# Google Maps API Key (필수)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# AxiomFM 로깅 (선택)
AXIOM_TOKEN=your_axiom_token_here
AXIOM_DATASET=travel-planner-logs
```

### 설정 방법

```bash
# 1. .env.example 복사
cp .env.example .env.local

# 2. .env.local 편집하여 실제 값으로 변경
vim .env.local

# 3. Convex 환경 변수 설정 (또는 Convex 대시보드에서 설정)
npx convex env set GOOGLE_MAPS_API_KEY your_google_maps_api_key_here
npx convex env set AXIOM_TOKEN your_axiom_token_here
npx convex env set AXIOM_DATASET travel-planner-logs
```

## 2. Frontend 환경 변수 (apps/web/.env.local)

React 애플리케이션에서 사용하는 환경 변수입니다.

```bash
# Convex 배포 URL (필수)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Publishable Key (필수)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Google Maps API Key (필수)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# PostHog Analytics (선택)
VITE_POSTHOG_KEY=phc_your_posthog_key_here
VITE_POSTHOG_HOST=https://app.posthog.com

# AxiomFM Logging (선택)
VITE_AXIOM_TOKEN=your_axiom_token_here
VITE_AXIOM_DATASET=travel-planner-logs

# Resend Email (선택)
VITE_RESEND_API_KEY=re_your_resend_key_here
```

### 설정 방법

```bash
# 1. apps/web/.env.example 복사
cd apps/web
cp .env.example .env.local

# 2. .env.local 편집
vim .env.local
```

## 3. 각 서비스별 API Key 발급 방법

### 3.1 Convex

**VITE_CONVEX_URL**

1. Convex 개발 서버 실행:
   ```bash
   npx convex dev
   ```

2. 브라우저에서 Convex 계정 로그인

3. 프로젝트 생성 후 개발 환경 URL 자동 생성

4. 터미널에 출력된 URL을 복사하여 `VITE_CONVEX_URL`에 설정

**프로덕션 배포:**
```bash
npx convex deploy
```

### 3.2 Clerk

**VITE_CLERK_PUBLISHABLE_KEY**

1. [Clerk Dashboard](https://dashboard.clerk.com) 접속

2. 새 애플리케이션 생성:
   - Application name: `travel-planner`
   - Sign-in options: Email, Google OAuth 선택

3. API Keys 페이지에서 **Publishable key** 복사

4. `VITE_CLERK_PUBLISHABLE_KEY`에 설정

**Google OAuth 설정:**
1. Clerk Dashboard → Social Connections
2. Google 활성화
3. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
4. Clerk에 Client ID와 Client Secret 입력

### 3.3 Google Maps API

**GOOGLE_MAPS_API_KEY, VITE_GOOGLE_MAPS_API_KEY**

1. [Google Cloud Console](https://console.cloud.google.com) 접속

2. 새 프로젝트 생성 또는 기존 프로젝트 선택

3. API & Services → Library에서 다음 API 활성화:
   - Maps JavaScript API
   - Places API
   - Geocoding API

4. Credentials → Create Credentials → API Key

5. API Key 생성 후 제한 설정:
   - Application restrictions: HTTP referrers (websites)
   - Website restrictions: `http://localhost:*`, `https://yourdomain.com/*`
   - API restrictions: Maps JavaScript API, Places API, Geocoding API만 허용

6. 생성된 API Key를 `GOOGLE_MAPS_API_KEY`와 `VITE_GOOGLE_MAPS_API_KEY`에 모두 설정

**요금 정보:**
- Maps JavaScript API: 월 28,000회 로딩까지 무료
- Places API: 월 $200 크레딧 (약 40,000회 검색)

### 3.4 PostHog (선택)

**VITE_POSTHOG_KEY**

1. [PostHog](https://app.posthog.com) 가입

2. 새 프로젝트 생성

3. Project Settings → Project API Key 복사

4. `VITE_POSTHOG_KEY`에 설정

**무료 티어:**
- 월 1M 이벤트까지 무료

### 3.5 AxiomFM (선택)

**AXIOM_TOKEN, VITE_AXIOM_TOKEN**

1. [AxiomFM](https://axiom.co) 가입

2. 새 데이터셋 생성:
   - Dataset name: `travel-planner-logs`

3. Settings → API Tokens → Create Token

4. 생성된 토큰을 `AXIOM_TOKEN`과 `VITE_AXIOM_TOKEN`에 설정

5. Dataset 이름을 `AXIOM_DATASET`에 설정

**무료 티어:**
- 월 0.5GB 로그까지 무료

### 3.6 Resend (선택)

**VITE_RESEND_API_KEY**

1. [Resend](https://resend.com) 가입

2. API Keys → Create API Key

3. 생성된 API Key를 `VITE_RESEND_API_KEY`에 설정

**무료 티어:**
- 월 3,000 이메일까지 무료

## 4. 환경별 설정

### 개발 환경 (Local)

```bash
# .env.local
VITE_CONVEX_URL=https://dev-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

### 프로덕션 환경 (Railway)

Railway 대시보드에서 환경 변수 설정:

1. Railway 프로젝트 → Settings → Variables

2. 다음 환경 변수 추가:
   ```
   VITE_CONVEX_URL=https://prod-deployment.convex.cloud
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_POSTHOG_KEY=phc_your_posthog_key
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```

3. Redeploy 버튼 클릭

## 5. 환경 변수 검증

### 5.1 Convex 백엔드 검증

```bash
# Convex 환경 변수 확인
npx convex env list
```

### 5.2 Frontend 검증

```typescript
// apps/web/src/lib/env.ts
export function validateEnv() {
  const requiredEnvs = [
    'VITE_CONVEX_URL',
    'VITE_CLERK_PUBLISHABLE_KEY',
    'VITE_GOOGLE_MAPS_API_KEY',
  ];

  const missing = requiredEnvs.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  console.log('✅ All required environment variables are set');
}
```

사용 방법:
```typescript
// apps/web/src/main.tsx
import { validateEnv } from './lib/env';

validateEnv();
```

## 6. 보안 주의사항

### ❌ 절대 커밋하지 말 것

```bash
# .gitignore에 포함되어 있는지 확인
.env.local
.env*.local
apps/web/.env.local
```

### ✅ 안전한 관리 방법

1. **개발 환경:**
   - `.env.local` 파일을 로컬에서만 관리
   - 팀원에게는 `.env.example`과 설정 가이드 공유

2. **프로덕션 환경:**
   - Railway, Convex 대시보드에서 환경 변수 관리
   - 절대 코드에 하드코딩하지 말 것

3. **API Key 보호:**
   - Google Maps API Key는 HTTP Referrer 제한 설정
   - Clerk, PostHog는 자동으로 도메인 제한
   - 정기적으로 API Key 로테이션

## 7. 문제 해결

### 7.1 VITE_CONVEX_URL이 undefined

**원인:** Convex 개발 서버가 실행되지 않음

**해결:**
```bash
npx convex dev
```

### 7.2 Clerk 인증 실패

**원인:** VITE_CLERK_PUBLISHABLE_KEY가 잘못됨

**해결:**
1. Clerk Dashboard → API Keys 확인
2. Publishable key (pk_test_xxx 또는 pk_live_xxx) 재확인
3. Secret key (sk_xxx)가 아닌지 확인

### 7.3 Google Maps API 오류

**원인:** API Key 제한 설정 또는 API 미활성화

**해결:**
1. Google Cloud Console → APIs & Services → Enabled APIs 확인
2. Credentials → API Key → Edit → Application restrictions 확인

---

**작성일:** 2025-01-18
**문서 버전:** 1.0
