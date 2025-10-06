# 회원가입 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 신규 사용자 계정 생성
- 필수 정보 수집 및 검증
- 안전하고 간편한 가입 프로세스

### 1.2 주요 사용자 플로우
```
회원가입 화면 → 정보 입력 → 이메일 인증 → 가입 완료 → 메인 화면
              ↓
              소셜 가입 → 추가 정보 입력 → 가입 완료
```

### 1.3 성공 지표
- 가입 완료율: > 70%
- 가입 소요 시간: < 3분
- 이메일 인증 완료율: > 85%

## 2. 사용자 스토리

### US-1: 이메일 회원가입
**As a** 신규 사용자
**I want** 이메일로 간단하게 가입하고 싶다
**So that** 여행 계획을 시작할 수 있다

### US-2: 소셜 회원가입
**As a** 신규 사용자
**I want** 소셜 계정으로 빠르게 가입하고 싶다
**So that** 복잡한 입력 없이 시작할 수 있다

### US-3: 이메일 인증
**As a** 가입 사용자
**I want** 이메일 인증으로 계정을 확인하고 싶다
**So that** 안전하게 서비스를 이용할 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 이메일 회원가입 폼
- [ ] 이메일 입력 필드
  - 형식 검증 (RFC 5322)
  - 중복 확인 (실시간)
- [ ] 비밀번호 입력 필드
  - 최소 8자, 영문+숫자 조합
  - 강도 표시 (약함/보통/강함)
  - 표시/숨김 토글
- [ ] 비밀번호 확인 필드
  - 일치 여부 확인
- [ ] 닉네임 입력 필드
  - 2-20자 제한
  - 특수문자 제한
  - 중복 확인
- [ ] 약관 동의 체크박스
  - 서비스 이용약관 (필수)
  - 개인정보 처리방침 (필수)
  - 마케팅 정보 수신 (선택)
  - 전체 동의 체크박스

**API 요청:**
```typescript
POST /api/auth/signup
{
  email: string;
  password: string;
  nickname: string;
  agreements: {
    termsOfService: boolean;
    privacyPolicy: boolean;
    marketing: boolean;
  }
}

Response 201:
{
  id: string;
  email: string;
  nickname: string;
  emailVerified: false;
  message: "인증 메일이 발송되었습니다";
}

Response 409:
{
  error: "DUPLICATE_EMAIL";
  message: "이미 사용 중인 이메일입니다";
}
```

**검증 규칙:**
```typescript
// 이메일
- 형식: RFC 5322
- 예: user@example.com

// 비밀번호
- 최소 8자
- 영문 대소문자 + 숫자 조합
- 특수문자 권장
- 금지: 연속된 문자 (aaa, 123)

// 닉네임
- 2-20자
- 한글, 영문, 숫자 허용
- 특수문자 금지 (공백 포함)
- 금지어 필터링
```

#### F-2: 이메일 인증
- [ ] 인증 메일 발송 (가입 시 자동)
- [ ] 인증 링크 클릭 → 계정 활성화
- [ ] 인증 완료 안내 페이지
- [ ] 재발송 버튼 (1분 쿨다운)

**인증 메일 템플릿:**
```
제목: [Travel Planner] 이메일 인증을 완료해주세요

안녕하세요, {nickname}님!

아래 버튼을 클릭하여 이메일 인증을 완료해주세요.

[이메일 인증하기]
{verificationLink}

링크는 24시간 동안 유효합니다.

본인이 가입하지 않았다면 이 메일을 무시해주세요.
```

**API 요청:**
```typescript
GET /api/auth/verify-email?token={token}

Response 200:
{
  message: "이메일 인증이 완료되었습니다";
  user: UserProfile;
}

Response 400:
{
  error: "INVALID_TOKEN";
  message: "유효하지 않거나 만료된 인증 링크입니다";
}
```

#### F-3: 입력 검증 및 피드백
- [ ] 실시간 검증 (debounce 500ms)
- [ ] 에러 메시지 표시 (필드 하단)
- [ ] 성공 인디케이터 (체크마크)
- [ ] 비밀번호 강도 표시
- [ ] 가입 진행률 표시 (선택)

#### F-4: 중복 확인
- [ ] 이메일 중복 확인 API
- [ ] 닉네임 중복 확인 API
- [ ] 디바운스 적용 (500ms)

**API 요청:**
```typescript
GET /api/auth/check-email?email={email}
Response: { available: boolean }

GET /api/auth/check-nickname?nickname={nickname}
Response: { available: boolean }
```

