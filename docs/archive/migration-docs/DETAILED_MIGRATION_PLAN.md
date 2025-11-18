# 🎯 Travel Planner 마이그레이션 세부 실행 계획

> **기반 문서:** [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
> **작성일:** 2025-01-17
> **작업 방식:** 새 브랜치 (migration/convex)에서 자동 진행

---

## 📋 사용자 결정사항

| 항목 | 결정 |
|------|------|
| **작업 환경** | 새 브랜치 생성 (`migration/convex`) |
| **진행 방식** | 자동 진행 (중간 검토 없음) |
| **데이터 상태** | 테스트 데이터만 (신규 시작) |
| **시작 시점** | 즉시 시작 |

---

## 🚀 Phase 0: 사전 준비 및 브랜치 설정 (30분)

### Step 0.1: Git 브랜치 생성 및 설정

**목표:** 안전한 작업 환경 구성

**작업 내용:**
```bash
# 현재 상태 확인
git status
git log --oneline -5

# 새 브랜치 생성 및 전환
git checkout -b migration/convex

# 브랜치 푸시 (원격 백업)
git push -u origin migration/convex
```

**검증:**
- [ ] `git branch` 명령으로 migration/convex 브랜치에 있는지 확인
- [ ] `git remote -v`로 원격 저장소 연결 확인

**산출물:**
- 새로운 Git 브랜치: `migration/convex`

---

### Step 0.2: 마이그레이션 문서 구조 생성

**목표:** PDCA 사이클 문서 구조 준비

**작업 내용:**
```bash
# PDCA 문서 디렉토리 생성
mkdir -p docs/pdca/migration-convex
mkdir -p docs/pdca/migration-convex/phases

# 초기 문서 생성
touch docs/pdca/migration-convex/plan.md
touch docs/pdca/migration-convex/do.md
touch docs/pdca/migration-convex/check.md
touch docs/pdca/migration-convex/act.md
```

**검증:**
- [ ] `docs/pdca/migration-convex/` 디렉토리 존재 확인
- [ ] 4개의 PDCA 문서 파일 존재 확인

**산출물:**
- PDCA 문서 구조

---

### Step 0.3: Serena 메모리에 컨텍스트 저장

**목표:** 세션 간 컨텍스트 유지

**작업 내용:**
- Migration 시작 상태 기록
- 사용자 결정사항 저장
- 목표 아키텍처 기록

**검증:**
- [ ] `migration_context` 메모리 저장 확인

**산출물:**
- Serena 메모리: `migration_context`

---

## 🌟 Phase 1: 환경 준비 및 기초 설정 (4-6시간)

### Step 1.1: Convex 계정 생성 및 프로젝트 초기화 (30분)

**목표:** Convex 개발 환경 구축

**작업 내용:**

1. **Convex 계정 생성**
   - https://convex.dev 접속
   - GitHub 계정으로 가입
   - 무료 티어 확인

2. **Convex CLI 설치**
   ```bash
   pnpm add -g convex
   ```

3. **Convex 프로젝트 초기화**
   ```bash
   # 프로젝트 루트에서
   npx convex dev --once

   # 설정:
   # - Create new project
   # - Project name: travel-planner
   # - Deployment: dev
   ```

4. **Convex 디렉토리 구조 생성**
   ```bash
   mkdir -p convex/{actions,mutations,queries}
   touch convex/schema.ts
   ```

**검증:**
- [ ] Convex 대시보드에서 프로젝트 생성 확인
- [ ] `convex/` 디렉토리 생성 확인
- [ ] `.env.local`에 `CONVEX_DEPLOYMENT` 환경변수 존재 확인

**산출물:**
- Convex 프로젝트 URL (dev)
- Convex deployment ID
- `convex/` 디렉토리 구조

**다음 단계로 가기 전 확인:**
- Convex 대시보드 접속 가능
- `npx convex dev` 명령 실행 가능

---

### Step 1.2: Clerk 앱 등록 및 설정 (45분)

**목표:** Clerk 인증 환경 구축

**작업 내용:**

1. **Clerk 계정 생성**
   - https://clerk.com 접속
   - GitHub 계정으로 가입
   - 무료 티어 확인 (10K MAU)

2. **Clerk 애플리케이션 생성**
   - Dashboard → Add Application
   - Application name: `Travel Planner`
   - Authentication methods:
     - ✅ Email
     - ✅ Google

3. **Google OAuth 설정**
   - Google Cloud Console에서 OAuth 클라이언트 생성
   - Authorized redirect URIs: Clerk 제공 URL 추가
   - Client ID와 Secret을 Clerk에 등록

4. **API 키 복사**
   - Publishable key 복사
   - Secret key 복사 (서버용)

5. **환경변수 설정**
   ```bash
   # apps/web/.env.local
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

   # convex/.env.local
   CLERK_SECRET_KEY=sk_test_...
   ```

**검증:**
- [ ] Clerk 대시보드에서 앱 생성 확인
- [ ] Google OAuth 연동 완료 확인
- [ ] 환경변수 파일에 키 저장 확인

**산출물:**
- Clerk application ID
- Clerk publishable key
- Clerk secret key
- Google OAuth 설정

**다음 단계로 가기 전 확인:**
- Clerk 대시보드 접속 가능
- API 키 복사 완료

---

### Step 1.3: PostHog 프로젝트 생성 (20분)

**목표:** 사용자 행동 분석 도구 설정

**작업 내용:**

1. **PostHog 계정 생성**
   - https://posthog.com 접속
   - GitHub 계정으로 가입
   - 무료 티어 확인 (1M events/month)

2. **프로젝트 생성**
   - Project name: `Travel Planner`
   - Hosting: Cloud (무료)

3. **API 키 복사**
   - Project Settings → API Keys
   - Project API Key 복사

4. **환경변수 설정**
   ```bash
   # apps/web/.env.local
   VITE_POSTHOG_KEY=phc_...
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```

**검증:**
- [ ] PostHog 대시보드 접속 확인
- [ ] API 키 복사 확인
- [ ] 환경변수 설정 확인

**산출물:**
- PostHog project API key
- PostHog host URL

---

### Step 1.4: AxiomFM 데이터셋 생성 (20분)

**목표:** 로그 수집 및 모니터링 도구 설정

**작업 내용:**

1. **AxiomFM 계정 생성**
   - https://axiom.co 접속
   - GitHub 계정으로 가입
   - 무료 티어 확인 (0.5GB logs/month)

2. **데이터셋 생성**
   - Dataset name: `travel-planner-logs`
   - Description: "Application logs for Travel Planner"

3. **API 토큰 생성**
   - Settings → Tokens → Create Token
   - Token name: `travel-planner-ingest`
   - Permissions: Ingest

4. **환경변수 설정**
   ```bash
   # apps/web/.env.local
   VITE_AXIOM_TOKEN=xaat-...
   VITE_AXIOM_DATASET=travel-planner-logs

   # convex/.env.local
   AXIOM_TOKEN=xaat-...
   AXIOM_DATASET=travel-planner-logs
   ```

**검증:**
- [ ] AxiomFM 대시보드 접속 확인
- [ ] 데이터셋 생성 확인
- [ ] API 토큰 복사 확인

**산출물:**
- AxiomFM dataset name
- AxiomFM API token

---

### Step 1.5: Railway 프로젝트 생성 및 GitHub 연동 (30분)

**목표:** 프론트엔드 배포 환경 구축

**작업 내용:**

1. **Railway 계정 생성**
   - https://railway.app 접속
   - GitHub 계정으로 가입
   - 무료 티어 확인 ($5 credit/month)

2. **새 프로젝트 생성**
   - New Project → Deploy from GitHub repo
   - 저장소 선택: `travel-planner`
   - 브랜치: `migration/convex` (나중에 설정)

3. **빌드 설정 (아직 배포 안 함)**
   - Root Directory: `apps/web`
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `pnpm run preview`

4. **환경변수 추가 (아직은 placeholder)**
   ```
   VITE_CONVEX_URL=
   VITE_CLERK_PUBLISHABLE_KEY=
   VITE_POSTHOG_KEY=
   VITE_GOOGLE_MAPS_API_KEY=
   VITE_AXIOM_TOKEN=
   VITE_AXIOM_DATASET=
   ```

**검증:**
- [ ] Railway 대시보드에서 프로젝트 생성 확인
- [ ] GitHub 연동 확인 (배포는 아직 안 함)
- [ ] 환경변수 placeholder 추가 확인

**산출물:**
- Railway project ID
- Railway project URL (예정)

**주의사항:**
- 아직 배포하지 않음 (Phase 7에서 진행)
- 환경변수는 나중에 실제 값으로 업데이트

---

### Step 1.6: 모든 환경변수 파일 정리 및 검증 (20분)

**목표:** 환경변수 중앙 관리 및 검증

**작업 내용:**

1. **환경변수 템플릿 생성**
   ```bash
   # apps/web/.env.example 생성
   cat > apps/web/.env.example << 'EOF'
   # Convex
   VITE_CONVEX_URL=

   # Clerk
   VITE_CLERK_PUBLISHABLE_KEY=

   # PostHog
   VITE_POSTHOG_KEY=
   VITE_POSTHOG_HOST=https://app.posthog.com

   # Google Maps
   VITE_GOOGLE_MAPS_API_KEY=

   # AxiomFM
   VITE_AXIOM_TOKEN=
   VITE_AXIOM_DATASET=travel-planner-logs
   EOF

   # convex/.env.example 생성
   cat > convex/.env.example << 'EOF'
   # Clerk
   CLERK_SECRET_KEY=

   # Google Maps (Actions용)
   GOOGLE_MAPS_API_KEY=

   # Resend (Email)
   RESEND_API_KEY=

   # AxiomFM
   AXIOM_TOKEN=
   AXIOM_DATASET=travel-planner-logs
   EOF
   ```

2. **실제 환경변수 파일 생성**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp convex/.env.example convex/.env.local
   ```

3. **환경변수 값 채우기**
   - 위 단계에서 얻은 모든 API 키 입력
   - Google Maps API 키는 기존 값 재사용

4. **환경변수 검증 스크립트 작성**
   ```bash
   # scripts/validate-env.sh
   cat > scripts/validate-env.sh << 'EOF'
   #!/bin/bash

   echo "🔍 Validating environment variables..."

   # apps/web/.env.local 체크
   if [ ! -f "apps/web/.env.local" ]; then
     echo "❌ apps/web/.env.local not found"
     exit 1
   fi

   # convex/.env.local 체크
   if [ ! -f "convex/.env.local" ]; then
     echo "❌ convex/.env.local not found"
     exit 1
   fi

   # 필수 환경변수 체크
   source apps/web/.env.local

   [ -z "$VITE_CLERK_PUBLISHABLE_KEY" ] && echo "❌ VITE_CLERK_PUBLISHABLE_KEY missing" && exit 1
   [ -z "$VITE_POSTHOG_KEY" ] && echo "❌ VITE_POSTHOG_KEY missing" && exit 1

   echo "✅ All required environment variables are set"
   EOF

   chmod +x scripts/validate-env.sh
   ```

5. **검증 실행**
   ```bash
   ./scripts/validate-env.sh
   ```

**검증:**
- [ ] `.env.example` 파일 생성 확인
- [ ] `.env.local` 파일에 실제 값 입력 확인
- [ ] 검증 스크립트 통과 확인
- [ ] `.gitignore`에 `.env.local` 포함 확인

**산출물:**
- `apps/web/.env.example`
- `apps/web/.env.local` (gitignore)
- `convex/.env.example`
- `convex/.env.local` (gitignore)
- `scripts/validate-env.sh`

---

### Step 1.7: Phase 1 완료 커밋 (10분)

**목표:** Phase 1 작업 내용 저장

**작업 내용:**
```bash
git add .
git commit -m "feat(migration): Phase 1 - Environment setup complete

- Convex project initialized
- Clerk app configured with Google OAuth
- PostHog project created
- AxiomFM dataset created
- Railway project created (not deployed yet)
- Environment variables configured

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin migration/convex
```

**검증:**
- [ ] 커밋 성공 확인
- [ ] 원격 브랜치 푸시 확인

**Phase 1 총 예상 시간:** 4-6시간

---

## 🔐 Phase 2: 인증 시스템 전환 (6-8시간)

### Step 2.1: Clerk React SDK 설치 (10분)

**목표:** Frontend에 Clerk 라이브러리 추가

**작업 내용:**
```bash
cd apps/web
pnpm add @clerk/clerk-react
```

**검증:**
- [ ] `apps/web/package.json`에 `@clerk/clerk-react` 추가 확인
- [ ] `pnpm-lock.yaml` 업데이트 확인

**산출물:**
- 업데이트된 `package.json`

---

### Step 2.2: ClerkProvider 설정 (30분)

**목표:** Frontend 앱에 Clerk 초기화

**작업 내용:**

1. **main.tsx 수정**
   ```tsx
   // apps/web/src/main.tsx
   import { StrictMode } from 'react';
   import { createRoot } from 'react-dom/client';
   import { ClerkProvider } from '@clerk/clerk-react';
   import App from './App';
   import './index.css';

   const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

   if (!clerkPubKey) {
     throw new Error('Missing Clerk Publishable Key');
   }

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <ClerkProvider publishableKey={clerkPubKey}>
         <App />
       </ClerkProvider>
     </StrictMode>
   );
   ```

2. **개발 서버 시작 및 테스트**
   ```bash
   pnpm dev
   ```

3. **브라우저 콘솔 확인**
   - Clerk 초기화 로그 확인
   - 에러 없는지 확인

**검증:**
- [ ] `main.tsx` 수정 완료
- [ ] 개발 서버 정상 실행
- [ ] 브라우저 콘솔에 Clerk 관련 에러 없음

**산출물:**
- 수정된 `apps/web/src/main.tsx`

---

### Step 2.3: 기존 AuthContext 제거 및 Clerk hooks 사용 (2시간)

**목표:** 커스텀 인증 로직을 Clerk로 완전 교체

**작업 내용:**

1. **기존 파일 백업**
   ```bash
   mkdir -p .backup/auth
   cp apps/web/src/contexts/AuthContext.tsx .backup/auth/
   cp apps/web/src/hooks/useAuth.ts .backup/auth/
   ```

2. **AuthContext.tsx 제거**
   ```bash
   rm apps/web/src/contexts/AuthContext.tsx
   ```

3. **useAuth.ts를 Clerk wrapper로 교체**
   ```tsx
   // apps/web/src/hooks/useAuth.ts
   import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

   export const useAuth = () => {
     const { isSignedIn, isLoaded } = useClerkAuth();
     const { user } = useUser();

     return {
       isAuthenticated: isSignedIn || false,
       isLoading: !isLoaded,
       user: user ? {
         id: user.id,
         email: user.emailAddresses[0]?.emailAddress || '',
         name: user.fullName || user.firstName || 'User',
         imageUrl: user.imageUrl,
       } : null,
     };
   };
   ```

4. **App.tsx에서 AuthContext Provider 제거**
   ```tsx
   // apps/web/src/App.tsx
   // Before:
   // <AuthProvider>
   //   <RouterProvider router={router} />
   // </AuthProvider>

   // After:
   <RouterProvider router={router} />
   ```

5. **모든 컴포넌트에서 useAuth import 확인**
   ```bash
   # useAuth를 사용하는 모든 파일 찾기
   grep -r "from.*useAuth" apps/web/src

   # 필요시 import 경로 수정 (대부분 변경 불필요)
   ```

**검증:**
- [ ] `AuthContext.tsx` 삭제 확인
- [ ] 새로운 `useAuth.ts` 작성 확인
- [ ] 앱 빌드 성공 (`pnpm build`)
- [ ] TypeScript 에러 없음 (`pnpm typecheck`)

**산출물:**
- 삭제: `apps/web/src/contexts/AuthContext.tsx`
- 수정: `apps/web/src/hooks/useAuth.ts`
- 수정: `apps/web/src/App.tsx`

---

### Step 2.4: 로그인/회원가입 페이지를 Clerk 컴포넌트로 교체 (1.5시간)

**목표:** 커스텀 인증 UI를 Clerk 제공 UI로 교체

**작업 내용:**

1. **로그인 페이지 수정**
   ```tsx
   // apps/web/src/pages/Login.tsx
   import { SignIn } from '@clerk/clerk-react';

   const LoginPage = () => {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <SignIn
           routing="path"
           path="/login"
           signUpUrl="/register"
           afterSignInUrl="/dashboard"
         />
       </div>
     );
   };

   export default LoginPage;
   ```

2. **회원가입 페이지 수정**
   ```tsx
   // apps/web/src/pages/Register.tsx
   import { SignUp } from '@clerk/clerk-react';

   const RegisterPage = () => {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <SignUp
           routing="path"
           path="/register"
           signInUrl="/login"
           afterSignUpUrl="/dashboard"
         />
       </div>
     );
   };

   export default RegisterPage;
   ```

3. **라우터 설정 업데이트**
   ```tsx
   // apps/web/src/router.tsx (또는 App.tsx)
   import LoginPage from '#pages/Login';
   import RegisterPage from '#pages/Register';

   const router = createBrowserRouter([
     {
       path: '/login',
       element: <LoginPage />,
     },
     {
       path: '/register',
       element: <RegisterPage />,
     },
     // ... 기타 라우트
   ]);
   ```

4. **기존 커스텀 폼 제거**
   ```bash
   # 기존 커스텀 로그인 폼 백업 및 제거
   mv apps/web/src/components/LoginForm.tsx .backup/auth/ 2>/dev/null || true
   mv apps/web/src/components/RegisterForm.tsx .backup/auth/ 2>/dev/null || true
   ```

**검증:**
- [ ] `/login` 페이지 접속 시 Clerk SignIn UI 표시
- [ ] `/register` 페이지 접속 시 Clerk SignUp UI 표시
- [ ] Google OAuth 버튼 표시 확인
- [ ] 이메일 회원가입 폼 표시 확인

**산출물:**
- 수정: `apps/web/src/pages/Login.tsx`
- 수정: `apps/web/src/pages/Register.tsx`
- 삭제: 기존 커스텀 폼 컴포넌트

---

### Step 2.5: ProtectedRoute를 Clerk 가드로 교체 (1시간)

**목표:** 라우트 보호 로직을 Clerk로 전환

**작업 내용:**

1. **기존 ProtectedRoute 컴포넌트 백업**
   ```bash
   cp apps/web/src/components/ProtectedRoute.tsx .backup/auth/ 2>/dev/null || true
   ```

2. **새로운 ProtectedRoute 작성 (Clerk 기반)**
   ```tsx
   // apps/web/src/components/ProtectedRoute.tsx
   import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
   import { ReactNode } from 'react';

   interface ProtectedRouteProps {
     children: ReactNode;
   }

   export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
     return (
       <>
         <SignedIn>{children}</SignedIn>
         <SignedOut>
           <RedirectToSignIn />
         </SignedOut>
       </>
     );
   };
   ```

3. **라우터에서 ProtectedRoute 사용**
   ```tsx
   // apps/web/src/router.tsx
   import { ProtectedRoute } from '#components/ProtectedRoute';

   const router = createBrowserRouter([
     {
       path: '/dashboard',
       element: (
         <ProtectedRoute>
           <Dashboard />
         </ProtectedRoute>
       ),
     },
     {
       path: '/places',
       element: (
         <ProtectedRoute>
           <Places />
         </ProtectedRoute>
       ),
     },
     // ... 기타 보호된 라우트
   ]);
   ```

4. **모든 보호된 라우트에 적용**
   ```bash
   # 보호가 필요한 라우트 확인
   grep -r "ProtectedRoute" apps/web/src
   ```

**검증:**
- [ ] 비로그인 상태에서 보호된 페이지 접속 시 `/login`으로 리다이렉트
- [ ] 로그인 상태에서 보호된 페이지 정상 접속
- [ ] TypeScript 에러 없음

**산출물:**
- 수정: `apps/web/src/components/ProtectedRoute.tsx`
- 수정: 라우터 설정 파일

---

### Step 2.6: 사용자 프로필 페이지 Clerk 통합 (1시간)

**목표:** 프로필 페이지를 Clerk UserProfile로 교체

**작업 내용:**

1. **프로필 페이지 수정**
   ```tsx
   // apps/web/src/pages/Profile.tsx
   import { UserProfile } from '@clerk/clerk-react';
   import { ProtectedRoute } from '#components/ProtectedRoute';

   const ProfilePage = () => {
     return (
       <ProtectedRoute>
         <div className="container mx-auto py-8">
           <h1 className="text-2xl font-bold mb-6">내 프로필</h1>
           <UserProfile
             routing="path"
             path="/profile"
           />
         </div>
       </ProtectedRoute>
     );
   };

   export default ProfilePage;
   ```

2. **라우터에 프로필 페이지 추가**
   ```tsx
   // apps/web/src/router.tsx
   import ProfilePage from '#pages/Profile';

   const router = createBrowserRouter([
     // ...
     {
       path: '/profile',
       element: <ProfilePage />,
     },
   ]);
   ```

3. **네비게이션 메뉴에 프로필 링크 추가**
   ```tsx
   // apps/web/src/components/Header.tsx (또는 Navigation)
   import { UserButton } from '@clerk/clerk-react';

   const Header = () => {
     return (
       <header>
         {/* ... */}
         <UserButton
           afterSignOutUrl="/"
           userProfileMode="navigation"
           userProfileUrl="/profile"
         />
       </header>
     );
   };
   ```

**검증:**
- [ ] `/profile` 페이지 접속 시 Clerk UserProfile UI 표시
- [ ] 프로필 편집 기능 동작
- [ ] 비밀번호 변경 기능 동작 (이메일 사용자)
- [ ] OAuth 계정 연결/해제 기능 동작

**산출물:**
- 수정: `apps/web/src/pages/Profile.tsx`
- 수정: 헤더/네비게이션 컴포넌트

---

### Step 2.7: 인증 플로우 통합 테스트 (30분)

**목표:** 전체 인증 플로우 동작 검증

**작업 내용:**

1. **테스트 시나리오 실행**
   - [ ] 이메일 회원가입
   - [ ] 이메일 인증 (Clerk 이메일 확인)
   - [ ] 로그인
   - [ ] 보호된 페이지 접속
   - [ ] 프로필 수정
   - [ ] 로그아웃
   - [ ] Google OAuth 로그인
   - [ ] Google 계정으로 보호된 페이지 접속

2. **개발자 도구 확인**
   - Network 탭에서 Clerk API 호출 확인
   - Console에 에러 없는지 확인
   - Application 탭에서 Session 토큰 확인

3. **Clerk 대시보드 확인**
   - Users 섹션에서 테스트 사용자 생성 확인
   - Sessions 확인

**검증:**
- [ ] 모든 테스트 시나리오 통과
- [ ] 브라우저 콘솔에 에러 없음
- [ ] Clerk 대시보드에 사용자 등록 확인

**산출물:**
- 테스트 결과 스크린샷 (선택)

---

### Step 2.8: Phase 2 완료 커밋 (10분)

**목표:** Phase 2 작업 내용 저장

**작업 내용:**
```bash
git add .
git commit -m "feat(migration): Phase 2 - Clerk authentication integration complete

