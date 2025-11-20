# 🔐 환경변수 설정 가이드

> **마이그레이션 대상**: NestJS + SQLite/D1 → Convex + Clerk + Railway

이 문서는 Travel Planner 마이그레이션에 필요한 모든 환경변수를 정리합니다.

---

## 📋 필수 환경변수 목록

### 1. Convex (서버리스 백엔드)

**필요한 값:**
- `VITE_CONVEX_URL` - Convex 배포 URL
- `CONVEX_DEPLOYMENT` - Convex 배포 이름 (자동 생성됨)

**발급 방법:**
1. https://convex.dev 접속 → 회원가입/로그인
2. "Create a project" 클릭
3. 프로젝트 이름: `travel-planner`
4. 프로젝트 생성 후 대시보드에서 확인:
   - **Deployment URL**: `https://[your-deployment].convex.cloud`
   - **Deployment Name**: `[auto-generated]`

**설정 위치:**
```bash
# apps/web/.env
VITE_CONVEX_URL=https://[your-deployment].convex.cloud

# convex/.env (자동 생성, 직접 설정 불필요)
CONVEX_DEPLOYMENT=[auto-generated]
```

---

### 2. Clerk (인증 시스템)

**필요한 값:**
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk 퍼블릭 키 (프론트엔드용)
- `CLERK_SECRET_KEY` - Clerk 시크릿 키 (Convex 서버용)

**발급 방법:**
1. https://clerk.com 접속 → 회원가입/로그인
2. "Create application" 클릭
3. 애플리케이션 이름: `Travel Planner`
4. 인증 방법 선택:
   - ✅ **Email** (기본)
   - ✅ **Google** (OAuth)
5. 생성 후 API Keys 페이지에서 확인:
   - **Publishable key**: `pk_test_...` 또는 `pk_live_...`
   - **Secret key**: `sk_test_...` 또는 `sk_live_...`

**Google OAuth 추가 설정:**
1. Clerk 대시보드 → "Social Connections"
2. Google 활성화
3. Google Cloud Console에서 OAuth 클라이언트 ID 생성:
   - https://console.cloud.google.com/apis/credentials
   - "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://[your-clerk-domain].clerk.accounts.dev/v1/oauth_callback
     ```
4. Client ID와 Client Secret을 Clerk에 입력

**설정 위치:**
```bash
# apps/web/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# convex/.env
CLERK_SECRET_KEY=sk_test_...
```

---

### 3. Google Maps API (장소 검색)

**필요한 값:**
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps JavaScript API 키
- `GOOGLE_MAPS_API_KEY` - Google Places API 키 (Convex 서버용)

**발급 방법:**
1. https://console.cloud.google.com/apis 접속
2. 프로젝트 생성: `travel-planner`
3. API 활성화:
   - **Maps JavaScript API** (지도 표시)
   - **Places API** (장소 검색)
   - **Geocoding API** (주소 ↔ 좌표 변환)
4. "Credentials" → "Create Credentials" → "API key"
5. API 키 제한 설정 (보안):
   - **Application restrictions**:
     - HTTP referrers: `http://localhost:*`, `https://yourdomain.com/*`
   - **API restrictions**:
     - Restrict key → Select APIs: Maps JavaScript API, Places API, Geocoding API

**설정 위치:**
```bash
# apps/web/.env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# convex/.env
GOOGLE_MAPS_API_KEY=AIzaSy...
```

**참고:** 동일한 API 키 사용 가능 (제한 설정만 적절히 구성)

---

### 4. PostHog (사용자 분석)

**필요한 값:**
- `VITE_POSTHOG_KEY` - PostHog 프로젝트 API 키
- `VITE_POSTHOG_HOST` - PostHog 호스트 URL (기본: `https://app.posthog.com`)

**발급 방법:**
1. https://posthog.com 접속 → 회원가입/로그인
2. "Create project" 클릭
3. 프로젝트 이름: `Travel Planner`
4. 생성 후 "Project Settings" → "Project API Key" 확인:
   - **Project API Key**: `phc_...`

