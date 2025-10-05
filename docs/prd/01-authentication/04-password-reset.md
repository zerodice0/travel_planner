# 비밀번호 재설정 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 비밀번호를 잊은 사용자의 계정 복구
- 안전한 비밀번호 재설정 프로세스
- 계정 보안 유지

### 1.2 주요 사용자 플로우
```
비밀번호 찾기 → 이메일 입력 → 인증 메일 발송 → 이메일 링크 클릭 →
새 비밀번호 설정 → 재설정 완료 → 로그인
```

### 1.3 성공 지표
- 재설정 완료율: > 80%
- 이메일 도달률: > 95%
- 평균 복구 시간: < 5분

## 2. 사용자 스토리

### US-1: 비밀번호 찾기
**As a** 비밀번호를 잊은 사용자
**I want** 이메일을 통해 비밀번호를 재설정하고 싶다
**So that** 다시 로그인할 수 있다

### US-2: 재설정 링크
**As a** 사용자
**I want** 이메일로 받은 링크를 클릭하고 싶다
**So that** 안전하게 비밀번호를 변경할 수 있다

### US-3: 보안 확인
**As a** 사용자
**I want** 재설정 링크가 안전하게 관리되길 원한다
**So that** 내 계정이 보호받을 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 이메일 입력 화면
- [ ] 이메일 입력 필드
- [ ] 이메일 형식 검증
- [ ] "재설정 링크 보내기" 버튼
- [ ] 뒤로가기 → 로그인 화면

**API 요청:**
```typescript
POST /api/auth/request-password-reset
{
  email: string;
}

Response 200:
{
  message: "비밀번호 재설정 링크가 이메일로 전송되었습니다";
  email: string; // 마스킹된 이메일 (u***@example.com)
}

Response 404:
{
  error: "EMAIL_NOT_FOUND";
  message: "등록되지 않은 이메일입니다";
}

// 보안: 이메일 존재 여부와 관계없이 항상 200 반환 (선택)
Response 200:
{
  message: "입력하신 이메일로 재설정 링크를 발송했습니다";
}
```

**예외 처리:**
- 미등록 이메일: "입력하신 이메일로 재설정 링크를 발송했습니다" (보안)
- 네트워크 오류: "네트워크 연결을 확인해주세요"
- 서버 오류: "일시적인 오류입니다. 잠시 후 다시 시도해주세요"

#### F-2: 이메일 발송 확인 화면
- [ ] 발송 완료 메시지
- [ ] 마스킹된 이메일 표시
- [ ] 안내 문구
  - "메일이 도착하지 않았나요?"
  - "스팸 메일함을 확인해주세요"
  - "1분 후에 재발송할 수 있습니다"
- [ ] 재발송 버튼 (쿨다운 60초)
- [ ] 로그인 화면으로 돌아가기

#### F-3: 재설정 링크 이메일
```
제목: [Travel Planner] 비밀번호 재설정 안내

안녕하세요,

비밀번호 재설정을 요청하셨습니다.
아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.

[비밀번호 재설정하기]
{resetLink}

링크는 1시간 동안 유효합니다.

본인이 요청하지 않았다면 이 메일을 무시해주세요.
계정은 안전하게 보호되고 있습니다.

문의사항이 있으시면 고객센터로 연락 주세요.
```

#### F-4: 새 비밀번호 설정 화면
- [ ] 새 비밀번호 입력 필드
- [ ] 비밀번호 확인 필드
- [ ] 비밀번호 강도 표시
- [ ] 표시/숨김 토글
- [ ] "비밀번호 재설정" 버튼

**토큰 검증:**
- URL 파라미터로 토큰 전달
- 토큰 유효성 확인 (만료, 사용 여부)
- 유효하지 않은 토큰: 에러 화면 표시

**API 요청:**
```typescript
POST /api/auth/reset-password
{
  token: string;
  newPassword: string;
}

Response 200:
{
  message: "비밀번호가 성공적으로 변경되었습니다";
}

Response 400:
{
  error: "INVALID_TOKEN";
  message: "유효하지 않거나 만료된 링크입니다";
}

Response 400:
{
  error: "WEAK_PASSWORD";
  message: "더 강력한 비밀번호를 설정해주세요";
}
```