- Installed Clerk React SDK
- Replaced AuthContext with Clerk hooks
- Migrated login/signup pages to Clerk components
- Updated ProtectedRoute with Clerk guards
- Integrated UserProfile for profile management
- All authentication flows tested and verified

✅ Email signup/login working
✅ Google OAuth working
✅ Protected routes working
✅ Profile management working

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin migration/convex
```

**Phase 2 총 예상 시간:** 6-8시간

---

## 🗄️ Phase 3: 데이터베이스 스키마 구축 (4-6시간)

### Step 3.1: Convex 스키마 기본 구조 작성 (1시간)

**목표:** Prisma 스키마를 Convex 스키마로 변환

**작업 내용:**

1. **Prisma 스키마 읽기**
   ```bash
   cat apps/api/prisma/schema.prisma
   ```

2. **Convex 스키마 작성 시작**
   ```typescript
   // convex/schema.ts
   import { defineSchema, defineTable } from "convex/server";
   import { v } from "convex/values";

   export default defineSchema({
     // Users 테이블부터 시작
     users: defineTable({
       clerkId: v.string(),
       email: v.string(),
       nickname: v.string(),
       profileImage: v.optional(v.string()),
       isActive: v.boolean(),
       isAdmin: v.boolean(),
       lastLoginAt: v.optional(v.number()),
       createdAt: v.number(),
       updatedAt: v.number(),
     })
       .index("by_clerkId", ["clerkId"])
       .index("by_email", ["email"]),
   });
   ```

3. **스키마 배포 테스트**
   ```bash
   npx convex dev
   ```

4. **Convex 대시보드에서 확인**
   - Tables 섹션에서 `users` 테이블 생성 확인
   - Indexes 확인

**검증:**
- [ ] `convex/schema.ts` 파일 생성
- [ ] `users` 테이블 정의 완료
- [ ] Convex 대시보드에서 테이블 확인
- [ ] 인덱스 생성 확인

**산출물:**
- `convex/schema.ts` (users 테이블만)

---

### Step 3.2: Places 및 UserPlaces 테이블 정의 (1.5시간)

**목표:** 장소 관련 테이블 스키마 작성

**작업 내용:**

1. **Places 테이블 추가**
   ```typescript
   // convex/schema.ts
   export default defineSchema({
     // ... users

     places: defineTable({
       name: v.string(),
       address: v.string(),
       phone: v.optional(v.string()),
       latitude: v.float64(),
       longitude: v.float64(),
       category: v.string(),
       description: v.optional(v.string()),
       externalUrl: v.optional(v.string()),
       externalId: v.optional(v.string()),
       isPublic: v.boolean(),
       createdAt: v.number(),
       updatedAt: v.number(),
     })
       .index("by_externalId", ["externalId"])
       .index("by_category", ["category"])
       .index("by_isPublic", ["isPublic"]),

     userPlaces: defineTable({
       userId: v.id("users"),
       placeId: v.id("places"),
       customName: v.optional(v.string()),
       labels: v.array(v.string()),
       memo: v.optional(v.string()),
       visited: v.boolean(),
       visitedAt: v.optional(v.number()),
       visitMemo: v.optional(v.string()),
       rating: v.optional(v.float64()),
       estimatedCost: v.optional(v.float64()),
       photos: v.array(v.string()),
       createdAt: v.number(),
       updatedAt: v.number(),
     })
       .index("by_userId", ["userId"])
       .index("by_placeId", ["placeId"])
       .index("by_userId_placeId", ["userId", "placeId"]),
   });
   ```

2. **스키마 배포**
   ```bash
   npx convex dev
   ```

3. **Convex 대시보드 확인**
   - `places` 테이블 생성 확인
   - `userPlaces` 테이블 생성 확인
   - 모든 인덱스 생성 확인

**검증:**
- [ ] `places` 테이블 정의 완료
- [ ] `userPlaces` 테이블 정의 완료
- [ ] 관계형 인덱스 설정 확인
- [ ] Convex 대시보드에서 확인

**산출물:**
- 업데이트된 `convex/schema.ts`

---

### Step 3.3: Lists 및 관련 테이블 정의 (1시간)

**목표:** 리스트 기능 테이블 스키마 작성

**작업 내용:**

1. **Lists 및 ListItems 테이블 추가**
   ```typescript
   // convex/schema.ts
   export default defineSchema({
     // ... users, places, userPlaces

     lists: defineTable({
       userId: v.id("users"),
       name: v.string(),
       description: v.optional(v.string()),
       isPublic: v.boolean(),
       createdAt: v.number(),
       updatedAt: v.number(),
     }).index("by_userId", ["userId"]),

     listItems: defineTable({
       listId: v.id("lists"),
       userPlaceId: v.id("userPlaces"),
       order: v.float64(),
       addedAt: v.number(),
     })
       .index("by_listId", ["listId"])
       .index("by_listId_order", ["listId", "order"]),
   });
   ```

2. **스키마 배포 및 확인**

**검증:**
- [ ] `lists` 테이블 정의 완료
- [ ] `listItems` 테이블 정의 완료
- [ ] 인덱스 설정 확인

**산출물:**
- 업데이트된 `convex/schema.ts`

---

### Step 3.4: Categories, Reviews, Reports, Notifications 테이블 정의 (1.5시간)

**목표:** 나머지 핵심 테이블 스키마 작성

**작업 내용:**

1. **Categories 테이블**
   ```typescript
   categories: defineTable({
     userId: v.id("users"),
     name: v.string(),
     color: v.string(),
     icon: v.optional(v.string()),
     createdAt: v.number(),
   }).index("by_userId", ["userId"]),
   ```

2. **Reviews 테이블**
   ```typescript
   reviews: defineTable({
     userId: v.id("users"),
     placeId: v.id("places"),
     rating: v.float64(),
     content: v.string(),
     photos: v.array(v.string()),
     isModerated: v.boolean(),
     reviewedBy: v.optional(v.id("users")),
     reviewedAt: v.optional(v.number()),
     createdAt: v.number(),
     updatedAt: v.number(),
   })
     .index("by_placeId", ["placeId"])
     .index("by_userId", ["userId"])
     .index("by_isModerated", ["isModerated"]),
   ```

3. **Reports 테이블**
   ```typescript
   reports: defineTable({
     userId: v.id("users"),
     targetType: v.string(),
     targetId: v.string(),
     reason: v.string(),
     description: v.optional(v.string()),
     status: v.string(),
     createdAt: v.number(),
   }).index("by_userId", ["userId"]),
   ```

4. **Notifications 테이블**
   ```typescript
   notifications: defineTable({
     userId: v.id("users"),
     type: v.string(),
     title: v.string(),
     message: v.string(),
     isRead: v.boolean(),
     link: v.optional(v.string()),
     createdAt: v.number(),
   }).index("by_userId_isRead", ["userId", "isRead"]),
   ```

5. **전체 스키마 배포**
   ```bash
   npx convex dev
   ```

**검증:**
- [ ] 모든 테이블 정의 완료
- [ ] 모든 인덱스 설정 확인
- [ ] Convex 대시보드에서 전체 스키마 확인
- [ ] TypeScript 타입 자동 생성 확인 (`convex/_generated/`)

**산출물:**
- 완전한 `convex/schema.ts`
- 자동 생성된 TypeScript 타입

---

### Step 3.5: Convex와 Clerk 통합 설정 (30분)

**목표:** Convex에서 Clerk 인증 사용하도록 설정

**작업 내용:**

1. **Convex에 Clerk 통합 추가**
   ```bash
   npx convex dev --once
   # Dashboard → Settings → Authentication → Add Clerk
   ```

2. **convex/auth.config.js 생성**
   ```javascript
   // convex/auth.config.js
   export default {
     providers: [
       {
         domain: "https://YOUR_CLERK_DOMAIN.clerk.accounts.dev",
         applicationID: "convex",
       },
     ],
   };
   ```

3. **Convex 함수에서 인증 사용 예시**
   ```typescript
   // convex/users.ts
   import { query } from "./_generated/server";

   export const getCurrentUser = query({
     args: {},
     handler: async (ctx) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) {
         return null;
       }

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       return user;
     },
   });
   ```

4. **Frontend에서 Convex + Clerk 통합**
   ```tsx
   // apps/web/src/main.tsx
   import { ConvexProviderWithClerk } from "convex/react-clerk";
   import { ConvexReactClient } from "convex/react";
   import { ClerkProvider, useAuth } from "@clerk/clerk-react";

   const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <ClerkProvider publishableKey={clerkPubKey}>
         <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
           <App />
         </ConvexProviderWithClerk>
       </ClerkProvider>
     </StrictMode>
   );
   ```

**검증:**
- [ ] Clerk 통합 설정 완료
- [ ] `convex/auth.config.js` 생성 확인
- [ ] Frontend에서 `ConvexProviderWithClerk` 사용 확인
- [ ] `ctx.auth.getUserIdentity()` 동작 확인

**산출물:**
- `convex/auth.config.js`
- 업데이트된 `apps/web/src/main.tsx`
- 테스트용 `convex/users.ts`

---

### Step 3.6: Phase 3 완료 커밋 (10분)

**목표:** Phase 3 작업 저장

**작업 내용:**
```bash
git add .
git commit -m "feat(migration): Phase 3 - Convex database schema complete

