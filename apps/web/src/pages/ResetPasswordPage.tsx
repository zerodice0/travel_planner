import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button, Input } from '#components/ui';
import api from '#lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 비밀번호 강도 체크
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
  });

  useEffect(() => {
    if (!token) {
      toast.error('유효하지 않은 재설정 링크입니다');
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    setPasswordStrength({
      hasMinLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
    });
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('새 비밀번호를 입력해주세요');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }

    if (
      !passwordStrength.hasMinLength ||
      !passwordStrength.hasUpperCase ||
      !passwordStrength.hasLowerCase ||
      !passwordStrength.hasNumber
    ) {
      toast.error('비밀번호 요구사항을 충족해주세요');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('auth/reset-password', {
        json: {
          token,
          newPassword,
        },
      });

      setIsSuccess(true);
      toast.success('비밀번호가 변경되었습니다');

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = (error as { message: string }).message;

        if (errorMessage.includes('유효하지 않은')) {
          toast.error('유효하지 않은 재설정 링크입니다');
        } else if (errorMessage.includes('만료')) {
          toast.error('만료된 재설정 링크입니다');
        } else if (errorMessage.includes('이미 사용')) {
          toast.error('이미 사용된 재설정 링크입니다');
        } else {
          toast.error('비밀번호 변경에 실패했습니다');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 성공 화면
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
            </Link>
          </div>

          <div className="rounded-2xl bg-card p-8 shadow-lg">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h2 className="mb-4 text-center text-2xl font-bold text-foreground">
              비밀번호 변경 완료
            </h2>

            <p className="mb-6 text-center text-muted-foreground">
              비밀번호가 성공적으로 변경되었습니다.
              <br />
              새 비밀번호로 로그인해주세요.
            </p>

            {/* Info Box */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                💡 <span className="font-medium">자동 이동</span>
              </p>
              <p className="mt-1 text-sm text-blue-800">잠시 후 로그인 페이지로 자동 이동합니다</p>
            </div>

            <Button
              type="button"
              onClick={() => navigate('/login')}
              fullWidth
            >
              지금 로그인하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 비밀번호 재설정 화면
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
          </Link>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-card p-8 shadow-lg">
          <div className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              뒤로가기
            </Link>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-foreground">새 비밀번호 설정</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            새로운 비밀번호를 입력해주세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 새 비밀번호 */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                새 비밀번호
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
              />

              {/* 비밀번호 강도 표시 */}
              {newPassword && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-foreground">비밀번호 요구사항</div>
                  <ul className="space-y-1">
                    <li
                      className={`flex items-center text-xs ${
                        passwordStrength.hasMinLength ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <svg
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordStrength.hasMinLength ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      최소 8자 이상
                    </li>
                    <li
                      className={`flex items-center text-xs ${
                        passwordStrength.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <svg
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordStrength.hasUpperCase ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      영문 대문자 포함
                    </li>
                    <li
                      className={`flex items-center text-xs ${
                        passwordStrength.hasLowerCase ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <svg
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordStrength.hasLowerCase ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      영문 소문자 포함
                    </li>
                    <li
                      className={`flex items-center text-xs ${
                        passwordStrength.hasNumber ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <svg
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordStrength.hasNumber ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      숫자 포함
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                disabled={isLoading}
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-2 text-xs text-red-600">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              fullWidth
            >
              비밀번호 변경하기
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                로그인 화면으로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
