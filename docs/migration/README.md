# Convex 마이그레이션 문서

Travel Planner의 백엔드를 NestJS에서 Convex로 마이그레이션하는 과정을 문서화합니다.

## 문서 목록

### 📋 진행 상황

1. **[마이그레이션 진행 로그](./progress-log.md)** ⭐ 최신
   - 일별 작업 내역
   - 완료된 Phase 상세
   - 생성된 파일 통계
   - 해결된 문제
   - 다음 단계

### 📚 계획 문서

2. **[Convex 마이그레이션 계획](./convex-migration-plan.md)**
   - 전체 마이그레이션 로드맵
   - Phase별 작업 계획
   - 아키텍처 설계

3. **[Convex + Clerk 아키텍처](./convex-clerk-architecture.md)**
   - 통합 아키텍처 설계
   - 인증/인가 플로우
   - 데이터 모델 설계

### 🔧 설정 가이드

4. **[Phase 0 설정 가이드](./phase-0-setup-guide.md)**
   - Clerk 설정 방법
   - Convex 프로젝트 초기화
   - 환경변수 설정
   - 트러블슈팅

### ✅ 완료 보고서

5. **[Phase 0 완료 보고서](./phase-0-completion-report.md)**
   - 작업 내용 요약
   - 생성/수정된 파일 목록
   - 검증 결과
   - Phase 1 준비 사항

## 마이그레이션 Phase

### ✅ Phase 0: Pre-setup (완료)

**목표**: 마이그레이션 계획 및 초기 설정

**완료된 작업**:
- ✅ 마이그레이션 계획 문서 작성
- ✅ migration/convex 브랜치 생성
- ✅ 환경변수 설정 가이드 작성

**상태**: ✅ 완료 (2025-01-17)

---

### ⚠️ Phase 1: 환경 준비 (70% 완료)

**목표**: 외부 서비스 설정 및 API 키 발급

**완료된 작업**:
- ✅ 환경변수 설정 가이드 작성
- ✅ Convex 프로젝트 구조 설계
- ✅ Clerk 프로젝트 구조 설계

**대기 중 (사용자 작업)**:
- [ ] Convex 계정 생성 및 프로젝트 초기화
- [ ] Clerk 앱 등록 및 JWT Template 설정
- [ ] PostHog 프로젝트 생성
- [ ] Axiom 데이터셋 생성
- [ ] Google Maps API 키 발급

**상태**: ⚠️ 부분 완료 (2025-01-18)

---

### ✅ Phase 2: 인증 시스템 전환 (완료)

**목표**: JWT + Passport → Clerk 완전 관리형 인증

**완료된 작업**:
- ✅ Clerk React SDK 통합
- ✅ ClerkProvider 설정
- ✅ 기존 AuthContext 호환성 레이어 생성
- ✅ ProtectedRoute, AdminRoute Clerk 전환
- ✅ LoginPage, SignupPage Clerk 컴포넌트 교체
- ✅ 레거시 라우트 리다이렉트 설정
- ✅ TypeScript 타입 안전성 검증

**상태**: ✅ 완료 (2025-01-18)

---

### ✅ Phase 3: 데이터베이스 스키마 구축 (완료)

**목표**: Convex DB 스키마 정의

**완료된 작업**:
- ✅ Convex 스키마 작성 (9 테이블, 29 인덱스)
- ✅ Clerk JWT 인증 설정
- ✅ TypeScript 설정

**상태**: ✅ 완료 (2025-01-18)

---

### ⚠️ Phase 4: 핵심 API 마이그레이션 (40% 완료)

**목표**: REST API → Convex Functions 전환

**완료된 작업**:
- ✅ Convex 백엔드 함수 구현 (45개)
  - 사용자 API (10개)
  - 장소 API (12개)
  - 리스트 API (11개)
  - Google Places API (5개)
  - 파일 업로드 API (7개)
- ✅ ConvexProviderWithClerk 설정
- ✅ MapPage.tsx Convex 변환 (부분)

**대기 중**:
- [ ] Places.tsx Convex 변환
- [ ] Lists.tsx Convex 변환
- [ ] MyPlaces.tsx Convex 변환
- [ ] Admin 페이지들 Convex 변환
- [ ] Rate Limiting 구현
- [ ] 중복 검증 Convex로 이전

**상태**: ⚠️ 진행 중 (2025-01-18)