- Defined all database tables in Convex schema
- Created indexes for optimal query performance
- Integrated Clerk authentication with Convex
- Auto-generated TypeScript types from schema

Tables created:
- users, places, userPlaces
- lists, listItems
- categories
- reviews, reports, notifications

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin migration/convex
```

**Phase 3 총 예상 시간:** 4-6시간

---

## 🔌 Phase 4: 핵심 API 마이그레이션 (12-16시간)

이 Phase는 가장 중요하고 시간이 많이 소요되는 단계입니다. 각 API 그룹을 순차적으로 마이그레이션합니다.

### Step 4.1: Users API 마이그레이션 (2시간)

**목표:** 사용자 관련 Convex 함수 작성

**작업 내용:**

1. **convex/users.ts 생성**
   ```typescript
   // convex/users.ts
   import { query, mutation } from "./_generated/server";
   import { v } from "convex/values";

   // 현재 사용자 조회
   export const getCurrentUser = query({
     args: {},
     handler: async (ctx) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       return user;
     },
   });

   // 사용자 생성 또는 업데이트 (Clerk webhook에서 호출)
   export const upsertUser = mutation({
     args: {
       clerkId: v.string(),
       email: v.string(),
       nickname: v.string(),
       profileImage: v.optional(v.string()),
     },
     handler: async (ctx, args) => {
       const existing = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
         .unique();

       if (existing) {
         await ctx.db.patch(existing._id, {
           email: args.email,
           nickname: args.nickname,
           profileImage: args.profileImage,
           updatedAt: Date.now(),
         });
         return existing._id;
       }

       return await ctx.db.insert("users", {
         clerkId: args.clerkId,
         email: args.email,
         nickname: args.nickname,
         profileImage: args.profileImage,
         isActive: true,
         isAdmin: false,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       });
     },
   });

   // 사용자 프로필 업데이트
   export const updateProfile = mutation({
     args: {
       nickname: v.optional(v.string()),
       profileImage: v.optional(v.string()),
     },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user) throw new Error("User not found");

       await ctx.db.patch(user._id, {
         ...args,
         updatedAt: Date.now(),
       });

       return user._id;
     },
   });
   ```

2. **Frontend에서 사용자 API 테스트**
   ```tsx
   // apps/web/src/pages/Dashboard.tsx
   import { useQuery } from "convex/react";
   import { api } from "../convex/_generated/api";

   const Dashboard = () => {
     const user = useQuery(api.users.getCurrentUser);

     if (user === undefined) return <div>Loading...</div>;
     if (user === null) return <div>Not logged in</div>;

     return <div>Welcome, {user.nickname}!</div>;
   };
   ```

**검증:**
- [ ] `convex/users.ts` 작성 완료
- [ ] Convex 대시보드에서 함수 확인
- [ ] Frontend에서 `getCurrentUser` 호출 성공
- [ ] TypeScript 에러 없음

**산출물:**
- `convex/users.ts`

---

### Step 4.2: Places API - Query 함수 마이그레이션 (3시간)

**목표:** 장소 조회 관련 Convex query 함수 작성

**작업 내용:**

1. **convex/places.ts 생성 - Query 부분**
   ```typescript
   // convex/places.ts
   import { query } from "./_generated/server";
   import { v } from "convex/values";

   // 공개 장소 목록 조회
   export const listPublicPlaces = query({
     args: {
       limit: v.optional(v.number()),
       category: v.optional(v.string()),
     },
     handler: async (ctx, args) => {
       let q = ctx.db.query("places").withIndex("by_isPublic", (q) =>
         q.eq("isPublic", true)
       );

       if (args.category) {
         q = q.filter((q) => q.eq(q.field("category"), args.category));
       }

       const places = await q.take(args.limit ?? 50);
       return places;
     },
   });

   // 내 장소 목록 조회
   export const listMyPlaces = query({
     args: {},
     handler: async (ctx) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user) throw new Error("User not found");

       const userPlaces = await ctx.db
         .query("userPlaces")
         .withIndex("by_userId", (q) => q.eq("userId", user._id))
         .collect();

       // 관련 장소 정보 조인
       const placesWithDetails = await Promise.all(
         userPlaces.map(async (up) => {
           const place = await ctx.db.get(up.placeId);
           return { ...up, place };
         })
       );

       return placesWithDetails;
     },
   });

   // 장소 상세 조회
   export const getPlaceById = query({
     args: { placeId: v.id("places") },
     handler: async (ctx, args) => {
       return await ctx.db.get(args.placeId);
     },
   });

   // 내 장소 상세 조회
   export const getMyPlaceById = query({
     args: { userPlaceId: v.id("userPlaces") },
     handler: async (ctx, args) => {
       const userPlace = await ctx.db.get(args.userPlaceId);
       if (!userPlace) return null;

       const place = await ctx.db.get(userPlace.placeId);
       return { ...userPlace, place };
     },
   });
   ```

2. **Frontend에서 Places Query 테스트**
   ```tsx
   // apps/web/src/pages/Places.tsx
   import { useQuery } from "convex/react";
   import { api } from "../convex/_generated/api";

   const Places = () => {
     const myPlaces = useQuery(api.places.listMyPlaces);

     if (myPlaces === undefined) return <div>Loading...</div>;

     return (
       <div>
         <h1>내 장소</h1>
         {myPlaces.map((item) => (
           <div key={item._id}>
             <h2>{item.place?.name}</h2>
             <p>{item.place?.address}</p>
           </div>
         ))}
       </div>
     );
   };
   ```

**검증:**
- [ ] Query 함수 작성 완료
- [ ] `listPublicPlaces` 동작 확인
- [ ] `listMyPlaces` 동작 확인
- [ ] Frontend에서 데이터 조회 성공

**산출물:**
- `convex/places.ts` (Query 부분)

---

### Step 4.3: Places API - Mutation 함수 마이그레이션 (4시간)

**목표:** 장소 생성/수정/삭제 Convex mutation 함수 작성

**작업 내용:**

1. **convex/places.ts에 Mutation 추가**
   ```typescript
   // convex/places.ts (계속)
   import { mutation } from "./_generated/server";

   // 장소 추가 (공개 장소 + 내 장소)
   export const addPlace = mutation({
     args: {
       name: v.string(),
       address: v.string(),
       phone: v.optional(v.string()),
       latitude: v.number(),
       longitude: v.number(),
       category: v.string(),
       description: v.optional(v.string()),
       externalUrl: v.optional(v.string()),
       externalId: v.optional(v.string()),
       customName: v.optional(v.string()),
       labels: v.array(v.string()),
       memo: v.optional(v.string()),
     },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user) throw new Error("User not found");

       // 1. 공개 장소 확인 또는 생성
       let place = args.externalId
         ? await ctx.db
             .query("places")
             .withIndex("by_externalId", (q) =>
               q.eq("externalId", args.externalId)
             )
             .unique()
         : null;

       if (!place) {
         const placeId = await ctx.db.insert("places", {
           name: args.name,
           address: args.address,
           phone: args.phone,
           latitude: args.latitude,
           longitude: args.longitude,
           category: args.category,
           description: args.description,
           externalUrl: args.externalUrl,
           externalId: args.externalId,
           isPublic: true,
           createdAt: Date.now(),
           updatedAt: Date.now(),
         });
         place = await ctx.db.get(placeId);
       }

       if (!place) throw new Error("Failed to create place");

       // 2. 내 장소 생성
       const userPlaceId = await ctx.db.insert("userPlaces", {
         userId: user._id,
         placeId: place._id,
         customName: args.customName,
         labels: args.labels,
         memo: args.memo,
         visited: false,
         photos: [],
         createdAt: Date.now(),
         updatedAt: Date.now(),
       });

       return { userPlaceId, placeId: place._id };
     },
   });

   // 내 장소 업데이트
   export const updateMyPlace = mutation({
     args: {
       userPlaceId: v.id("userPlaces"),
       customName: v.optional(v.string()),
       labels: v.optional(v.array(v.string())),
       memo: v.optional(v.string()),
       visited: v.optional(v.boolean()),
       visitedAt: v.optional(v.number()),
       visitMemo: v.optional(v.string()),
       rating: v.optional(v.number()),
       estimatedCost: v.optional(v.number()),
     },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const userPlace = await ctx.db.get(args.userPlaceId);
       if (!userPlace) throw new Error("UserPlace not found");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user || userPlace.userId !== user._id) {
         throw new Error("Unauthorized");
       }

       const { userPlaceId, ...updates } = args;
       await ctx.db.patch(userPlaceId, {
         ...updates,
         updatedAt: Date.now(),
       });

       return { success: true };
     },
   });

   // 내 장소 삭제
   export const deleteMyPlace = mutation({
     args: { userPlaceId: v.id("userPlaces") },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const userPlace = await ctx.db.get(args.userPlaceId);
       if (!userPlace) throw new Error("UserPlace not found");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user || userPlace.userId !== user._id) {
         throw new Error("Unauthorized");
       }

       await ctx.db.delete(args.userPlaceId);
       return { success: true };
     },
   });
   ```

2. **Frontend에서 Mutation 테스트**
   ```tsx
   // apps/web/src/pages/Places.tsx
   import { useMutation } from "convex/react";
   import { api } from "../convex/_generated/api";

   const Places = () => {
     const myPlaces = useQuery(api.places.listMyPlaces);
     const addPlace = useMutation(api.places.addPlace);
     const updatePlace = useMutation(api.places.updateMyPlace);
     const deletePlace = useMutation(api.places.deleteMyPlace);

     const handleAddPlace = async () => {
       try {
         await addPlace({
           name: "테스트 장소",
           address: "서울시 강남구",
           latitude: 37.5,
           longitude: 127.0,
           category: "restaurant",
           labels: ["맛집"],
         });
         toast.success("장소가 추가되었습니다");
       } catch (error) {
         toast.error("장소 추가 실패");
       }
     };

     return (
       <div>
         <button onClick={handleAddPlace}>장소 추가</button>
         {/* ... */}
       </div>
     );
   };
   ```

**검증:**
- [ ] `addPlace` 함수 동작 확인
- [ ] `updateMyPlace` 함수 동작 확인
- [ ] `deleteMyPlace` 함수 동작 확인
- [ ] 중복 장소 방지 (externalId 기반) 확인
- [ ] 실시간 업데이트 확인 (다른 탭에서도 반영)

**산출물:**
- 완전한 `convex/places.ts`

---

### Step 4.4: Lists API 마이그레이션 (2.5시간)

**목표:** 리스트 관리 Convex 함수 작성

**작업 내용:**

1. **convex/lists.ts 생성**
   ```typescript
   // convex/lists.ts
   import { query, mutation } from "./_generated/server";
   import { v } from "convex/values";

   // 내 리스트 목록 조회
   export const myLists = query({
     args: {},
     handler: async (ctx) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user) throw new Error("User not found");

       return await ctx.db
         .query("lists")
         .withIndex("by_userId", (q) => q.eq("userId", user._id))
         .collect();
     },
   });

   // 리스트 상세 조회 (장소 포함)
   export const getListWithPlaces = query({
     args: { listId: v.id("lists") },
     handler: async (ctx, args) => {
       const list = await ctx.db.get(args.listId);
       if (!list) throw new Error("List not found");

       const items = await ctx.db
         .query("listItems")
         .withIndex("by_listId_order", (q) => q.eq("listId", args.listId))
         .collect();

       const placesWithDetails = await Promise.all(
         items.map(async (item) => {
           const userPlace = await ctx.db.get(item.userPlaceId);
           const place = userPlace ? await ctx.db.get(userPlace.placeId) : null;
           return { item, userPlace, place };
         })
       );

       return { list, places: placesWithDetails };
     },
   });

   // 리스트 생성
   export const createList = mutation({
     args: {
       name: v.string(),
       description: v.optional(v.string()),
       isPublic: v.boolean(),
     },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user) throw new Error("User not found");

       const listId = await ctx.db.insert("lists", {
         userId: user._id,
         name: args.name,
         description: args.description,
         isPublic: args.isPublic,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       });

       return listId;
     },
   });

   // 리스트에 장소 추가
   export const addPlaceToList = mutation({
     args: {
       listId: v.id("lists"),
       userPlaceId: v.id("userPlaces"),
     },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const list = await ctx.db.get(args.listId);
       if (!list) throw new Error("List not found");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user || list.userId !== user._id) {
         throw new Error("Unauthorized");
       }

       // 최대 order 값 찾기
       const items = await ctx.db
         .query("listItems")
         .withIndex("by_listId", (q) => q.eq("listId", args.listId))
         .collect();

       const maxOrder = items.reduce((max, item) => Math.max(max, item.order), 0);

       const itemId = await ctx.db.insert("listItems", {
         listId: args.listId,
         userPlaceId: args.userPlaceId,
         order: maxOrder + 1,
         addedAt: Date.now(),
       });

       return itemId;
     },
   });

   // 리스트에서 장소 제거
   export const removePlaceFromList = mutation({
     args: { listItemId: v.id("listItems") },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const listItem = await ctx.db.get(args.listItemId);
       if (!listItem) throw new Error("ListItem not found");

       const list = await ctx.db.get(listItem.listId);
       if (!list) throw new Error("List not found");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user || list.userId !== user._id) {
         throw new Error("Unauthorized");
       }

       await ctx.db.delete(args.listItemId);
       return { success: true };
     },
   });

   // 리스트 삭제
   export const deleteList = mutation({
     args: { listId: v.id("lists") },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const list = await ctx.db.get(args.listId);
       if (!list) throw new Error("List not found");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user || list.userId !== user._id) {
         throw new Error("Unauthorized");
       }

       // 리스트 아이템 모두 삭제
       const items = await ctx.db
         .query("listItems")
         .withIndex("by_listId", (q) => q.eq("listId", args.listId))
         .collect();

       for (const item of items) {
         await ctx.db.delete(item._id);
       }

       // 리스트 삭제
       await ctx.db.delete(args.listId);
       return { success: true };
     },
   });
   ```

**검증:**
- [ ] 리스트 생성/조회/삭제 동작 확인
- [ ] 장소 추가/제거 동작 확인
- [ ] 권한 검증 확인
- [ ] Frontend 통합 테스트

**산출물:**
- `convex/lists.ts`

---

### Step 4.5: Categories 및 Search API 마이그레이션 (2시간)

**목표:** 카테고리 관리 및 검색 기능 Convex 함수 작성

**작업 내용:**

1. **convex/categories.ts 생성**
   ```typescript
   // convex/categories.ts
   import { query, mutation } from "./_generated/server";
   import { v } from "convex/values";

   export const myCategories = query({
     args: {},
     handler: async (ctx) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user) throw new Error("User not found");

       return await ctx.db
         .query("categories")
         .withIndex("by_userId", (q) => q.eq("userId", user._id))
         .collect();
     },
   });

   export const createCategory = mutation({
     args: {
       name: v.string(),
       color: v.string(),
       icon: v.optional(v.string()),
     },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Not authenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .unique();

       if (!user) throw new Error("User not found");

       return await ctx.db.insert("categories", {
         userId: user._id,
         name: args.name,
         color: args.color,
         icon: args.icon,
         createdAt: Date.now(),
       });
     },
   });
   ```

2. **convex/search.ts 생성**
   ```typescript
   // convex/search.ts
   import { query } from "./_generated/server";
   import { v } from "convex/values";

   export const searchPlaces = query({
     args: {
       query: v.string(),
       category: v.optional(v.string()),
     },
     handler: async (ctx, args) => {
       let places = await ctx.db.query("places").collect();

       // 간단한 텍스트 검색 (이름, 주소)
       const searchTerm = args.query.toLowerCase();
       places = places.filter(
         (p) =>
           p.name.toLowerCase().includes(searchTerm) ||
           p.address.toLowerCase().includes(searchTerm)
       );

       // 카테고리 필터
       if (args.category) {
         places = places.filter((p) => p.category === args.category);
       }

       return places.slice(0, 50);
     },
   });
   ```

**검증:**
- [ ] 카테고리 CRUD 동작 확인
- [ ] 검색 기능 동작 확인

**산출물:**
- `convex/categories.ts`
- `convex/search.ts`

---

### Step 4.6: Phase 4 중간 커밋 (10분)

**목표:** 핵심 API 마이그레이션 완료 저장

**작업 내용:**
```bash
git add .
git commit -m "feat(migration): Phase 4 - Core API migration complete