**비밀번호 요구사항:**
- 최소 8자
- 영문 대소문자 + 숫자 조합
- 이전 비밀번호와 다름
- 흔한 비밀번호 금지 (password123 등)

#### F-5: 재설정 완료 화면
- [ ] 성공 메시지
- [ ] "로그인하기" 버튼
- [ ] 자동 리다이렉트 (3초 후)

#### F-6: 에러 화면
- [ ] 만료된 링크 안내
- [ ] "재설정 다시 요청하기" 버튼
- [ ] 로그인 화면 링크

### 3.2 중요 기능 (Phase 2)

#### F-7: 재발송 쿨다운
- [ ] 1분 대기 타이머
- [ ] 카운트다운 표시
- [ ] 재발송 횟수 제한 (3회/시간)

#### F-8: 보안 알림
- [ ] 비밀번호 변경 완료 이메일
- [ ] 본인 아닌 경우 조치 안내

**알림 이메일 템플릿:**
```
제목: [Travel Planner] 비밀번호가 변경되었습니다

안녕하세요,

귀하의 계정 비밀번호가 방금 변경되었습니다.

변경 일시: 2025-10-05 12:34:56
IP 주소: 192.168.1.1
디바이스: Chrome on Windows

본인이 변경하지 않았다면 즉시 고객센터로 연락 주세요.
[고객센터 바로가기]

계정 보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.
```

#### F-9: Rate Limiting
- [ ] IP당 요청 제한 (5회/시간)
- [ ] 이메일당 요청 제한 (3회/시간)
- [ ] 과도한 요청 차단 메시지

### 3.3 추가 기능 (Phase 3)

#### F-10: 보안 질문
- [ ] 추가 인증 단계
- [ ] 사전 설정한 보안 질문 답변
- [ ] 2단계 검증

#### F-11: SMS 인증
- [ ] 문자 인증 코드 발송
- [ ] 6자리 숫자 코드
- [ ] 5분 유효기간

## 4. UI/UX 사양

### 4.1 레이아웃

#### 이메일 입력 화면
```
┌─────────────────────┐
│   ← 뒤로가기         │
│                     │
│   비밀번호 찾기      │
│                     │
│  등록된 이메일 주소를  │
│  입력해주세요        │
│                     │
│  ┌───────────────┐  │
│  │ 이메일        │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ 재설정 링크   │  │
│  │   보내기      │  │
│  └───────────────┘  │
│                     │
│  로그인 화면으로      │
└─────────────────────┘
```

#### 발송 완료 화면
```
┌─────────────────────┐
│                     │
│      📧             │
│                     │
│  이메일을 확인해주세요 │
│                     │
│  u***@example.com   │
│  으로 재설정 링크를   │
│  발송했습니다        │
│                     │
│  메일이 오지 않았나요? │
│  · 스팸 메일함 확인   │
│  · 1분 후 재발송 가능 │
│                     │
│  ┌───────────────┐  │
│  │ 재발송 (60초) │  │
│  └───────────────┘  │
│                     │
│  로그인 화면으로      │
└─────────────────────┘
```

#### 새 비밀번호 설정
```
┌─────────────────────┐
│   새 비밀번호 설정    │
│                     │
│  ┌───────────────┐  │
│  │ 새 비밀번호 👁 │  │
│  └───────────────┘  │
│  ████████░░ 강함     │
│                     │
│  ┌───────────────┐  │
│  │ 비밀번호 확인 │  │
│  └───────────────┘  │
│                     │
│  ✓ 8자 이상          │
│  ✓ 영문 포함         │
│  ✓ 숫자 포함         │
│                     │
│  ┌───────────────┐  │
│  │ 재설정 완료   │  │
│  └───────────────┘  │
└─────────────────────┘
```

### 4.2 인터랙션

#### 재발송 버튼
- 쿨다운 중: 비활성화 + 카운트다운
- 활성화: 클릭 가능
- 재발송 성공: 토스트 알림

#### 비밀번호 강도
- 실시간 검증
- 게이지 바 애니메이션
- 요구사항 체크리스트

