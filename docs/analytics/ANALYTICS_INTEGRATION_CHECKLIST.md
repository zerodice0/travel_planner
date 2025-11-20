# PostHog & Axiom 통합 체크리스트

Travel Planner의 PostHog 및 Axiom 통합을 검증하기 위한 체크리스트입니다.

---

## ✅ 1. 패키지 설치

### PostHog

```bash
cd apps/web
pnpm add posthog-js
```

**확인 방법:**
```bash
grep "posthog-js" apps/web/package.json
```

### Axiom

```bash
cd apps/web
pnpm add @axiomhq/js
```

**확인 방법:**
```bash
grep "@axiomhq/js" apps/web/package.json
```

---

## ✅ 2. 환경 변수 설정

### PostHog

1. PostHog 대시보드에서 API 키 발급
   - https://app.posthog.com → Project Settings → API Keys
2. `.env` 파일에 추가:
   ```env
   VITE_POSTHOG_KEY=phc_your_actual_api_key
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```

**확인 방법:**
```bash
cat apps/web/.env | grep POSTHOG
```

### Axiom

1. Axiom 대시보드에서 Dataset 및 API 토큰 생성
   - https://app.axiom.co → Settings → API Tokens
2. `.env` 파일에 추가:
   ```env
   VITE_AXIOM_TOKEN=xaat_your_actual_token
   VITE_AXIOM_DATASET=travel-planner-logs
   ```

**확인 방법:**
```bash
cat apps/web/.env | grep AXIOM
```

---

## ✅ 3. 코드 구현 확인

### 파일 존재 확인

```bash
# PostHog 초기화 및 헬퍼 함수
ls -la apps/web/src/lib/analytics.ts

# Axiom 로거
ls -la apps/web/src/lib/logger.ts

# 타입 정의
ls -la apps/web/src/types/analytics.ts
```

### main.tsx 통합 확인

```bash
# PostHog 초기화 및 전역 에러 핸들링이 포함되어 있는지 확인
grep -E "(initializePostHog|setupGlobalErrorHandling)" apps/web/src/main.tsx
```

**예상 출력:**
```
import { initializePostHog } from '#lib/analytics';
import { setupGlobalErrorHandling } from '#lib/logger';
initializePostHog();
setupGlobalErrorHandling();
```

---

## ✅ 4. 타입 검사

```bash
cd apps/web
pnpm typecheck
```

**예상 결과:**
- ✅ 타입 에러 없음
- ❌ 에러가 있으면 수정 필요

---

## ✅ 5. 개발 서버 실행 테스트

### 서버 시작

```bash
cd apps/web
pnpm dev
```

### 브라우저 콘솔 확인

개발자 도구(F12) → Console 탭에서 다음 메시지 확인:

**PostHog 초기화 성공:**
```
[Analytics] PostHog loaded in development mode (opt-out)
[Analytics] PostHog initialized successfully
```

**Axiom 초기화 (환경 변수가 없으면 경고):**
```
[Logger] Axiom credentials not found. Logging to console only.
```
또는
```
[Logger] Axiom initialized successfully
```

**전역 에러 핸들링 설정:**
```
[Logger] Global error handling enabled
```

---

## ✅ 6. 이벤트 트래킹 테스트

### 테스트 컴포넌트 생성 (임시)

```typescript
// apps/web/src/components/AnalyticsTest.tsx
import { trackEvent, placeEvents } from '#lib/analytics';
import { logger } from '#lib/logger';

export const AnalyticsTest = () => {
  const testPostHog = () => {
    trackEvent('test_event', { test: true });
    placeEvents.added({ category: 'restaurant', source: 'manual' });
    console.log('PostHog events sent');
  };

  const testAxiom = () => {
    logger.info('Test info log', { test: true });
    logger.warn('Test warning log');
    logger.error('Test error log', new Error('Test error'));
    console.log('Axiom logs sent');
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={testPostHog}>Test PostHog</button>
      <button onClick={testAxiom}>Test Axiom</button>
    </div>
  );
};
```

### PostHog Live Events 확인

1. https://app.posthog.com → Live Events
2. 버튼 클릭 후 이벤트 수신 확인:
   - `test_event`
   - `place_added`

### Axiom Stream 확인

1. https://app.axiom.co → Stream
2. 버튼 클릭 후 로그 수신 확인:
   - `level: info`, `message: Test info log`
   - `level: warn`, `message: Test warning log`
   - `level: error`, `message: Test error log`

---

## ✅ 7. 프로덕션 빌드 테스트

```bash
cd apps/web
pnpm build
```

**예상 결과:**
- ✅ 빌드 성공
- ❌ 빌드 에러 시 수정 필요

### 빌드 크기 확인

```bash
ls -lh apps/web/dist/assets/*.js
```

**목표:**
- 초기 번들 크기: < 500KB (gzip)
- PostHog/Axiom 추가로 인한 크기 증가: ~50KB 정도

---

## ✅ 8. 사용자 식별 테스트

### Clerk 로그인 후 확인

1. 애플리케이션에 로그인
2. 브라우저 콘솔에서 확인:
   ```
   [Analytics] User identified: user_xxxxx
   ```

### PostHog 대시보드에서 확인

1. PostHog → Persons
2. 방금 로그인한 사용자 확인
3. 사용자 속성 확인:
   - `email`
   - `nickname`
   - `createdAt`

---

## ✅ 9. 에러 핸들링 테스트

### 전역 에러 테스트

임시로 에러를 발생시켜 확인:

```typescript
// 아무 컴포넌트에서 테스트
useEffect(() => {
  throw new Error('Test global error');
}, []);
```

