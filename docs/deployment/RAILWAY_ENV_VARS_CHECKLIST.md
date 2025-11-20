# Railway 환경변수 설정 체크리스트

> **Phase 7: Railway 배포**
>
> Railway 대시보드에서 설정해야 하는 환경변수 목록

---

## ✅ 필수 환경변수

### 1. Convex (Backend)
- **변수명**: `VITE_CONVEX_URL`
- **설명**: Convex 프로덕션 배포 URL
- **획득 방법**:
  ```bash
  npx convex deploy
  # 배포 완료 후 출력되는 URL 복사
  ```
- **예시**: `https://your-project.convex.cloud`
- **Railway 설정**:
  1. Railway 대시보드 → 프로젝트 선택
  2. Variables 탭
  3. `VITE_CONVEX_URL` 추가
  4. 값: Convex URL 붙여넣기

---

### 2. Clerk (Authentication)
- **변수명**: `VITE_CLERK_PUBLISHABLE_KEY`
- **설명**: Clerk 퍼블릭 키 (프로덕션 환경)
- **획득 방법**:
  1. [Clerk Dashboard](https://dashboard.clerk.com) 로그인
  2. 프로젝트 선택
  3. API Keys → Show API Keys
  4. **Production** 환경의 Publishable key 복사
- **예시**: `pk_live_Y2xlcmsuZXhhbXBsZS5jb20k`
- **주의사항**: ⚠️ `pk_live_`로 시작하는 Production 키 사용 필수
- **Railway 설정**:
  1. Variables 탭
  2. `VITE_CLERK_PUBLISHABLE_KEY` 추가
  3. 값: Clerk Production Publishable key 붙여넣기

---

### 3. Google Maps API
- **변수명**: `VITE_GOOGLE_MAPS_API_KEY`
- **설명**: Google Maps JavaScript API 키
- **획득 방법**:
  1. [Google Cloud Console](https://console.cloud.google.com/) 접속
  2. 프로젝트 선택 또는 생성
  3. APIs & Services → Credentials
  4. Create Credentials → API Key
  5. API 키 생성 후 **Restrict key** 설정
- **보안 설정** (중요):
  - Application restrictions:
    - HTTP referrers (websites)
    - 허용 도메인 추가:
      - `https://your-app.railway.app/*`
      - `https://your-custom-domain.com/*`
  - API restrictions:
    - Restrict key → 다음 API 선택:
      - Maps JavaScript API
      - Places API
      - Geocoding API
- **Railway 설정**:
  1. Variables 탭
  2. `VITE_GOOGLE_MAPS_API_KEY` 추가
  3. 값: Google Maps API 키 붙여넣기

---

### 4. PostHog (Analytics)
- **변수명**: `VITE_POSTHOG_KEY`
- **설명**: PostHog 프로젝트 API 키
- **획득 방법**:
  1. [PostHog Cloud](https://app.posthog.com/) 로그인
  2. 프로젝트 선택
  3. Settings → Project → Project API Key 복사
- **예시**: `phc_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Railway 설정**:
  1. Variables 탭
  2. `VITE_POSTHOG_KEY` 추가
  3. 값: PostHog API 키 붙여넣기

---

### 5. Axiom (Logging)

#### 5.1 Axiom API Token
- **변수명**: `VITE_AXIOM_TOKEN`
- **설명**: Axiom Ingest API 토큰
- **획득 방법**:
  1. [Axiom Dashboard](https://app.axiom.co/) 로그인
  2. Settings → API Tokens
  3. Create Token
  4. 권한: `ingest` (데이터 전송만 필요)
  5. 생성된 토큰 복사 (한 번만 표시됨)
- **예시**: `xapt_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Railway 설정**:
  1. Variables 탭
  2. `VITE_AXIOM_TOKEN` 추가
  3. 값: Axiom 토큰 붙여넣기

#### 5.2 Axiom Dataset
- **변수명**: `VITE_AXIOM_DATASET`
- **설명**: Axiom 데이터셋 이름
- **획득 방법**:
  1. Axiom Dashboard → Datasets
  2. Create Dataset
  3. 이름: `travel-planner-production`
  4. 생성된 데이터셋 이름 복사
- **예시**: `travel-planner-production`
- **Railway 설정**:
  1. Variables 탭
  2. `VITE_AXIOM_DATASET` 추가
  3. 값: `travel-planner-production`

---

## 📋 설정 완료 체크리스트

### Railway 대시보드 설정
- [ ] Railway 계정 생성 ([railway.app](https://railway.app))
- [ ] 새 프로젝트 생성
- [ ] GitHub 저장소 연결
- [ ] Root directory 설정: `apps/web`
- [ ] 환경변수 추가:
  - [ ] `VITE_CONVEX_URL`
  - [ ] `VITE_CLERK_PUBLISHABLE_KEY`
  - [ ] `VITE_GOOGLE_MAPS_API_KEY`
  - [ ] `VITE_POSTHOG_KEY`
  - [ ] `VITE_AXIOM_TOKEN`
  - [ ] `VITE_AXIOM_DATASET`

### Convex 배포
- [ ] `npx convex deploy` 실행
- [ ] Production URL 확인 및 복사
- [ ] Clerk JWT 설정 확인:
  ```bash
  # convex/auth.config.ts 배포 확인
  npx convex deploy --prod
  ```

### Clerk 설정
- [ ] Clerk Dashboard에서 프로덕션 앱 생성
- [ ] Google OAuth 설정 (프로덕션 환경)
- [ ] Allowed redirect URLs 추가:
  - `https://your-app.railway.app/oauth-callback`
  - `https://your-custom-domain.com/oauth-callback`
- [ ] JWT Template 설정 (Convex 연동)

### Google Maps API
- [ ] Google Cloud Project 생성
- [ ] Maps JavaScript API 활성화
- [ ] Places API 활성화
- [ ] Geocoding API 활성화
- [ ] API 키 생성
- [ ] API 키 제한 설정 (HTTP referrers)

### PostHog 설정
- [ ] PostHog 프로젝트 생성
- [ ] API 키 복사
- [ ] Allowed domains 설정 (CORS)

### Axiom 설정
- [ ] Axiom 계정 생성
- [ ] 데이터셋 생성: `travel-planner-production`
- [ ] Ingest API 토큰 생성
- [ ] 토큰 안전하게 저장 (Railway에만 사용)

---

## 🔐 보안 체크리스트

- [ ] 모든 API 키는 Railway Variables에만 저장 (코드에 하드코딩 금지)
- [ ] `.env` 파일은 `.gitignore`에 추가됨 확인
- [ ] Google Maps API 키 제한 설정 (도메인 제한)
- [ ] Clerk Production 환경 키 사용 (`pk_live_` 접두사)
- [ ] Axiom 토큰은 `ingest` 권한만 부여
- [ ] PostHog 프로젝트 CORS 설정 확인

---

## 🚀 배포 확인

환경변수 설정 완료 후:

1. **Railway 자동 배포 트리거**:
   ```bash
   git add .
   git commit -m "feat: Add Railway deployment configuration"
   git push origin migration/convex
   ```

2. **배포 로그 확인**:
   - Railway 대시보드 → Deployments 탭
   - 빌드 로그에서 에러 확인

3. **배포 성공 확인**:
   - Railway가 제공하는 URL 접속
   - 로그인 테스트
   - Google Maps 로딩 확인
   - PostHog 이벤트 전송 확인 (PostHog Dashboard)
   - Axiom 로그 수신 확인 (Axiom Dashboard)

---

## ❓ 트러블슈팅

### 1. Convex 연결 실패
**증상**: `VITE_CONVEX_URL is not defined` 에러

**해결**:
- Railway Variables에 `VITE_CONVEX_URL` 추가 확인
- Convex 배포 완료 후 URL 정확히 복사했는지 확인
- Railway 재배포: Settings → Redeploy

### 2. Clerk 인증 실패
**증상**: 로그인 시 리다이렉트 에러

**해결**:
- Clerk Dashboard → Allowed redirect URLs 확인
- Railway 도메인 추가: `https://your-app.railway.app/*`
- Production Publishable key 사용 확인 (`pk_live_`)

### 3. Google Maps 로딩 실패
**증상**: 지도가 표시되지 않음 또는 "This page can't load Google Maps correctly" 에러

**해결**:
- Google Cloud Console → API 활성화 확인:
  - Maps JavaScript API
  - Places API
  - Geocoding API
- API 키 제한 확인:
  - HTTP referrers에 Railway 도메인 추가
- Billing 계정 활성화 (무료 크레딧 사용)

### 4. PostHog 이벤트 미전송
**증상**: PostHog Dashboard에 이벤트가 표시되지 않음

**해결**:
- PostHog API Key 정확한지 확인
- 브라우저 개발자 도구 → Network 탭에서 PostHog 요청 확인
- CORS 에러 → PostHog Project Settings → Authorized URLs 확인

### 5. Axiom 로그 미수신
**증상**: Axiom Dashboard에 로그가 표시되지 않음

**해결**:
- Axiom API Token 권한 확인 (`ingest`)
- 데이터셋 이름 정확한지 확인
- 브라우저 개발자 도구 → Console에서 Axiom 에러 확인

---

## 📚 참고 자료

- [Railway 환경변수 문서](https://docs.railway.app/develop/variables)
- [Convex 배포 가이드](https://docs.convex.dev/production/hosting)
- [Clerk Production Checklist](https://clerk.com/docs/deployments/production-checklist)
- [Google Maps API 제한 설정](https://developers.google.com/maps/api-key-best-practices)
- [PostHog 설정 가이드](https://posthog.com/docs/integrate)
- [Axiom API Tokens](https://axiom.co/docs/restapi/token)

---

**작성일**: 2025-01-19
**작성자**: PM Agent
**Phase**: 7 (Railway 배포)