### 3.2 중요 기능 (Phase 2)

#### F-5: 소셜 회원가입
- [ ] Google 가입
- [ ] Kakao 가입
- [ ] Apple 가입
- [ ] 추가 정보 입력 모달
  - 닉네임 (소셜 계정 정보로 자동 입력)
  - 약관 동의

**API 요청:**
```typescript
POST /api/auth/social/{provider}/signup
{
  token: string; // OAuth 토큰
  nickname: string;
  agreements: Agreements;
}

Response 201:
{
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}
```

#### F-6: 프로필 사진 업로드 (선택)
- [ ] 이미지 선택 (갤러리/카메라)
- [ ] 크롭 기능
- [ ] WebP 변환
- [ ] 최대 크기: 2MB
- [ ] 기본 아바타 제공

#### F-7: 가입 완료 화면
- [ ] 환영 메시지
- [ ] 이메일 인증 안내
- [ ] "시작하기" 버튼 → 메인 화면
- [ ] 온보딩 화면 연결 (선택)

### 3.3 추가 기능 (Phase 3)

#### F-8: 초대 코드
- [ ] 초대 코드 입력 필드
- [ ] 초대자/피초대자 혜택 부여

#### F-9: 단계별 가입
- [ ] Step 1: 이메일 입력
- [ ] Step 2: 비밀번호 설정
- [ ] Step 3: 프로필 정보
- [ ] Step 4: 약관 동의
- [ ] 진행률 인디케이터

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│   ← 뒤로가기         │
│                     │
│   회원가입          │
│                     │
│  ┌───────────────┐  │
│  │ 이메일        │  │
│  └───────────────┘  │
│  ✓ 사용 가능합니다   │
│                     │
│  ┌───────────────┐  │
│  │ 비밀번호    👁 │  │
│  └───────────────┘  │
│  ████████░░ 강함     │
│                     │
│  ┌───────────────┐  │
│  │ 비밀번호 확인 │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ 닉네임        │  │
│  └───────────────┘  │
│                     │
│  ☑ 전체 동의        │
│  ☑ [필수] 서비스 이용약관 │
│  ☑ [필수] 개인정보 처리방침 │
│  ☐ [선택] 마케팅 수신 동의 │
│                     │
│  ┌───────────────┐  │
│  │   가입하기    │  │
│  └───────────────┘  │
│                     │
│  ──── 또는 ────     │
│                     │
│  [G] [K] [A]       │
│                     │
│  이미 계정이 있으신가요? │
│      로그인         │
└─────────────────────┘
```

### 4.2 인터랙션

#### 입력 필드
- 포커스: 테두리 강조
- 입력 중: 실시간 검증 (debounce)
- 에러: 빨간 테두리 + 에러 메시지
- 성공: 초록 체크마크

#### 비밀번호 강도
- 약함 (0-33%): 빨간색 게이지
- 보통 (34-66%): 노란색 게이지
- 강함 (67-100%): 초록색 게이지

#### 약관 동의
- 전체 동의: 모든 체크박스 토글
- 개별 약관: 텍스트 클릭 시 상세 모달
- 필수 미동의: 가입 버튼 비활성화

### 4.3 접근성
- 키보드 네비게이션: Tab 순서
- Enter 키: 다음 필드 or 가입 실행
- 스크린 리더: 레이블 및 에러 메시지
- 에러: role="alert" 속성
- 색상 대비: 4.5:1 이상

## 5. 기술 사양

### 5.1 프론트엔드

#### 컴포넌트 구조
```typescript
// SignupScreen.tsx
interface SignupScreenProps {
  onSignupSuccess: (user: User) => void;
}

interface SignupFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  agreements: {
    termsOfService: boolean;
    privacyPolicy: boolean;
    marketing: boolean;
  };
}