**설정 위치:**
```bash
# apps/web/.env
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com
```

---

### 5. Axiom (로그 관리)

**필요한 값:**
- `VITE_AXIOM_TOKEN` - Axiom API 토큰
- `VITE_AXIOM_DATASET` - Axiom 데이터셋 이름
- `AXIOM_TOKEN` - Axiom API 토큰 (Convex 서버용)
- `AXIOM_DATASET` - Axiom 데이터셋 이름 (Convex 서버용)

**발급 방법:**
1. https://axiom.co 접속 → 회원가입/로그인
2. "Create dataset" 클릭
3. 데이터셋 이름: `travel-planner-logs`
4. "Settings" → "API Tokens" → "Create token"
5. Token name: `travel-planner-token`
6. Permissions: **Ingest** (로그 전송용)

**설정 위치:**
```bash
# apps/web/.env
VITE_AXIOM_TOKEN=xaat-...
VITE_AXIOM_DATASET=travel-planner-logs

# convex/.env
AXIOM_TOKEN=xaat-...
AXIOM_DATASET=travel-planner-logs
```

---

### 6. Resend (이메일 전송) - 기존 유지

**필요한 값:**
- `RESEND_API_KEY` - Resend API 키 (Convex 서버용)

**발급 방법:**
1. https://resend.com 접속 → 로그인 (기존 계정)
2. "API Keys" → "Create API Key"
3. Name: `travel-planner-convex`
4. Permission: **Full Access** (또는 **Sending Access**)

**설정 위치:**
```bash
# convex/.env
RESEND_API_KEY=re_...
```

---

### 7. Railway (배포) - 나중에 설정

**필요한 값:**
- Railway는 별도 환경변수 설정 불필요
- Railway 대시보드에서 직접 설정

**설정 시점:**
- Phase 7: Railway 배포 단계에서 진행

---

## 📁 환경변수 파일 구조

```
travel-planner/
├── apps/web/.env              # 프론트엔드 환경변수
│   ├── VITE_CONVEX_URL
│   ├── VITE_CLERK_PUBLISHABLE_KEY
│   ├── VITE_GOOGLE_MAPS_API_KEY
│   ├── VITE_POSTHOG_KEY
│   ├── VITE_POSTHOG_HOST
│   ├── VITE_AXIOM_TOKEN
│   └── VITE_AXIOM_DATASET
│
└── convex/.env                # 백엔드 환경변수
    ├── CONVEX_DEPLOYMENT      # (자동 생성)
    ├── CLERK_SECRET_KEY
    ├── GOOGLE_MAPS_API_KEY
    ├── AXIOM_TOKEN
    ├── AXIOM_DATASET
    └── RESEND_API_KEY
```

---

## 🚀 환경변수 설정 순서

### 1단계: 계정 생성 및 프로젝트 초기화
```bash
# 필수 서비스 계정 생성
1. Convex (https://convex.dev)
2. Clerk (https://clerk.com)
3. PostHog (https://posthog.com)
4. Axiom (https://axiom.co)

# 기존 서비스 확인
5. Google Cloud Console (기존)
6. Resend (기존)
```

### 2단계: API 키 발급
위 섹션별 "발급 방법" 참고

### 3단계: 환경변수 파일 생성
```bash
# 프론트엔드
cp apps/web/.env.example apps/web/.env
# apps/web/.env 파일 편집

# 백엔드 (Convex 초기화 후 자동 생성됨)
# convex/.env 파일 편집
```

### 4단계: 검증
```bash
# 프론트엔드 개발 서버
cd apps/web
pnpm dev

# Convex 개발 서버
npx convex dev
```

---

## 🔒 보안 주의사항

### Git에 절대 커밋하지 말 것
```bash
# .gitignore에 이미 포함됨
apps/web/.env
convex/.env
.env
.env.local
```

