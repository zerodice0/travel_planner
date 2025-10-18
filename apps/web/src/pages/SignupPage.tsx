import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Input, Button, Checkbox } from '#components/ui';
import { signupSchema, type SignupFormData } from '#lib/validations';
import { useRecaptcha } from '#hooks/useRecaptcha';
import api from '#lib/api';
import { TermsModal } from '#components/modals/TermsModal';
import { PrivacyPolicyModal } from '#components/modals/PrivacyPolicyModal';

interface SignupResponse {
  id: string;
  email: string;
  nickname: string;
  emailVerified: boolean;
  message: string;
}

// 비밀번호 강도 계산
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

export default function SignupPage() {
  const navigate = useNavigate();
  const { executeRecaptcha } = useRecaptcha();
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    agreements: {
      termsOfService: false,
      privacyPolicy: false,
      marketing: false,
    },
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailChecking, setEmailChecking] = useState(false);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);

  // Debounce timer
  const [emailTimer, setEmailTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [nicknameTimer, setNicknameTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Modal states
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailAvailable(null);
      return;
    }

    setEmailChecking(true);
    try {
      const response = await api.get(`auth/check-email?email=${encodeURIComponent(email)}`).json<{ available: boolean }>();
      setEmailAvailable(response.available);
    } catch {
      setEmailAvailable(null);
    } finally {
      setEmailChecking(false);
    }
  }, []);

  const checkNicknameAvailability = useCallback(async (nickname: string) => {
    if (!nickname || nickname.length < 2) {
      setNicknameAvailable(null);
      return;
    }

    setNicknameChecking(true);
    try {
      const response = await api.get(`auth/check-nickname?nickname=${encodeURIComponent(nickname)}`).json<{ available: boolean }>();
      setNicknameAvailable(response.available);
    } catch {
      setNicknameAvailable(null);
    } finally {
      setNicknameChecking(false);
    }
  }, []);

  const validateField = (field: keyof SignupFormData, value: string | boolean | typeof formData.agreements) => {
    try {
      signupSchema.pick({ [field]: true }).parse({ [field]: value });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof Error) {
        const zodError = JSON.parse(error.message);
        setErrors((prev) => ({ ...prev, [field]: zodError[0]?.message }));
      }
    }
  };

  const handleChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 비밀번호 강도 계산
    if (field === 'password' && typeof value === 'string') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Debounced validation
    setTimeout(() => {
      if (field !== 'agreements') {
        validateField(field, value);
      }
    }, 300);

    // 이메일 중복 확인 (debounce)
    if (field === 'email' && typeof value === 'string') {
      if (emailTimer) clearTimeout(emailTimer);
      setEmailAvailable(null);
      const timer = setTimeout(() => {
        checkEmailAvailability(value);
      }, 500);
      setEmailTimer(timer);
    }

    // 닉네임 중복 확인 (debounce)
    if (field === 'nickname' && typeof value === 'string') {
      if (nicknameTimer) clearTimeout(nicknameTimer);
      setNicknameAvailable(null);
      const timer = setTimeout(() => {
        checkNicknameAvailability(value);
      }, 500);
      setNicknameTimer(timer);
    }
  };

  const handleAgreementChange = (field: keyof SignupFormData['agreements'], checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreements: { ...prev.agreements, [field]: checked },
    }));
  };

  const handleAllAgreements = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreements: {
        termsOfService: checked,
        privacyPolicy: checked,
        marketing: checked,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    try {
      signupSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof Error) {
        const zodErrors = JSON.parse(error.message);
        const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
        zodErrors.forEach((err: { path: (string | number)[]; message: string }) => {
          const path = err.path.join('.');
          if (path === 'agreements.termsOfService' || path === 'agreements.privacyPolicy') {
            fieldErrors.agreements = err.message;
          } else {
            fieldErrors[err.path[0] as keyof SignupFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    // 이메일/닉네임 중복 확인
    if (emailAvailable === false) {
      toast.error('이미 사용 중인 이메일입니다');
      return;
    }
    if (nicknameAvailable === false) {
      toast.error('이미 사용 중인 닉네임입니다');
      return;
    }

    setIsLoading(true);

    try {
      // reCAPTCHA 토큰 생성
      const recaptchaToken = await executeRecaptcha('signup');

      const response = await api
        .post('auth/signup', {
          json: {
            email: formData.email,
            password: formData.password,
            nickname: formData.nickname,
            agreements: formData.agreements,
            recaptchaToken,
            frontendUrl: window.location.origin,
          },
        })
        .json<SignupResponse>();

      toast.success(response.message || '회원가입이 완료되었습니다!');
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = (error as { message: string }).message;

        if (errorMessage.includes('409')) {
          toast.error('이미 사용 중인 이메일 또는 닉네임입니다');
        } else if (errorMessage.includes('네트워크')) {
          toast.error('네트워크 연결을 확인해주세요');
        } else {
          toast.error('회원가입에 실패했습니다');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 34) return { label: '약함', color: 'bg-red-500' };
    if (passwordStrength < 67) return { label: '보통', color: 'bg-yellow-500' };
    return { label: '강함', color: 'bg-green-500' };
  };

  const passwordStrengthInfo = getPasswordStrengthLabel();
  const allAgreed =
    formData.agreements.termsOfService && formData.agreements.privacyPolicy && formData.agreements.marketing;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
          </Link>
          <p className="mt-2 text-muted-foreground">새로운 여행을 시작하세요</p>
        </div>

        {/* Signup Form */}
        <div className="rounded-2xl bg-card p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-foreground">회원가입</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <Input
                type="email"
                label="이메일"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email || (emailAvailable === false ? '이미 사용 중인 이메일입니다' : undefined)}
                placeholder="example@email.com"
                fullWidth
                autoComplete="email"
              />
              {emailChecking && <p className="mt-1 text-sm text-muted-foreground">확인 중...</p>}
              {emailAvailable === true && !errors.email && (
                <p className="mt-1 text-sm text-green-600">✓ 사용 가능한 이메일입니다</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <Input
                type="password"
                label="비밀번호"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                placeholder="영문 대소문자, 숫자 포함 8자 이상"
                fullWidth
                autoComplete="new-password"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrengthInfo.color}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{passwordStrengthInfo.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Password Confirm Input */}
            <Input
              type="password"
              label="비밀번호 확인"
              value={formData.passwordConfirm}
              onChange={(e) => handleChange('passwordConfirm', e.target.value)}
              error={errors.passwordConfirm}
              placeholder="비밀번호를 다시 입력하세요"
              fullWidth
              autoComplete="new-password"
            />

            {/* Nickname Input */}
            <div>
              <Input
                type="text"
                label="닉네임"
                value={formData.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                error={errors.nickname || (nicknameAvailable === false ? '이미 사용 중인 닉네임입니다' : undefined)}
                placeholder="한글, 영문, 숫자 2-20자"
                fullWidth
                autoComplete="username"
              />
              {nicknameChecking && <p className="mt-1 text-sm text-muted-foreground">확인 중...</p>}
              {nicknameAvailable === true && !errors.nickname && (
                <p className="mt-1 text-sm text-green-600">✓ 사용 가능한 닉네임입니다</p>
              )}
            </div>

            {/* Agreements */}
            <div className="space-y-3 border-t pt-5">
              <Checkbox label="전체 동의" checked={allAgreed} onChange={(e) => handleAllAgreements(e.target.checked)} />

              <div className="ml-6 space-y-2">
                <Checkbox
                  label={
                    <span>
                      [필수]{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsTermsModalOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 underline"
                      >
                        서비스 이용약관
                      </button>
                    </span>
                  }
                  checked={formData.agreements.termsOfService}
                  onChange={(e) => handleAgreementChange('termsOfService', e.target.checked)}
                />
                <Checkbox
                  label={
                    <span>
                      [필수]{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsPrivacyModalOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 underline"
                      >
                        개인정보 처리방침
                      </button>
                    </span>
                  }
                  checked={formData.agreements.privacyPolicy}
                  onChange={(e) => handleAgreementChange('privacyPolicy', e.target.checked)}
                />
                <Checkbox
                  label="[선택] 마케팅 정보 수신 동의"
                  checked={formData.agreements.marketing}
                  onChange={(e) => handleAgreementChange('marketing', e.target.checked)}
                />
              </div>

              {errors.agreements && <p className="text-sm text-error">{errors.agreements}</p>}
            </div>

            {/* Signup Button */}
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={
                isLoading ||
                Boolean(errors.email) ||
                Boolean(errors.password) ||
                Boolean(errors.passwordConfirm) ||
                Boolean(errors.nickname) ||
                !formData.agreements.termsOfService ||
                !formData.agreements.privacyPolicy ||
                emailAvailable === false ||
                nicknameAvailable === false
              }
              fullWidth
            >
              가입하기
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-input" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">또는</span>
              </div>
            </div>

            {/* Social Signup */}
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/google`)}
                className="flex items-center justify-center gap-3 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google로 시작하기
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  로그인
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Terms and Privacy Modals */}
        <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
        <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
      </div>
    </div>
  );
}
