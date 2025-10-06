# 로그인 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 기존 사용자의 인증 및 세션 생성
- 다양한 로그인 방법 제공 (이메일, 소셜)
- 안전하고 편리한 로그인 경험

### 1.2 주요 사용자 플로우
```
로그인 화면 → 인증 정보 입력 → 검증 → 메인 화면
            ↓
            회원가입 화면
            비밀번호 찾기 화면
```

### 1.3 성공 지표
- 로그인 성공률: > 95%
- 로그인 완료 시간: < 3초
- 소셜 로그인 전환율: > 60%

## 2. 사용자 스토리

### US-1: 이메일 로그인
**As a** 기존 사용자
**I want** 이메일과 비밀번호로 로그인하고 싶다
**So that** 내 여행 계획에 접근할 수 있다

### US-2: 소셜 로그인
**As a** 사용자
**I want** 간편하게 소셜 계정으로 로그인하고 싶다
**So that** 빠르게 서비스를 이용할 수 있다

### US-3: 자동 로그인
**As a** 재방문 사용자
**I want** 자동으로 로그인되길 원한다
**So that** 매번 입력하지 않아도 된다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 이메일/비밀번호 로그인
- [ ] 이메일 입력 필드 (이메일 형식 검증)
- [ ] 비밀번호 입력 필드 (마스킹 처리)
- [ ] 비밀번호 표시/숨김 토글
- [ ] 로그인 버튼
- [ ] 입력 값 실시간 검증
  - 이메일: RFC 5322 형식
  - 비밀번호: 최소 8자

**API 요청:**
```typescript
POST /api/auth/login
{
  email: string;
  password: string;
}

Response 200:
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    profileImage?: string;
  }
}

Response 401:
{
  error: "INVALID_CREDENTIALS";
  message: "이메일 또는 비밀번호가 올바르지 않습니다";
}
```

**예외 처리:**
- 이메일 미등록: "등록되지 않은 이메일입니다. 회원가입 해주세요."
- 비밀번호 불일치: "비밀번호가 올바르지 않습니다."
- 계정 비활성화: "비활성화된 계정입니다. 고객센터에 문의하세요."
- 네트워크 오류: "네트워크 연결을 확인해주세요."

#### F-2: 자동 로그인
- [ ] "자동 로그인" 체크박스
- [ ] 로컬 스토리지에 refreshToken 저장
- [ ] 앱 실행 시 자동 로그인 시도
- [ ] 토큰 만료 시 재로그인 요청

#### F-3: 회원가입 / 비밀번호 찾기 링크
- [ ] "회원가입" 링크 → 회원가입 화면
- [ ] "비밀번호를 잊으셨나요?" 링크 → 비밀번호 재설정 화면

#### F-4: 입력 검증 및 피드백
- [ ] 실시간 입력 검증 (debounce 300ms)
- [ ] 에러 메시지 표시 (필드 하단)
- [ ] 성공/실패 토스트 알림
- [ ] 로딩 상태 표시 (버튼 디스에이블)

### 3.2 중요 기능 (Phase 2)

#### F-5: 소셜 로그인
- [ ] Google 로그인
- [ ] Kakao 로그인
- [ ] Apple 로그인 (iOS 우선)

**API 요청:**
```typescript
POST /api/auth/social/{provider}
{
  token: string; // OAuth 토큰
}

Response 200:
{
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  isNewUser: boolean; // 신규 가입 여부
}
```

#### F-6: 다중 인증 실패 대응
- [ ] 5회 실패 시 계정 임시 잠금 (15분)
- [ ] 잠금 해제 안내 메시지
- [ ] 비밀번호 재설정 유도

#### F-7: 생체 인증 (모바일)
- [ ] Face ID / Touch ID 지원
- [ ] 생체 인증 활성화 옵션
- [ ] 로컬 보안 키 저장

### 3.3 추가 기능 (Phase 3)

#### F-8: 2단계 인증 (2FA)
- [ ] TOTP 방식 (Google Authenticator)
- [ ] SMS 인증 코드
- [ ] 이메일 인증 코드
- [ ] 백업 코드 생성

#### F-9: SSO (Single Sign-On)
- [ ] 기업용 SSO 지원
- [ ] SAML 2.0 프로토콜

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│      ← 뒤로가기      │
│                     │
│    [로고/타이틀]    │
│                     │
│   ┌─────────────┐   │
│   │ 이메일      │   │
│   └─────────────┘   │
│                     │
│   ┌─────────────┐   │
│   │ 비밀번호  👁 │   │
│   └─────────────┘   │
│                     │
│   ☑ 자동 로그인     │
│                     │
│   ┌─────────────┐   │
│   │  로그인     │   │
│   └─────────────┘   │
│                     │
│  비밀번호를 잊으셨나요? │
│                     │
│   ──── 또는 ────    │
│                     │
│  [G] [K] [A]       │
│                     │
│   아직 회원이 아니신가요? │
│      회원가입       │
└─────────────────────┘
```

### 4.2 인터랙션

#### 입력 필드
- 포커스: 테두리 색상 변경 (primary color)
- 에러: 빨간 테두리 + 에러 메시지
- 성공: 초록 체크마크 아이콘

#### 버튼
- 기본: 활성화 상태
- 비활성화: 입력 값 없음 or 검증 실패
- 로딩: 스피너 + "로그인 중..."
- 호버: 약간 어두운 배경

#### 소셜 로그인 버튼
- 각 플랫폼 브랜드 컬러
- 아이콘 + 텍스트
- 탭 시 스케일 애니메이션

### 4.3 접근성
- 키보드 네비게이션: Tab 순서 (이메일 → 비밀번호 → 체크박스 → 버튼)
- Enter 키: 로그인 실행
- 스크린 리더: 각 필드 레이블 읽기
- 에러 메시지: role="alert" 속성
- 색상 대비: 4.5:1 이상

## 5. 기술 사양

### 5.1 프론트엔드

#### 컴포넌트 구조
```typescript
// LoginScreen.tsx
interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// 검증 스키마 (Zod 사용)
const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다')
});
```

#### 상태 관리
```typescript
interface LoginState {
  formData: LoginFormData;
  errors: Partial<Record<keyof LoginFormData, string>>;
  isLoading: boolean;
  loginAttempts: number;
  isLocked: boolean;
  lockUntil: Date | null;
}
```

#### API 클라이언트 (Ky)
```typescript
import ky from 'ky';

