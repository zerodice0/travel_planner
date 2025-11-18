# Convex 마이그레이션 진행 상황

## ✅ 완료된 작업 (2025-01-18)

### Phase 0: Pre-setup (완료)

- [x] 마이그레이션 계획 문서 작성 (`docs/MIGRATION_PLAN.md`)
- [x] 기술 스택 조사 및 비용 분석

### Phase 3: 데이터베이스 스키마 구축 (완료)

#### 생성된 파일

1. **Convex 스키마** (`convex/schema.ts`)
   - 9개 테이블 정의
   - 인덱스 설정 완료
   - TypeScript 타입 안전성 보장

2. **TypeScript 설정** (`convex/tsconfig.json`)
   - Strict 모드 활성화
   - Convex 호환 설정

3. **.gitignore 업데이트**
   - `convex/_generated/` 제외
   - `.convex/` 제외

#### 스키마 구조

| 테이블 | 필드 수 | 인덱스 수 | 설명 |
|--------|---------|-----------|------|
| **users** | 7 | 2 | Clerk 통합 사용자 |
| **places** | 11 | 4 | 공개 장소 (캐싱) |
| **userPlaces** | 13 | 5 | 내 장소 (개인화) |
| **lists** | 6 | 3 | 여행 리스트 |
| **listItems** | 4 | 3 | 리스트 항목 |
| **categories** | 5 | 2 | 카테고리 |
| **reviews** | 10 | 4 | 리뷰 |
| **reports** | 7 | 3 | 신고 |
| **notifications** | 7 | 3 | 알림 |

### Phase 4: 핵심 API 마이그레이션 (완료)

#### 생성된 API 파일

1. **사용자 관리 API** (`convex/users.ts`)
   - Queries: 4개
   - Mutations: 6개
   - Clerk Webhook 통합 준비

2. **장소 관리 API** (`convex/places.ts`)
   - Queries: 5개
   - Mutations: 7개
   - 이중 장소 저장 구조 구현

3. **리스트 관리 API** (`convex/lists.ts`)
   - Queries: 4개
   - Mutations: 7개
   - 드래그 앤 드롭 순서 변경 지원

4. **Google Places API 연동** (`convex/actions/googlePlaces.ts`)
   - Actions: 5개
   - Text Search, Nearby Search, Details, Photo, Autocomplete

5. **파일 업로드 API** (`convex/upload.ts`)
   - Queries: 2개
   - Mutations: 5개
   - Convex Storage 통합

#### API 통계

| API | Queries | Mutations | Actions | Internal | Total |
|-----|---------|-----------|---------|----------|-------|
| users | 4 | 3 | 0 | 3 | 10 |
| places | 5 | 7 | 0 | 0 | 12 |
| lists | 4 | 7 | 0 | 0 | 11 |
| upload | 2 | 5 | 0 | 0 | 7 |
| googlePlaces | 0 | 0 | 5 | 0 | 5 |
| **합계** | **15** | **22** | **5** | **3** | **45** |

### 문서화 (완료)

1. **Convex 초기화 가이드** (`docs/CONVEX_SETUP.md`)
   - 의존성 설치
   - 프로젝트 초기화
   - 환경 변수 설정
   - Frontend Provider 설정

2. **환경 변수 설정 가이드** (`docs/ENV_SETUP.md`)
   - 서비스별 API Key 발급 방법
   - 환경별 설정
   - 보안 주의사항

3. **Convex API 문서** (`convex/README.md`)
   - API 레퍼런스
   - 사용 예시
   - 인증 가이드
   - 개발 팁

4. **환경 변수 예시 파일** (`.env.example`)
   - 필수 환경 변수 목록
   - 선택적 환경 변수 목록

## 📁 생성된 파일 목록

```
travel-planner/
├── convex/
│   ├── actions/
│   │   └── googlePlaces.ts       # Google Places API 연동
│   ├── schema.ts                 # 데이터베이스 스키마
│   ├── users.ts                  # 사용자 관리 API
│   ├── places.ts                 # 장소 관리 API
│   ├── lists.ts                  # 리스트 관리 API
│   ├── upload.ts                 # 파일 업로드 API
│   ├── tsconfig.json             # TypeScript 설정
│   └── README.md                 # API 문서
├── docs/
│   ├── MIGRATION_PLAN.md         # 마이그레이션 계획 (기존)
│   ├── MIGRATION_STATUS.md       # 진행 상황 (이 문서)
│   ├── CONVEX_SETUP.md           # Convex 초기화 가이드
│   └── ENV_SETUP.md              # 환경 변수 설정 가이드
├── .env.example                  # 환경 변수 예시
└── .gitignore                    # Convex 관련 추가
```

## 📊 코드 통계

| 구분 | 파일 수 | 총 라인 수 | 설명 |
|------|---------|-----------|------|
| API 코드 | 6 | ~1,600 | TypeScript + Convex |
| 문서 | 4 | ~1,200 | Markdown |
| 설정 | 2 | ~50 | JSON, env |
| **합계** | **12** | **~2,850** | - |

## 🎯 다음 단계 (Phase 1 & 2)

### 즉시 수행 가능

1. **의존성 설치**
   ```bash
   pnpm add convex
   ```