- Migrated Users API to Convex
- Migrated Places API (queries and mutations)
- Migrated Lists API with full CRUD
- Migrated Categories and Search APIs
- All APIs tested and verified

✅ Real-time data synchronization working
✅ Authorization checks implemented
✅ TypeScript types auto-generated

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin migration/convex
```

**Phase 4 총 예상 시간:** 12-16시간

---

## 📝 Phase 5-9 요약 (상세 계획 생략 가능)

Phase 5-9는 MIGRATION_PLAN.md를 참고하여 동일한 세부 단계 패턴으로 진행합니다:

### Phase 5: 외부 연동 마이그레이션 (4-6시간)
- Google Places API (Actions)
- 이메일 발송 (Resend)
- 파일 업로드 (Convex Storage)

### Phase 6: 모니터링/분석 통합 (2-3시간)
- PostHog SDK 설치 및 이벤트 트래킹
- AxiomFM 로깅 설정

### Phase 7: Railway 배포 (2시간)
- 빌드 설정
- 환경변수 구성
- 첫 배포

### Phase 8: 테스팅 및 검증 (4-6시간)
- 기능 테스트
- 성능 테스트
- 보안 검증

### Phase 9: 클린업 (2시간)
- Backend 제거
- 문서 업데이트

---

## 📌 다음 단계 액션

지금 바로 시작하시겠습니까? 다음 작업을 진행하겠습니다:

1. **Phase 0 실행** - Git 브랜치 생성 및 문서 구조
2. **Phase 1 실행** - 모든 서비스 계정 생성 및 환경변수 설정

시작하시겠습니까?