const authApi = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  retry: 2
});

async function login(data: LoginFormData) {
  const response = await authApi.post('auth/login', {
    json: {
      email: data.email,
      password: data.password
    }
  }).json<LoginResponse>();

  return response;
}
```

### 5.2 백엔드

#### API 엔드포인트
```typescript
// auth.controller.ts (NestJS)
@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<TokenResponse> {
    return this.authService.refresh(dto.refreshToken);
  }
}

// login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

#### 비밀번호 검증
```typescript
import * as bcrypt from 'bcrypt';

async validatePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

#### JWT 생성
```typescript
import { JwtService } from '@nestjs/jwt';

async generateTokens(user: User) {
  const payload = { sub: user.id, email: user.email };

  const accessToken = this.jwtService.sign(payload, {
    expiresIn: '15m'
  });

  const refreshToken = this.jwtService.sign(payload, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
}
```

## 6. 데이터 모델

### 6.1 User (PostgreSQL)
```typescript
interface User {
  id: string; // UUID
  email: string; // UNIQUE
  passwordHash: string;
  nickname: string;
  profileImage?: string;
  authProvider: 'email' | 'google' | 'kakao' | 'apple';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}
```

### 6.2 RefreshToken
```typescript
interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

### 6.3 LoginAttempt (보안 로그)
```typescript
interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  attemptedAt: Date;
}
```

## 7. API 명세

### POST /api/auth/login
이메일/비밀번호 로그인

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "nickname": "여행자",
    "profileImage": null
  }
}
```

**Response 401:**
```json
{
  "statusCode": 401,
  "error": "INVALID_CREDENTIALS",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다"
}
```

**Response 423:**
```json
{
  "statusCode": 423,
  "error": "ACCOUNT_LOCKED",
  "message": "계정이 잠겼습니다. 15분 후 다시 시도해주세요",
  "lockUntil": "2025-10-05T12:00:00Z"
}
```

### POST /api/auth/refresh
토큰 갱신

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 8. 성능 요구사항

### 8.1 응답 시간
- 로그인 API: < 500ms (P95)
- 토큰 갱신: < 200ms (P95)
- 프론트엔드 렌더링: < 100ms

### 8.2 동시성
- 동시 로그인 요청: 1000 TPS
- 데이터베이스 커넥션 풀: 20

### 8.3 보안
- bcrypt rounds: 12
- JWT 알고리즘: HS256 (대칭키) or RS256 (비대칭키)
- HTTPS 강제

## 9. 보안 고려사항

### 9.1 인증
- 비밀번호 해싱: bcrypt (salt rounds: 12)
- JWT 서명: 안전한 비밀키 사용 (최소 256비트)
- Refresh Token: 데이터베이스 저장 및 검증

### 9.2 공격 방어
- Brute Force: Rate Limiting (1분당 5회)
- SQL Injection: ORM 사용 + 파라미터 바인딩
- XSS: 입력 값 sanitize
- CSRF: SameSite Cookie + CSRF Token

### 9.3 로깅
- 로그인 시도 기록 (성공/실패)
- 의심스러운 활동 모니터링
- 개인정보 마스킹 (비밀번호, 토큰)

## 10. 테스트 계획

### 10.1 Unit 테스트
```typescript
describe('LoginScreen', () => {
  it('유효한 이메일 형식 검증', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });

  it('로그인 성공 시 토큰 저장', async () => {
    // 테스트 코드
  });

  it('5회 실패 시 계정 잠금', async () => {
    // 테스트 코드
  });
});
```

### 10.2 Integration 테스트
- 이메일 로그인 전체 플로우
- 자동 로그인 (토큰 검증)
- 소셜 로그인 OAuth 플로우

### 10.3 E2E 시나리오
1. 정상 로그인: 입력 → 로그인 → 메인 화면
2. 잘못된 비밀번호: 에러 메시지 표시
3. 계정 잠금: 5회 실패 → 잠금 메시지
4. 소셜 로그인: Google 버튼 → 동의 → 로그인

## 11. 향후 개선사항

### 11.1 보안 강화
- 이메일 인증 (첫 로그인 시)
- 새 디바이스 알림
- 비정상 로그인 감지 (IP, 위치 변경)

### 11.2 UX 개선
- 이메일 자동완성
- 최근 로그인 계정 목록
- 다크 모드 지원

### 11.3 분석
- 로그인 방법별 전환율
- 실패 이유 분석
- 로그인 소요 시간 추적
