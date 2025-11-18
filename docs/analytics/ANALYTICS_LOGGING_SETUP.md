# PostHog 및 Axiom 통합 가이드

## 개요

Travel Planner에 PostHog(이벤트 분석) 및 Axiom(로깅)을 통합하는 가이드입니다.

---

## 📦 패키지 설치

### 1. PostHog 설치

```bash
cd apps/web
pnpm add posthog-js
```

**패키지 정보:**
- `posthog-js`: PostHog의 공식 JavaScript SDK
- 용도: 프론트엔드 이벤트 트래킹 및 사용자 분석

### 2. Axiom 설치

```bash
cd apps/web
pnpm add @axiomhq/js
```

**패키지 정보:**
- `@axiomhq/js`: Axiom의 공식 JavaScript SDK
- 용도: 프론트엔드 로그 수집 및 에러 트래킹

---

## 🔑 환경 변수 설정

`apps/web/.env` 파일에 다음 환경 변수를 추가하세요:

```env
# PostHog Configuration
VITE_POSTHOG_KEY=your_posthog_project_api_key
VITE_POSTHOG_HOST=https://app.posthog.com

# Axiom Configuration
VITE_AXIOM_TOKEN=your_axiom_api_token
VITE_AXIOM_DATASET=your_axiom_dataset_name
```

### 환경 변수 가져오기

#### PostHog
1. PostHog 대시보드 접속: https://app.posthog.com
2. Project Settings → API Keys
3. **Project API Key** 복사

#### Axiom
1. Axiom 대시보드 접속: https://app.axiom.co
2. Settings → API Tokens
3. **Create API Token** (Ingest 권한 필요)
4. Dataset 이름 확인 또는 생성

---

## 🚀 사용 방법

### PostHog 이벤트 트래킹

```typescript
import { trackEvent } from '#lib/analytics';

// 간단한 이벤트 트래킹
trackEvent('place_added');

// 속성과 함께 트래킹
trackEvent('place_added', {
  category: 'restaurant',
  source: 'google_maps',
  customName: true,
});

// 페이지 뷰 트래킹 (자동)
// useEffect 내부에서 호출
trackPageView();
```

### Axiom 로깅

```typescript
import { logger } from '#lib/logger';

// 정보 로그
logger.info('User visited dashboard', { userId: 123 });

// 에러 로그
logger.error('Failed to fetch places', error, {
  userId: 123,
  endpoint: '/api/places',
});

// 경고 로그
logger.warn('API rate limit approaching', {
  currentCount: 950,
  limit: 1000,
});

// 디버그 로그 (개발 환경에서만)
logger.debug('Component rendered', { props });
```

---

## 📊 주요 트래킹 이벤트 목록

### 사용자 인증
- `user_signup`: 회원가입 완료
- `user_login`: 로그인 성공
- `user_logout`: 로그아웃

### 장소 관리
- `place_added`: 장소 추가
- `place_updated`: 장소 수정
- `place_deleted`: 장소 삭제
- `place_visited`: 장소 방문 체크

### 리스트 관리
- `list_created`: 리스트 생성
- `list_updated`: 리스트 수정
- `list_deleted`: 리스트 삭제
- `place_added_to_list`: 리스트에 장소 추가

### 검색
- `search_performed`: 검색 수행
- `search_result_clicked`: 검색 결과 클릭

---

## 🔒 개인정보 보호

### PostHog 설정
- 개인 식별 정보(PII)는 자동으로 필터링됩니다
- Clerk 사용자 ID만 전송 (이메일, 전화번호 제외)

### Axiom 설정
- 민감한 데이터는 로그에서 제외
- 환경 변수, API 키 등은 로깅하지 않음

---

## 🧪 테스트

### PostHog 이벤트 확인
1. PostHog 대시보드 → Live Events
2. 애플리케이션에서 이벤트 발생
3. 실시간으로 이벤트 확인

### Axiom 로그 확인
1. Axiom 대시보드 → Stream
2. 애플리케이션에서 로그 발생
3. 실시간으로 로그 스트림 확인

---

## 📝 참고 자료

- [PostHog 공식 문서](https://posthog.com/docs)
- [PostHog React 통합](https://posthog.com/docs/libraries/react)
- [Axiom 공식 문서](https://axiom.co/docs)
- [Axiom JavaScript SDK](https://axiom.co/docs/send-data/ingest#using-the-javascript-sdk)

---

**작성일:** 2025-01-18
**문서 버전:** 1.0