2. **Convex 초기화**
   ```bash
   npx convex dev
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env.local
   # .env.local 편집
   ```

### Phase 1: 환경 준비 (예상 1-2일)

- [ ] Convex 계정 생성 및 프로젝트 초기화
- [ ] Clerk 앱 등록 및 Google OAuth 설정
- [ ] PostHog 프로젝트 생성 (선택)
- [ ] AxiomFM 데이터셋 생성 (선택)
- [ ] Railway 프로젝트 생성 및 GitHub 연동

### Phase 2: 인증 시스템 전환 (예상 2-3일)

- [ ] Clerk React SDK 설치
- [ ] ClerkProvider 설정
- [ ] Convex + Clerk 통합
- [ ] 인증 페이지 교체
- [ ] 라우팅 보호 변경

### Phase 5: 파일 업로드 마이그레이션 (예상 2-3일)

- [ ] Frontend 파일 업로드 컴포넌트 작성
- [ ] 이미지 압축 통합
- [ ] Convex Storage 테스트

### Phase 6: 모니터링 및 분석 통합 (예상 1-2일)

- [ ] PostHog 통합 (선택)
- [ ] AxiomFM 통합 (선택)
- [ ] 이벤트 트래킹 구현

### Phase 7: Railway 배포 (예상 1일)

- [ ] Railway 프로젝트 설정
- [ ] 빌드 설정
- [ ] 환경 변수 설정
- [ ] CI/CD 파이프라인 구성

### Phase 8: 테스팅 및 검증 (예상 2-3일)

- [ ] 기능 테스트
- [ ] 성능 테스트
- [ ] 보안 검증

### Phase 9: 클린업 (예상 1일)

- [ ] 백엔드 디렉토리 제거 (`apps/api`)
- [ ] Docker 설정 제거
- [ ] 미사용 의존성 제거
- [ ] 문서 업데이트

## 🔍 검증 체크리스트

### 코드 품질

- [x] TypeScript strict 모드 적용
- [x] 모든 함수에 타입 정의
- [x] 에러 핸들링 구현
- [x] 인증 확인 헬퍼 함수 작성
- [x] 유효성 검증 (평점, 중복 등)

### 보안

- [x] 인증 확인 (모든 Mutation/Query)
- [x] 권한 확인 (본인만 수정/삭제)
- [x] Internal Mutation (Webhook용)
- [ ] Rate Limiting (Convex 자동 처리)

### 성능

- [x] 인덱스 최적화
- [x] 불필요한 쿼리 제거
- [ ] 페이지네이션 구현 (일부만 적용)

### 문서화

- [x] API 레퍼런스
- [x] 사용 예시
- [x] 설치 가이드
- [x] 환경 변수 가이드
- [x] 코드 주석 (모든 함수)

## 💡 주요 설계 결정

### 1. 이중 장소 저장 구조 유지

**결정:** Prisma 스키마와 동일하게 Place + UserPlace 분리

**이유:**
- Google Maps API 호출 최소화 (캐싱)
- 공개 장소 vs 개인화 장소 명확히 구분
- 데이터 중복 방지

### 2. Clerk 인증 통합

**결정:** JWT + Passport 대신 Clerk 사용

**이유:**
- 인증 로직 완전 외부화
- Google OAuth 간편 통합
- 프로필 관리 UI 제공
- Convex 공식 통합 지원

### 3. Convex Storage 사용

**결정:** Cloudflare R2 대신 Convex Storage 사용

**이유:**
- 단일 플랫폼 (Convex)로 통합
- 간편한 파일 업로드 API
- 무료 티어 충분 (1GB)

### 4. Actions vs Mutations

**결정:**
- Google Places API: Actions 사용
- 데이터베이스 작업: Mutations 사용

**이유:**
- Actions는 외부 API 호출에 최적화
- Mutations는 실시간 구독 지원

## 🎓 학습 포인트

### Convex 주요 개념

1. **Queries**: 실시간 데이터 구독
2. **Mutations**: 데이터 변경 (트랜잭션 보장)
3. **Actions**: 외부 API 호출 (fetch 사용 가능)
4. **Internal Functions**: Webhook 전용

### TypeScript 타입 안전성

```typescript
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// 자동 생성된 타입으로 완벽한 타입 안전성
const places = useQuery(api.places.listMyPlaces);
const placeId: Id<"places"> = "...";
```

### 실시간 업데이트

```typescript
// Query는 자동으로 구독됨 - 데이터 변경 시 자동 재렌더링
const places = useQuery(api.places.listMyPlaces);
```

## 📝 참고 사항

### 주의사항

1. **서버 실행 금지**: 코드만 작성, 실제 실행은 사용자가 수행
2. **환경 변수**: 실제 값은 사용자가 설정
3. **Clerk 설정**: Webhook 설정은 Phase 2에서 진행

### 권장사항

1. Convex 개발 서버를 먼저 실행하여 타입 파일 생성
2. 환경 변수 검증 함수를 main.tsx에 추가
3. PostHog, AxiomFM은 선택사항 (나중에 추가 가능)

---

**최종 업데이트:** 2025-01-18
**작성자:** Claude Code (AI Agent)
**문서 버전:** 1.0