### API 키 보안 등급
| 서비스 | 키 타입 | 노출 허용 | 비고 |
|--------|---------|----------|------|
| Convex | `VITE_CONVEX_URL` | ✅ Public | 프론트엔드 |
| Clerk | `VITE_CLERK_PUBLISHABLE_KEY` | ✅ Public | 프론트엔드 |
| Clerk | `CLERK_SECRET_KEY` | ❌ Secret | 서버 전용 |
| Google Maps | `VITE_GOOGLE_MAPS_API_KEY` | ⚠️ Restricted | HTTP Referrer 제한 필수 |
| PostHog | `VITE_POSTHOG_KEY` | ✅ Public | 프론트엔드 |
| Axiom | `VITE_AXIOM_TOKEN` | ⚠️ Ingest Only | 권한 제한 |
| Axiom | `AXIOM_TOKEN` | ❌ Secret | 서버 전용 |
| Resend | `RESEND_API_KEY` | ❌ Secret | 서버 전용 |

### API 키 제한 설정 권장사항
1. **Google Maps API**: HTTP Referrer 제한 + API 선택 제한
2. **Clerk**: 도메인 화이트리스트 설정 (Clerk 대시보드)
3. **Axiom**: Ingest-only 권한 토큰 사용 (프론트엔드용)
4. **PostHog**: 도메인 필터링 (PostHog 대시보드)

---

## 📝 체크리스트

### Phase 1: 환경 준비
- [ ] Convex 계정 생성 및 프로젝트 생성
- [ ] Clerk 앱 생성 및 Google OAuth 설정
- [ ] Google Maps API 키 발급 및 제한 설정
- [ ] PostHog 프로젝트 생성
- [ ] Axiom 데이터셋 생성 및 토큰 발급
- [ ] Resend API 키 발급 (기존 또는 신규)

### Phase 1.5: 환경변수 설정
- [ ] `apps/web/.env` 파일 생성 및 값 입력
- [ ] `convex/.env` 파일 생성 및 값 입력 (Convex 초기화 후)
- [ ] 환경변수 누락 확인 (개발 서버 실행 테스트)

### Phase 2+: 구현 시작
- [ ] Convex 초기화 완료
- [ ] Clerk 통합 테스트
- [ ] Google Maps 로드 테스트
- [ ] PostHog 이벤트 전송 테스트
- [ ] Axiom 로그 전송 테스트

---

## 🆘 트러블슈팅

### Convex 연결 실패
```
Error: Failed to fetch from Convex
```
**해결책:**
- `VITE_CONVEX_URL`이 정확한지 확인
- Convex 대시보드에서 배포 상태 확인
- `npx convex dev` 실행 여부 확인

### Clerk 인증 실패
```
Error: Clerk publishable key not found
```
**해결책:**
- `VITE_CLERK_PUBLISHABLE_KEY`가 `pk_test_` 또는 `pk_live_`로 시작하는지 확인
- Clerk 대시보드에서 키 재확인
- `.env` 파일 위치 확인 (`apps/web/.env`)

### Google Maps 로드 실패
```
Error: Google Maps JavaScript API error: InvalidKeyMapError
```
**해결책:**
- API 키가 활성화되었는지 확인
- Maps JavaScript API가 활성화되었는지 확인
- HTTP Referrer 제한이 `localhost`를 포함하는지 확인

### PostHog 이벤트 전송 실패
```
Error: PostHog capture failed
```
**해결책:**
- `VITE_POSTHOG_KEY`가 `phc_`로 시작하는지 확인
- PostHog 프로젝트가 활성화되었는지 확인
- 브라우저 Ad Blocker 비활성화 (개발 중)

---

## 📚 참고 자료

- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)
- [Clerk API Keys](https://clerk.com/docs/deployments/api-keys)
- [Google Maps API Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [PostHog Project API Key](https://posthog.com/docs/api/overview)
- [Axiom Ingest API](https://axiom.co/docs/send-data/ingest)

---

**작성일:** 2025-01-18
**작성자:** PM Agent
**문서 버전:** 1.0