**확인:**
- Axiom Stream에서 에러 로그 수신 확인
- 에러 스택 트레이스 포함 여부 확인

### Promise Rejection 테스트

```typescript
useEffect(() => {
  Promise.reject('Test promise rejection');
}, []);
```

**확인:**
- Axiom에서 `Unhandled promise rejection` 로그 확인

---

## ✅ 10. 페이지 뷰 트래킹 테스트

### 여러 페이지 탐색

1. 홈 → 대시보드 → 설정 페이지 이동
2. PostHog Live Events에서 `$pageview` 이벤트 확인
3. 각 페이지의 `page_name` 또는 `$current_url` 확인

---

## ✅ 11. 성능 영향 측정

### Lighthouse 테스트

```bash
# 프로덕션 빌드 실행
pnpm preview
```

Chrome DevTools → Lighthouse → Performance 측정

**목표:**
- Performance Score: 90 이상 유지
- PostHog/Axiom 통합 후 점수 하락: 5점 이내

---

## ✅ 12. 개인정보 보호 확인

### PostHog 설정 검증

`apps/web/src/lib/analytics.ts` 파일에서 확인:

- [ ] `autocapture: false` (자동 클릭 캡처 비활성화)
- [ ] `session_recording.maskAllInputs: true` (입력 필드 마스킹)
- [ ] 개발 환경에서 `opt_out_capturing()` 호출

### Axiom 로그 검증

로그에 민감한 정보가 포함되지 않았는지 확인:

- [ ] 비밀번호 미포함
- [ ] API 키 미포함
- [ ] 개인 식별 정보(주민등록번호, 카드번호 등) 미포함

---

## ✅ 13. 문서화 확인

### 필수 문서 존재 확인

```bash
# 설치 가이드
ls -la docs/ANALYTICS_LOGGING_SETUP.md

# 사용 예시
ls -la docs/ANALYTICS_USAGE_EXAMPLES.md

# 통합 체크리스트
ls -la docs/ANALYTICS_INTEGRATION_CHECKLIST.md
```

### .env.example 업데이트 확인

```bash
grep -E "(POSTHOG|AXIOM)" apps/web/.env.example
```

**예상 출력:**
```
VITE_POSTHOG_KEY="phc_your_posthog_project_api_key"
VITE_POSTHOG_HOST="https://app.posthog.com"
VITE_AXIOM_TOKEN="xaat-your-axiom-api-token"
VITE_AXIOM_DATASET="travel-planner-logs"
```

---

## ✅ 14. Git 커밋 전 최종 확인

### ESLint 검사

```bash
cd apps/web
pnpm lint
```

**예상 결과:**
- ✅ 린트 에러 없음

### 타입 검사

```bash
cd apps/web
pnpm typecheck
```

**예상 결과:**
- ✅ 타입 에러 없음

### 빌드 테스트

```bash
cd apps/web
pnpm build
```

**예상 결과:**
- ✅ 빌드 성공

---

## 📊 통합 완료 기준

다음 모든 항목이 체크되어야 통합이 완료된 것으로 간주합니다:

- [ ] PostHog 및 Axiom 패키지 설치 완료
- [ ] 환경 변수 설정 완료
- [ ] PostHog 초기화 성공 (콘솔 메시지 확인)
- [ ] Axiom 초기화 성공 (또는 개발 환경 경고 확인)
- [ ] 전역 에러 핸들링 설정 완료
- [ ] 이벤트 트래킹 테스트 성공 (PostHog Live Events)
- [ ] 로그 전송 테스트 성공 (Axiom Stream)
- [ ] 사용자 식별 테스트 성공
- [ ] 페이지 뷰 트래킹 테스트 성공
- [ ] 타입 검사 통과
- [ ] 빌드 성공
- [ ] Lighthouse Performance Score 90 이상
- [ ] 개인정보 보호 설정 확인
- [ ] 문서화 완료

---

## 🚨 문제 해결

### PostHog 이벤트가 전송되지 않는 경우

1. **환경 변수 확인**
   ```bash
   echo $VITE_POSTHOG_KEY
   ```
   - 비어있으면 `.env` 파일에 추가

2. **개발 모드 확인**
   - 개발 환경에서는 `opt_out_capturing()` 때문에 이벤트가 전송되지 않음
   - 프로덕션 빌드로 테스트: `pnpm build && pnpm preview`

3. **네트워크 탭 확인**
   - DevTools → Network → Filter: `posthog`
   - `https://app.posthog.com/` 로 요청 전송 확인

### Axiom 로그가 수신되지 않는 경우

1. **API 토큰 확인**
   - Axiom 대시보드 → Settings → API Tokens
   - Ingest 권한이 있는지 확인

2. **Dataset 이름 확인**
   - Axiom 대시보드 → Datasets
   - `.env` 파일의 `VITE_AXIOM_DATASET`와 일치하는지 확인

3. **브라우저 콘솔 확인**
   - `[Logger] Failed to send log to Axiom:` 에러 메시지 확인
   - CORS 에러가 있으면 Axiom 설정 확인

### 타입 에러가 발생하는 경우

1. **타입 정의 파일 확인**
   ```bash
   ls -la apps/web/src/types/analytics.ts
   ```

2. **posthog-js 타입 설치**
   ```bash
   pnpm add -D @types/posthog-js
   ```

3. **tsconfig.json 확인**
   ```json
   {
     "compilerOptions": {
       "types": ["vite/client"]
     }
   }
   ```

---

**작성일:** 2025-01-18
**문서 버전:** 1.0