// 검증 스키마 (Zod)
const signupSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '영문 대소문자와 숫자를 포함해야 합니다'
    ),
  passwordConfirm: z.string(),
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(20, '닉네임은 최대 20자까지 가능합니다')
    .regex(/^[가-힣a-zA-Z0-9]+$/, '한글, 영문, 숫자만 입력 가능합니다'),
  agreements: z.object({
    termsOfService: z.literal(true, {
      errorMap: () => ({ message: '서비스 이용약관에 동의해주세요' })
    }),
    privacyPolicy: z.literal(true, {
      errorMap: () => ({ message: '개인정보 처리방침에 동의해주세요' })
    }),
    marketing: z.boolean()
  })
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm']
});
```

#### 비밀번호 강도 계산
```typescript
function calculatePasswordStrength(password: string): number {
  let strength = 0;

  // 길이
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;

  // 복잡성
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/\d/.test(password)) strength += 15;
  if (/[^a-zA-Z\d]/.test(password)) strength += 15;

  return Math.min(strength, 100);
}
```

### 5.2 백엔드

#### API 엔드포인트
```typescript
// auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('signup')
  @HttpCode(201)
  async signup(@Body() dto: SignupDto): Promise<SignupResponse> {
    return this.authService.signup(dto);
  }

  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    const available = await this.authService.isEmailAvailable(email);
    return { available };
  }

  @Get('check-nickname')
  async checkNickname(@Query('nickname') nickname: string) {
    const available = await this.authService.isNicknameAvailable(nickname);
    return { available };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}

// signup.dto.ts
export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsString()
  @Length(2, 20)
  @Matches(/^[가-힣a-zA-Z0-9]+$/)
  nickname: string;

  @ValidateNested()
  @Type(() => AgreementsDto)
  agreements: AgreementsDto;
}

export class AgreementsDto {
  @IsBoolean()
  @Equals(true)
  termsOfService: boolean;

  @IsBoolean()
  @Equals(true)
  privacyPolicy: boolean;

  @IsBoolean()
  marketing: boolean;
}
```

#### 비밀번호 해싱
```typescript
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}
```

#### 이메일 인증 토큰 생성
```typescript
import { randomBytes } from 'crypto';

async generateVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');

  await this.emailVerificationRepository.save({
    userId,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간
  });

  return token;
}
```

## 6. 데이터 모델

### 6.1 User (확장)
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  profileImage?: string;
  authProvider: 'email' | 'google' | 'kakao' | 'apple';
  emailVerified: boolean;
  isActive: boolean;
  agreements: {
    termsOfService: boolean;
    privacyPolicy: boolean;
    marketing: boolean;
    agreedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 EmailVerification
```typescript
interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
}
```

## 7. API 명세

### POST /api/auth/signup
이메일 회원가입

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "nickname": "여행자",
  "agreements": {
    "termsOfService": true,
    "privacyPolicy": true,
    "marketing": false
  }
}
```

**Response 201:**
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "nickname": "여행자",
  "emailVerified": false,
  "message": "인증 메일이 발송되었습니다"
}
```

### GET /api/auth/verify-email?token={token}
이메일 인증

**Response 200:**
```json
{
  "message": "이메일 인증이 완료되었습니다",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

## 8. 성능 요구사항

### 8.1 응답 시간
- 가입 API: < 1초
- 중복 확인 API: < 200ms
- 이메일 발송: < 3초 (비동기)

### 8.2 이메일 발송
- 큐 시스템 사용 (Bull, RabbitMQ)
- 재시도 로직 (3회)
- 발송 실패 로깅

## 9. 보안 고려사항

### 9.1 비밀번호
- bcrypt 해싱 (rounds: 12)
- 평문 저장 금지
- 로그에 기록 금지

### 9.2 이메일 인증
- 토큰: 256비트 랜덤
- 유효기간: 24시간
- 1회용 토큰

### 9.3 입력 검증
- 서버 측 재검증 필수
- XSS 방지: 입력 sanitize
- SQL Injection 방지: ORM 사용

## 10. 테스트 계획

### 10.1 Unit 테스트
```typescript
describe('SignupScreen', () => {
  it('이메일 형식 검증', () => {
    // 테스트 코드
  });

  it('비밀번호 강도 계산', () => {
    // 테스트 코드
  });

  it('필수 약관 미동의 시 가입 불가', () => {
    // 테스트 코드
  });
});
```

### 10.2 E2E 시나리오
1. 정상 가입: 입력 → 가입 → 이메일 인증 → 로그인
2. 중복 이메일: 에러 메시지 표시
3. 약관 미동의: 가입 버튼 비활성화

## 11. 향후 개선사항

### 11.1 UX 개선
- 가입 진행률 표시
- 닉네임 추천 기능
- 소셜 계정 연동

### 11.2 보안 강화
- reCAPTCHA 추가
- 비밀번호 유출 확인 (Have I Been Pwned API)

### 11.3 마케팅
- 추천인 코드
- 가입 혜택 안내
