# Travel Planner Development Guidelines

## 언어 요구사항 (Language Requirements)

**모든 사용자 대면 메시지, 응답, 설명은 항상 한국어로 작성해야 합니다.**

All user-facing messages, responses, and explanations must always be written in Korean.

---

## Active Technologies

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Convex (Serverless Backend)
- **Authentication**: Clerk
- **Maps**: Google Maps API
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## Project Structure

```
travel-planner/
├── apps/
│   └── web/              # React 프론트엔드
│       ├── src/
│       │   ├── components/  # UI 컴포넌트
│       │   ├── pages/       # 페이지 컴포넌트
│       │   ├── contexts/    # React Context
│       │   ├── hooks/       # Custom Hooks
│       │   ├── lib/         # 유틸리티 라이브러리
│       │   ├── types/       # TypeScript 타입 정의
│       │   └── utils/       # 헬퍼 함수
│       └── vite.config.ts
├── convex/               # Convex 백엔드 함수
│   ├── _generated/
│   ├── places.ts
│   ├── lists.ts
│   └── schema.ts
├── docs/                 # 프로젝트 문서
└── turbo.json
```

## Commands

### Development

- `pnpm install` - 의존성 설치
- `pnpm dev` - 개발 서버 실행 (Turborepo)
- `pnpm --filter @travel-planner/web dev` - 프론트엔드만 실행

### Build

- `pnpm build` - 전체 빌드
- `pnpm --filter @travel-planner/web build` - 프론트엔드만 빌드

### Linting & Type Checking

- `pnpm lint` - ESLint 실행
- `pnpm typecheck` - TypeScript 타입 체크

### Convex

- `npx convex dev` - Convex 개발 모드
- `npx convex deploy` - Convex 배포

## Code Style

### TypeScript

- 모든 코드는 TypeScript로 작성
- `any` 사용 금지 (불가피한 경우 주석으로 설명)
- Strict mode 활성화

### Formatting

- Prettier 사용 (2 spaces, single quotes, semicolons)
- 저장 시 자동 포맷 권장

### Naming Conventions

- React 컴포넌트: PascalCase (`MapPage`, `PlaceCard`)
- Hooks: `use` 접두사 (`useGoogleMap`, `useAuth`)
- 파일명: 컴포넌트는 PascalCase, 유틸리티는 camelCase
- CSS 클래스: Tailwind utility classes 사용

### Import Order

1. React 관련
2. 외부 라이브러리
3. Convex 관련
4. 내부 컴포넌트 (`#components/...`)
5. Contexts, Hooks, Utils (`#contexts/...`, `#hooks/...`, `#utils/...`)
6. 타입 (`#types/...`)

### Path Aliases

프로젝트는 다음 path aliases를 사용합니다:

- `#components/*` → `./src/components/*`
- `#pages/*` → `./src/pages/*`
- `#contexts/*` → `./src/contexts/*`
- `#hooks/*` → `./src/hooks/*`
- `#lib/*` → `./src/lib/*`
- `#types/*` → `./src/types/*`
- `#utils/*` → `./src/utils/*`
- `#constants/*` → `./src/constants/*`
- `@convex/*` → `../../convex/*`

## Testing Guidelines

- 단위 테스트: Vitest 사용 예정
- 통합 테스트: React Testing Library
- E2E 테스트: Playwright (향후 도입 예정)
- 주요 기능 변경 시 수동 테스트 필수

## Commit & Pull Request Guidelines

### Commit Message Format

```
<type>: <subject>

<body>
```

### Types

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `style`: 코드 스타일 변경 (포맷, 세미콜론 등)
- `docs`: 문서 변경
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

### PR Checklist

- [ ] Lint 통과 (`pnpm lint`)
- [ ] Type check 통과 (`pnpm typecheck`)
- [ ] Build 성공 (`pnpm build`)
- [ ] UI 변경 시 스크린샷 첨부
- [ ] Breaking changes 명시

## Recent Changes

- 2025-01: Convex 백엔드 마이그레이션 완료
- 2025-01: Cloudflare Pages 배포 준비 완료
- 2025-01: TypeScript path aliases 구성 (`@convex/*`)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
