# 🚀 Railway 배포 가이드

> **Travel Planner - Phase 7: Railway 배포**
>
> Railway를 사용한 프론트엔드 배포 전체 과정

---

## 📋 목차

1. [사전 준비](#사전-준비)
2. [Railway 프로젝트 설정](#railway-프로젝트-설정)
3. [환경변수 설정](#환경변수-설정)
4. [배포 실행](#배포-실행)
5. [도메인 설정](#도메인-설정)
6. [CI/CD 설정](#cicd-설정)
7. [모니터링](#모니터링)
8. [트러블슈팅](#트러블슈팅)

---

## 사전 준비

### 1. 필수 계정

다음 서비스 계정이 모두 준비되어 있어야 합니다:

- ✅ [Railway](https://railway.app) - 프론트엔드 호스팅
- ✅ [Convex](https://convex.dev) - 백엔드 (프로덕션 배포 완료)
- ✅ [Clerk](https://clerk.com) - 인증 (프로덕션 앱 설정)
- ✅ [Google Cloud](https://console.cloud.google.com) - Maps API
- ✅ [PostHog](https://posthog.com) - 분석
- ✅ [Axiom](https://axiom.co) - 로깅

### 2. 로컬 빌드 테스트

배포 전 로컬에서 프로덕션 빌드가 정상 작동하는지 확인:

```bash
# 프로젝트 루트에서
cd apps/web

# 프로덕션 빌드
pnpm run build

# 빌드 결과 미리보기
pnpm run preview
```

**확인 사항**:
- ✅ 빌드 에러 없음
- ✅ `http://localhost:3001` 접속 가능
- ✅ 로그인/로그아웃 정상 작동
- ✅ Google Maps 로딩 정상
- ✅ API 호출 정상 (Convex)

---

## Railway 프로젝트 설정

### 1. Railway 계정 생성 및 로그인

1. [Railway](https://railway.app) 접속
2. **Sign up with GitHub** 클릭
3. GitHub 계정 연동 및 권한 승인

### 2. 새 프로젝트 생성

#### 방법 A: GitHub Repository에서 배포 (권장)

1. Railway 대시보드에서 **New Project** 클릭
2. **Deploy from GitHub repo** 선택
3. Repository 선택: `travel-planner`
4. **Add variables** 클릭 → 나중에 설정 (환경변수 섹션 참고)
5. **Deploy** 클릭

#### 방법 B: CLI로 배포

```bash
# Railway CLI 설치 (선택)
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
cd apps/web
railway init

# 링크 설정
railway link
```

### 3. Root Directory 설정

Railway는 기본적으로 저장소 루트를 빌드 디렉토리로 사용합니다. 모노레포 구조이므로 설정 변경 필요:

1. Railway 프로젝트 → **Settings** 탭
2. **Service Settings** → **Root Directory**
3. 값: `apps/web` 입력
4. **Save** 클릭

### 4. Build Command 확인

`apps/web/railway.toml` 파일이 자동으로 인식됩니다:

```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm run build"

[deploy]
startCommand = "pnpm run preview -- --port $PORT --host 0.0.0.0"
```

**확인**:
- Railway 대시보드 → **Deployments** → 최신 배포 클릭
- Build Logs에서 `pnpm install && pnpm run build` 실행 확인

---

## 환경변수 설정

### 1. 환경변수 추가

Railway 대시보드 → **Variables** 탭:

| 변수명 | 값 | 비고 |
|--------|-----|------|
| `VITE_CONVEX_URL` | `https://your-project.convex.cloud` | Convex 프로덕션 URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_xxxxx` | Clerk Production 키 |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyxxxxx` | Google Maps API 키 |
| `VITE_POSTHOG_KEY` | `phc_xxxxx` | PostHog API 키 |
| `VITE_AXIOM_TOKEN` | `xapt_xxxxx` | Axiom Ingest 토큰 |
| `VITE_AXIOM_DATASET` | `travel-planner-production` | Axiom 데이터셋 이름 |

**상세 설정 방법**: [Railway 환경변수 체크리스트](./RAILWAY_ENV_VARS_CHECKLIST.md) 참고

### 2. 환경변수 검증

환경변수 추가 후:

1. Railway 대시보드 → **Deployments** 탭
2. **Trigger Redeploy** 클릭 (환경변수 반영)
3. 배포 완료 후 **View Logs** 클릭
4. 에러 메시지 확인:
   - ❌ `VITE_CONVEX_URL is not defined` → 환경변수 확인
   - ✅ `✓ built in XXXs` → 빌드 성공

---

## 배포 실행

### 1. 자동 배포 (GitHub Push)

Railway는 GitHub 연동 시 자동 배포됩니다:

```bash
# 변경사항 커밋
git add .
git commit -m "feat: Add Railway deployment configuration"
git push origin migration/convex
```

**배포 프로세스**:
1. GitHub Push 감지
2. Railway 자동 빌드 시작
3. 빌드 완료 후 자동 배포
4. Health Check 성공 시 트래픽 전환

### 2. 수동 배포

Railway 대시보드에서:

1. **Deployments** 탭
2. **Trigger Redeploy** 버튼 클릭
3. 빌드 로그 확인

### 3. 배포 상태 확인

배포 완료 후:

1. Railway 대시보드 → **Deployments** 탭
2. 최신 배포 상태 확인:
   - ✅ **Success** (녹색): 배포 성공
   - ❌ **Failed** (빨간색): 배포 실패 → 로그 확인
   - 🟡 **Building** (노란색): 빌드 중

---

## 도메인 설정

### 1. Railway 제공 도메인

Railway는 자동으로 `*.railway.app` 도메인을 제공합니다:

1. Railway 대시보드 → **Settings** 탭
2. **Networking** → **Generate Domain** 클릭
3. 생성된 도메인 확인: `your-app-name.railway.app`

### 2. 커스텀 도메인 연결 (선택)

#### 준비물
- 소유한 도메인 (예: `travelplanner.com`)

#### 설정 방법

1. **Railway에서 도메인 추가**:
   - Settings → Networking → Custom Domains
   - **Add Custom Domain** 클릭
   - 도메인 입력: `travelplanner.com` 또는 `app.travelplanner.com`
   - Railway가 제공하는 CNAME 레코드 복사

2. **DNS 설정** (도메인 등록 업체):
   - DNS 관리 페이지 접속
   - CNAME 레코드 추가:
     - Name: `@` (root) 또는 `app` (subdomain)
     - Value: Railway에서 제공한 CNAME 값
   - TTL: 300 (5분)

3. **SSL 인증서 자동 발급**:
   - Railway가 Let's Encrypt를 통해 자동 발급
   - DNS 전파 후 5-10분 소요

4. **도메인 연결 확인**:
   - `https://your-domain.com` 접속
   - SSL 인증서 유효성 확인 (자물쇠 아이콘)

### 3. Clerk 도메인 업데이트

커스텀 도메인 사용 시 Clerk 설정 업데이트 필요:

1. [Clerk Dashboard](https://dashboard.clerk.com) 로그인
2. 프로젝트 선택 → **Paths** 메뉴
3. **Authorized redirect URLs** 추가:
   - `https://your-domain.com/*`
   - `https://your-domain.com/oauth-callback`
4. **Save** 클릭

### 4. Google Maps API 도메인 업데이트

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. APIs & Services → Credentials
3. API 키 선택 → Edit
4. Application restrictions → HTTP referrers:
   - 추가: `https://your-domain.com/*`
5. **Save** 클릭

---

## CI/CD 설정

Railway는 GitHub 연동 시 자동 CI/CD를 제공합니다.

### 1. 자동 배포 설정

Railway 대시보드 → **Settings** → **Service**:

- **Source**: GitHub Repository 연결 확인
- **Branch**: `migration/convex` (또는 `main`)
- **Auto Deploy**: ✅ 활성화 (기본값)

**동작 방식**:
- 지정된 브랜치에 Push → 자동 빌드 및 배포
- Pull Request 생성 → Preview Deployment 자동 생성

### 2. Preview Deployments

Pull Request마다 별도 환경 생성:

1. GitHub에서 PR 생성
2. Railway가 자동으로 Preview 환경 생성
3. PR 코멘트에 Preview URL 추가
4. PR 병합 또는 닫기 시 자동 삭제

**활성화 방법**:
- Railway 대시보드 → **Settings** → **Service**
- **PR Deploys**: ✅ 활성화

### 3. 배포 알림 (선택)

Slack 또는 Discord 알림 설정:

1. Railway 대시보드 → **Settings** → **Integrations**
2. Slack 또는 Discord 선택
3. Webhook URL 입력
4. **Save** 클릭

---

## 모니터링

### 1. Railway 빌드 로그

배포 중 에러 확인:

1. Railway 대시보드 → **Deployments** 탭
2. 최신 배포 클릭 → **View Logs**
3. 빌드 로그 및 런타임 로그 확인

### 2. PostHog 분석

사용자 행동 추적:

1. [PostHog Dashboard](https://app.posthog.com/) 로그인
2. Events → 실시간 이벤트 확인
3. Insights → 사용자 통계 분석

### 3. Axiom 로그

서버 및 클라이언트 로그:

1. [Axiom Dashboard](https://app.axiom.co/) 로그인
2. Datasets → `travel-planner-production` 선택
3. 로그 스트림 및 쿼리

### 4. Railway 메트릭

리소스 사용량 확인:

1. Railway 대시보드 → **Metrics** 탭
2. CPU, 메모리, 네트워크 사용량 확인
3. 무료 티어 크레딧 잔액 확인 ($5/월)

---

## 트러블슈팅

### 1. 빌드 실패

**증상**: Railway 배포가 `Failed` 상태

**원인 및 해결**:

#### A. 패키지 설치 실패
```
pnpm install failed
```
**해결**:
- `package.json` 확인
- 의존성 버전 충돌 확인
- `pnpm-lock.yaml` 커밋 확인

#### B. TypeScript 컴파일 에러
```
tsc --build failed
```
**해결**:
- 로컬에서 `pnpm run typecheck` 실행
- TypeScript 에러 수정 후 재배포

#### C. Vite 빌드 에러
```
vite build failed
```
**해결**:
- 로컬에서 `pnpm run build` 실행
- 에러 메시지 확인 및 수정

### 2. 런타임 에러

**증상**: 배포 성공했지만 앱이 작동하지 않음

#### A. 환경변수 미설정
**증상**: 화면이 비어있거나 "undefined" 에러

**해결**:
1. Railway 대시보드 → Variables 탭
2. 필수 환경변수 모두 설정되었는지 확인
3. 변경 후 **Redeploy** 필수

#### B. Convex 연결 실패
**증상**: `Failed to connect to Convex` 에러

**해결**:
1. `VITE_CONVEX_URL` 정확한지 확인
2. Convex Dashboard에서 프로덕션 배포 확인
3. CORS 설정 확인 (Convex는 자동 처리)

#### C. Clerk 인증 실패
**증상**: 로그인 시 리다이렉트 에러

**해결**:
1. Clerk Dashboard → Paths → Authorized redirect URLs
2. Railway 도메인 추가:
   - `https://your-app.railway.app/*`
   - `https://your-app.railway.app/oauth-callback`
3. Production Publishable Key 사용 확인 (`pk_live_`)

### 3. Google Maps 로딩 실패

**증상**: 지도가 표시되지 않거나 "This page can't load Google Maps correctly" 에러

**해결**:
1. Google Cloud Console → APIs & Services
2. 다음 API 활성화 확인:
   - Maps JavaScript API ✅
   - Places API ✅
   - Geocoding API ✅
3. API 키 제한 확인:
   - HTTP referrers에 Railway 도메인 추가
   - `https://*.railway.app/*`
4. Billing 계정 활성화 (무료 크레딧 $300)

### 4. 성능 문제

**증상**: 페이지 로딩이 느림

**해결**:

#### A. 번들 크기 최적화
```bash
# 번들 분석
cd apps/web
pnpm run build -- --mode analyze
```

**최적화 방법**:
- Code splitting 확인 (`vite.config.ts`의 `manualChunks`)
- 큰 라이브러리 lazy loading
- 이미지 최적화 (압축, WebP 포맷)

#### B. Vite Preview 서버 성능
**대안**: 정적 파일 서버로 교체

```bash
# sirv 설치
pnpm add -D sirv-cli

# package.json 수정
{
  "scripts": {
    "preview": "sirv dist --port $PORT --host 0.0.0.0 --single"
  }
}

# railway.toml 수정
[deploy]
startCommand = "pnpm run preview"
```

### 5. 무료 티어 크레딧 초과

**증상**: Railway에서 서비스 중단 알림

**해결**:
1. Railway 대시보드 → **Usage** 탭
2. 사용량 확인:
   - 실행 시간: 500시간/월 제한
   - 트래픽: 100GB/월 제한
3. 최적화 방안:
   - 개발 환경은 로컬에서 실행
   - Preview Deployments 수동 삭제
   - 유료 플랜 업그레이드 ($5-$20/월)

---

## 📚 참고 자료

### Railway
- [공식 문서](https://docs.railway.app)
- [Deployment 가이드](https://docs.railway.app/deploy/deployments)
- [환경변수 설정](https://docs.railway.app/develop/variables)
- [커스텀 도메인](https://docs.railway.app/deploy/exposing-your-app)

### Convex
- [프로덕션 배포](https://docs.convex.dev/production/hosting)
- [환경변수](https://docs.convex.dev/production/environment-variables)

### Clerk
- [프로덕션 체크리스트](https://clerk.com/docs/deployments/production-checklist)
- [도메인 설정](https://clerk.com/docs/deployments/custom-domains)

### Vite
- [프로덕션 빌드](https://vitejs.dev/guide/build.html)
- [환경변수](https://vitejs.dev/guide/env-and-mode.html)
- [최적화](https://vitejs.dev/guide/performance.html)

---

## ✅ 배포 완료 체크리스트

### 배포 전
- [ ] 로컬 빌드 테스트 완료
- [ ] Convex 프로덕션 배포 완료
- [ ] Clerk 프로덕션 앱 설정 완료
- [ ] Google Maps API 키 발급 및 제한 설정
- [ ] PostHog 프로젝트 생성
- [ ] Axiom 데이터셋 생성

### Railway 설정
- [ ] Railway 프로젝트 생성
- [ ] GitHub Repository 연결
- [ ] Root Directory: `apps/web` 설정
- [ ] 환경변수 6개 모두 설정
- [ ] 자동 배포 활성화

### 배포 후 검증
- [ ] Railway URL 접속 성공
- [ ] 로그인/로그아웃 정상
- [ ] Google Maps 로딩 정상
- [ ] 장소 추가/수정/삭제 정상
- [ ] PostHog 이벤트 수신 확인
- [ ] Axiom 로그 수신 확인

### 도메인 설정 (선택)
- [ ] 커스텀 도메인 연결
- [ ] SSL 인증서 발급 확인
- [ ] Clerk 도메인 업데이트
- [ ] Google Maps API 도메인 업데이트

### CI/CD
- [ ] 자동 배포 동작 확인 (GitHub Push)
- [ ] Preview Deployments 활성화
- [ ] 배포 알림 설정 (선택)

---

**작성일**: 2025-01-19
**작성자**: PM Agent
**Phase**: 7 (Railway 배포)
**버전**: 1.0