---

### ✅ Phase 5: 파일 업로드 마이그레이션 (완료)

**목표**: Cloudflare R2 → Convex File Storage

**완료된 작업**:
- ✅ Convex File Storage API 구현 (7개 함수)
- ✅ 업로드 URL 생성 mutation
- ✅ 이미지 저장 mutations
- ✅ 파일 조회 queries

**상태**: ✅ 완료 (2025-01-18)

---

### ✅ Phase 6: 모니터링 및 분석 통합 (완료)

**목표**: PostHog + Axiom 통합

**완료된 작업**:
- ✅ PostHog 통합 (이벤트 트래킹)
- ✅ Axiom 통합 (로깅)
- ✅ 전역 에러 핸들링
- ✅ TypeScript 타입 정의
- ✅ 문서 작성 (4개)

**상태**: ✅ 완료 (2025-01-18)

---

### ⏳ Phase 7: Railway 배포 (대기)

**목표**: 프로덕션 배포

**예정 작업**:
- [ ] Railway 프로젝트 설정
- [ ] 빌드 설정 (`railway.toml`)
- [ ] 환경변수 설정
- [ ] 배포 테스트

**상태**: ⏳ 대기 중

---

### ⏳ Phase 8: 테스팅 및 검증 (대기)

**목표**: 전체 기능 검증

**예정 작업**:
- [ ] 기능 테스트
- [ ] 성능 테스트 (Lighthouse)
- [ ] 보안 검증

**상태**: ⏳ 대기 중

---

### ⏳ Phase 9: 클린업 (대기)

**목표**: 레거시 코드 제거

**예정 작업**:
- [ ] NestJS Backend 제거
- [ ] Docker 설정 제거
- [ ] 미사용 의존성 제거
- [ ] 문서 최종 업데이트

**상태**: ⏳ 대기 중

## 주요 파일 위치

### Backend (Convex)

```
convex/
├── auth.config.ts              # Clerk 인증 설정
├── .env.example                # 환경변수 예제
├── schema.ts                   # 데이터베이스 스키마
├── places.ts                   # 장소 관련 Functions
├── lists.ts                    # 리스트 관련 Functions
├── users.ts                    # 사용자 관련 Functions
└── upload.ts                   # 파일 업로드 Functions
```

### Frontend

```
apps/web/src/
├── main.tsx                    # 진입점 (ConvexClerkProvider 사용)
├── providers/
│   └── ConvexClerkProvider.tsx # Convex + Clerk Provider 통합
└── vite-env.d.ts              # 환경변수 타입 정의
```

### 환경변수

```
apps/web/.env.example           # Frontend 환경변수 예제
convex/.env.example            # Backend 환경변수 예제
```

## 환경변수 설정

### Frontend (`apps/web/.env`)

```bash
VITE_CONVEX_URL="https://your-deployment.convex.cloud"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_KAKAO_MAP_KEY="..."
VITE_GOOGLE_MAPS_API_KEY="..."
VITE_GOOGLE_MAP_ID="..."
```

### Backend (`convex/.env`)

```bash
CLERK_JWT_ISSUER_DOMAIN="https://your-app.clerk.accounts.dev"
GOOGLE_PLACES_API_KEY="..."
```

## 참고 자료

### Convex 공식 문서

- [Convex Quickstart](https://docs.convex.dev/quickstart)
- [Convex + Clerk 통합](https://docs.convex.dev/auth/clerk)
- [Convex Schema](https://docs.convex.dev/database/schemas)
- [Convex Functions](https://docs.convex.dev/functions)

### Clerk 공식 문서

- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Authentication](https://clerk.com/docs/authentication)

### 프로젝트 내부 문서

- [데이터베이스 아키텍처](../../CLAUDE.md#database-architecture)
- [코드 품질 규칙](../../.claude/CLAUDE.md)

## 문의 및 이슈

마이그레이션 과정에서 문제가 발생하면:

1. [Phase 0 설정 가이드](./phase-0-setup-guide.md)의 트러블슈팅 섹션 확인
2. Convex/Clerk 공식 문서 참조
3. GitHub Issues에 문제 보고

---

**최종 업데이트**: 2025-01-18
**전체 진행률**: 약 55%
**현재 Phase**: Phase 4 (40% 완료)
**다음 단계**: 나머지 페이지 Convex 변환
