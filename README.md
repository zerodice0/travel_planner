# Travel Planner

여행 계획과 장소 관리를 효율적으로 할 수 있는 개인화된 지도 기반 여행 플래너 웹 애플리케이션

## 프로젝트 구조

```
travel-planner/
├── apps/
│   ├── web/          # React 19 + Vite 프론트엔드
│   └── api/          # NestJS 백엔드
└── docs/             # PRD 문서
```

## 기술 스택

### 프론트엔드
- **프레임워크**: React 19
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Ky
- **라우팅**: React Router v7
- **언어**: TypeScript (strict mode)

### 백엔드
- **프레임워크**: NestJS
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **인증**: JWT + Passport
- **문서화**: Swagger/OpenAPI
- **언어**: TypeScript (strict mode)

### 모노레포 도구
- **패키지 매니저**: pnpm
- **빌드 시스템**: Turborepo
- **코드 품질**: ESLint, Prettier

## 시작하기

### 사전 요구사항
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 14

### 설치

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 데이터베이스 마이그레이션
cd apps/api
pnpm prisma:migrate
```

### 개발 서버 실행

```bash
# 모든 앱 동시 실행
pnpm dev

# 개별 앱 실행
pnpm --filter @travel-planner/web dev
pnpm --filter @travel-planner/api dev
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:4000/api
- API 문서: http://localhost:4000/api/docs

## 빌드

```bash
# 전체 빌드
pnpm build

# 타입 체크
pnpm typecheck

# 린트
pnpm lint

# 포맷팅
pnpm format
```

## 주요 기능

### Phase 1 (MVP)
- ✅ 프로젝트 초기 설정
- 🔄 인증 시스템 (이메일/비밀번호)
- 🔄 지도 기반 장소 관리
- 🔄 목록 생성 및 관리
- 🔄 기본 카테고리 시스템

### Phase 2
- 소셜 로그인 (Google, Kakao, Apple)
- 검색 및 필터링 고도화
- 이미지 업로드 및 최적화

### Phase 3
- 경로 최적화
- 공유 기능
- 통계 및 인사이트

## 개발 원칙

- TypeScript strict 모드 사용
- any 타입 사용 금지
- 500줄 이상 파일 리팩토링 검토
- 기능별 컴포넌트/모듈 분리

## 문서

- [프로젝트 개요](./docs/prd/00-overview.md)
- [API 사양](./docs/prd/05-technical/01-api-specifications.md)
- [데이터 모델](./docs/prd/05-technical/02-data-models.md)

## 라이선스

MIT