### 4.3 접근성
- 스크린 리더: 상태 메시지 읽기
- 키보드: Enter로 제출
- 포커스 인디케이터
- 에러: role="alert"

## 5. 기술 사양

### 5.1 프론트엔드

#### 컴포넌트 구조
```typescript
// PasswordResetRequestScreen.tsx
interface PasswordResetRequestScreenProps {
  onSuccess: () => void;
}

// PasswordResetScreen.tsx
interface PasswordResetScreenProps {
  token: string;
  onSuccess: () => void;
}

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}
```

#### 타이머 관리
```typescript
function useResendTimer(initialSeconds: number = 60) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [seconds]);

  const reset = () => {
    setSeconds(initialSeconds);
    setCanResend(false);
  };

  return { seconds, canResend, reset };
}
```

### 5.2 백엔드

#### API 엔드포인트
```typescript
// auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('request-password-reset')
  @HttpCode(200)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}

// request-password-reset.dto.ts
export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

// reset-password.dto.ts
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  newPassword: string;
}
```

#### 토큰 생성 및 검증
```typescript
import { randomBytes } from 'crypto';

async generateResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');

  await this.passwordResetRepository.save({
    userId,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간
    used: false
  });

  return token;
}

async validateResetToken(token: string): Promise<string> {
  const resetRequest = await this.passwordResetRepository.findOne({
    where: { token, used: false }
  });

  if (!resetRequest) {
    throw new BadRequestException('유효하지 않은 토큰입니다');
  }

  if (new Date() > resetRequest.expiresAt) {
    throw new BadRequestException('만료된 토큰입니다');
  }

  return resetRequest.userId;
}
```

## 6. 데이터 모델

### 6.1 PasswordReset
```typescript
interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
```

## 7. API 명세

### POST /api/auth/request-password-reset
재설정 링크 요청

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response 200:**
```json
{
  "message": "비밀번호 재설정 링크가 이메일로 전송되었습니다",
  "email": "u***@example.com"
}
```

### POST /api/auth/reset-password
비밀번호 재설정

**Request:**
```json
{
  "token": "abc123...",
  "newPassword": "NewSecurePass123!"
}
```

**Response 200:**
```json
{
  "message": "비밀번호가 성공적으로 변경되었습니다"
}
```

## 8. 성능 요구사항

### 8.1 응답 시간
- 재설정 요청: < 1초
- 이메일 발송: < 3초 (비동기)
- 비밀번호 변경: < 500ms

### 8.2 이메일 발송
- 큐 시스템 사용
- 재시도: 3회
- 발송 실패 로깅

## 9. 보안 고려사항

### 9.1 토큰 보안
- 256비트 랜덤 토큰
- 1시간 유효기간
- 1회용 (사용 후 무효화)

### 9.2 Rate Limiting
- IP당: 5회/시간
- 이메일당: 3회/시간
- 차단 시: 429 응답

### 9.3 로깅
- 모든 재설정 시도 기록
- IP 주소, User-Agent 저장
- 의심스러운 패턴 모니터링

### 9.4 이메일 열거 방지
- 존재하지 않는 이메일에도 성공 응답
- 타이밍 공격 방지 (응답 시간 일정)

## 10. 테스트 계획

### 10.1 Unit 테스트
```typescript
describe('PasswordReset', () => {
  it('토큰 생성 및 검증', async () => {
    // 테스트 코드
  });

  it('만료된 토큰 거부', async () => {
    // 테스트 코드
  });

  it('사용된 토큰 재사용 방지', async () => {
    // 테스트 코드
  });
});
```

### 10.2 E2E 시나리오
1. 정상 재설정: 이메일 입력 → 링크 클릭 → 비밀번호 변경 → 로그인
2. 만료된 링크: 에러 화면 표시
3. 재발송: 쿨다운 → 재발송 성공

## 11. 향후 개선사항

### 11.1 보안 강화
- 2단계 인증 (2FA) 통합
- 생체 인증
- 디바이스 인증

### 11.2 UX 개선
- 비밀번호 변경 후 자동 로그인
- 비밀번호 관리자 통합

### 11.3 알림
- 푸시 알림
- 계정 활동 로그
