# Convex 초기화 가이드

Travel Planner 프로젝트의 Convex 마이그레이션을 위한 초기화 가이드입니다.

## 1. Convex 의존성 설치

프로젝트 루트에서 다음 명령을 실행하세요:

```bash
# Convex CLI 및 React 클라이언트 설치
pnpm add convex

# 개발 의존성으로 Convex 타입 추가
pnpm add -D @types/node
```

## 2. Convex 프로젝트 초기화

```bash
# Convex 개발 환경 초기화
npx convex dev
```

**초기화 과정:**
1. Convex 계정 로그인 (브라우저에서 자동으로 열림)
2. 프로젝트 이름 입력: `travel-planner`
3. Convex 대시보드에서 프로젝트 생성 확인
4. 로컬에 `convex/` 디렉토리 자동 생성

## 3. 프로젝트 구조

초기화 후 다음과 같은 구조가 생성됩니다:

```
travel-planner/
├── convex/
│   ├── _generated/        # 자동 생성된 타입 파일 (git ignore)
│   ├── actions/          # 외부 API 호출을 위한 Actions
│   │   ├── googlePlaces.ts
│   │   └── logging.ts
│   ├── schema.ts         # 데이터베이스 스키마 정의
│   ├── places.ts         # 장소 관리 Queries & Mutations
│   ├── lists.ts          # 리스트 관리 Queries & Mutations
│   ├── upload.ts         # 파일 업로드 Mutations
│   └── tsconfig.json     # TypeScript 설정
├── .env.local            # 로컬 환경 변수
└── convex.json           # Convex 프로젝트 설정
```

## 4. 환경 변수 설정

### 4.1 로컬 환경 변수 (`.env.local`)

```bash
# Convex 배포 URL (npx convex dev 실행 시 자동 생성)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# AxiomFM 로깅 (선택)
AXIOM_TOKEN=your_axiom_token
AXIOM_DATASET=travel-planner-logs
```

### 4.2 Convex 환경 변수 설정

Convex 대시보드에서 환경 변수 설정:

```bash
# 또는 CLI로 설정
npx convex env set GOOGLE_MAPS_API_KEY your_google_maps_api_key_here
npx convex env set AXIOM_TOKEN your_axiom_token
npx convex env set AXIOM_DATASET travel-planner-logs
```

## 5. Frontend Convex Provider 설정

### 5.1 Convex React Client 설치 (apps/web)

```bash
cd apps/web
pnpm add convex
```

### 5.2 ConvexProvider 설정

`apps/web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';
import './index.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>
);
```

### 5.3 환경 변수 파일 생성

`apps/web/.env.local`:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 6. Convex 개발 서버 실행

### 6.1 개발 모드

```bash
# Terminal 1: Convex 백엔드
npx convex dev

# Terminal 2: Frontend 개발 서버
cd apps/web
pnpm dev
```

### 6.2 스키마 배포

스키마 변경 시 자동으로 배포되지만, 수동으로 배포할 수도 있습니다:

```bash
npx convex deploy
```

## 7. Convex 대시보드 사용

Convex 대시보드에서 다음 기능을 사용할 수 있습니다:

- **Data**: 실시간 데이터베이스 탐색
- **Functions**: 배포된 함수 목록 및 로그
- **Logs**: 함수 실행 로그 확인
- **Settings**: 환경 변수, 배포 설정

대시보드 접속: https://dashboard.convex.dev

## 8. TypeScript 타입 생성

Convex는 스키마와 함수를 기반으로 자동으로 TypeScript 타입을 생성합니다:

```typescript
// 자동 생성된 API 타입
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

// 사용 예시
const places = useQuery(api.places.listMyPlaces);
const addPlace = useMutation(api.places.addPlace);
```

## 9. Clerk 인증 통합 (다음 단계)

Clerk와 Convex를 통합하려면 다음 단계를 진행하세요:

1. Clerk 앱 생성 및 설정
2. Convex에 Clerk 설정 추가
3. Frontend에 ClerkProvider 추가

자세한 내용은 `docs/CLERK_SETUP.md`를 참고하세요.

## 10. 주요 명령어 요약

```bash
# Convex 개발 서버 시작
npx convex dev

# 프로덕션 배포
npx convex deploy

# 환경 변수 설정
npx convex env set KEY value

# 함수 테스트
npx convex run places:listPublicPlaces

# 데이터 백업
npx convex export

# 데이터 임포트
npx convex import --table places data.jsonl
```

## 11. 문제 해결

### 11.1 `convex dev` 실행 시 오류

```bash
# node_modules 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Convex CLI 재설치
pnpm add -D convex
```

### 11.2 타입 생성 오류

```bash
# 타입 재생성
npx convex dev --once
```

### 11.3 인증 오류

```bash
# Convex 로그아웃 후 재로그인
npx convex logout
npx convex dev
```

## 다음 단계

1. ✅ Convex 초기화 완료
2. 📝 스키마 작성 (`convex/schema.ts`)
3. 📝 핵심 API 작성 (`convex/places.ts`, `convex/lists.ts`)
4. 🔐 Clerk 인증 통합
5. 🚀 Railway 배포

---

**작성일:** 2025-01-18
**문서 버전:** 1.0
