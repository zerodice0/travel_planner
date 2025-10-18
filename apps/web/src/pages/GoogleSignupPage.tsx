import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Input, Button, Checkbox } from '#components/ui';
import api from '#lib/api';
import { TermsModal } from '#components/modals/TermsModal';
import { PrivacyPolicyModal } from '#components/modals/PrivacyPolicyModal';

export default function GoogleSignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameTimer, setNicknameTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Agreements
  const [agreements, setAgreements] = useState({
    termsOfService: false,
    privacyPolicy: false,
    marketing: false,
  });

  // Modal states
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const email = searchParams.get('email') || '';
  const profileImage = searchParams.get('profileImage') || '';
  const googleId = searchParams.get('googleId') || '';

  useEffect(() => {
    if (!email || !googleId) {
      toast.error('잘못된 접근입니다');
      navigate('/signup');
    }
  }, [email, googleId, navigate]);

  const checkNicknameAvailability = useCallback(async (nicknameValue: string) => {
    if (!nicknameValue || nicknameValue.length < 2) {
      setNicknameAvailable(null);
      return;
    }

    setNicknameChecking(true);
    try {
      const response = await api
        .get(`auth/check-nickname?nickname=${encodeURIComponent(nicknameValue)}`)
        .json<{ available: boolean }>();
      setNicknameAvailable(response.available);
    } catch {
      setNicknameAvailable(null);
    } finally {
      setNicknameChecking(false);
    }
  }, []);

  const handleNicknameChange = (value: string) => {
    setNickname(value);

    // 기본 검증
    if (value.length < 2) {
      setNicknameError('닉네임은 최소 2자 이상이어야 합니다');
    } else if (value.length > 20) {
      setNicknameError('닉네임은 최대 20자까지 가능합니다');
    } else if (!/^[가-힣a-zA-Z0-9]+$/.test(value)) {
      setNicknameError('한글, 영문, 숫자만 입력 가능합니다');
    } else {
      setNicknameError('');
    }

    // 중복 확인 (debounce)
    if (nicknameTimer) clearTimeout(nicknameTimer);
    setNicknameAvailable(null);
    const timer = setTimeout(() => {
      checkNicknameAvailability(value);
    }, 500);
    setNicknameTimer(timer);
  };

  const handleAgreementChange = (field: keyof typeof agreements, checked: boolean) => {
    setAgreements((prev) => ({ ...prev, [field]: checked }));
  };

  const handleAllAgreements = (checked: boolean) => {
    setAgreements({
      termsOfService: checked,
      privacyPolicy: checked,
      marketing: checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nicknameError || nicknameAvailable === false) {
      return;
    }

    if (!agreements.termsOfService || !agreements.privacyPolicy) {
      toast.error('필수 약관에 동의해주세요');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api
        .post('auth/google/complete-signup', {
          json: {
            email,
            nickname,
            googleId,
            profileImage: profileImage || undefined,
            agreements,
          },
        })
        .json<{
          accessToken: string;
          refreshToken: string;
          user: { id: string; email: string; nickname: string };
        }>();

      // 토큰 저장
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      toast.success('회원가입이 완료되었습니다!');
      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = (error as { message: string }).message;

        if (errorMessage.includes('409')) {
          toast.error('이미 사용 중인 닉네임입니다');
        } else {
          toast.error('회원가입에 실패했습니다');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
          </Link>
          <p className="mt-2 text-muted-foreground">거의 다 왔어요!</p>
        </div>

        {/* Signup Form */}
        <div className="rounded-2xl bg-card p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-foreground">추가 정보 입력</h2>

          {/* Google Account Info */}
          <div className="mb-6 rounded-lg bg-background p-4">
            <p className="text-sm text-muted-foreground">Google 계정</p>
            <div className="mt-2 flex items-center gap-3">
              {profileImage && (
                <img src={profileImage} alt="Profile" className="h-10 w-10 rounded-full" />
              )}
              <p className="font-medium text-foreground">{email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nickname Input */}
            <div>
              <Input
                type="text"
                label="닉네임"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                error={nicknameError || (nicknameAvailable === false ? '이미 사용 중인 닉네임입니다' : undefined)}
                placeholder="한글, 영문, 숫자 2-20자"
                fullWidth
                autoComplete="username"
              />
              {nicknameChecking && <p className="mt-1 text-sm text-muted-foreground">확인 중...</p>}
              {nicknameAvailable === true && !nicknameError && (
                <p className="mt-1 text-sm text-green-600">✓ 사용 가능한 닉네임입니다</p>
              )}
            </div>

            {/* Agreements */}
            <div className="space-y-3 border-t pt-5">
              <Checkbox
                label="전체 동의"
                checked={agreements.termsOfService && agreements.privacyPolicy && agreements.marketing}
                onChange={(e) => handleAllAgreements(e.target.checked)}
              />

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
                  checked={agreements.termsOfService}
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
                  checked={agreements.privacyPolicy}
                  onChange={(e) => handleAgreementChange('privacyPolicy', e.target.checked)}
                />
                <Checkbox
                  label="[선택] 마케팅 정보 수신 동의"
                  checked={agreements.marketing}
                  onChange={(e) => handleAgreementChange('marketing', e.target.checked)}
                />
              </div>
            </div>

            {/* Complete Button */}
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={
                isLoading ||
                Boolean(nicknameError) ||
                !nickname ||
                nicknameAvailable === false ||
                !agreements.termsOfService ||
                !agreements.privacyPolicy
              }
              fullWidth
            >
              가입 완료
            </Button>
          </form>
        </div>

        {/* Terms and Privacy Modals */}
        <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
        <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
      </div>
    </div>
  );
}
