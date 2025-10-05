import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui';
import api from '../lib/api';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token');

  const [isResending, setIsResending] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Token verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Token verification effect
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;

      setIsVerifying(true);
      setVerificationError(null);

      try {
        await api.get(`auth/verify-email?token=${token}`);
        setIsVerified(true);
        toast.success('이메일 인증이 완료되었습니다! 로그인 페이지로 이동합니다.');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        if (error instanceof Error) {
          const errorMessage = (error as { message: string }).message;

          if (errorMessage.includes('이미 인증된')) {
            setVerificationError('이미 인증된 이메일입니다.');
          } else if (errorMessage.includes('만료된')) {
            setVerificationError('인증 링크가 만료되었습니다. 아래 버튼을 클릭하여 새로운 인증 메일을 받으세요.');
          } else if (errorMessage.includes('유효하지 않은')) {
            setVerificationError('유효하지 않은 인증 링크입니다. 새로운 인증 메일을 받으세요.');
          } else {
            setVerificationError('인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
          }
          toast.error('이메일 인증에 실패했습니다.');
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, navigate]);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(remainingTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [remainingTime]);

  const handleResend = async () => {
    if (remainingTime > 0) return;

    setIsResending(true);

    try {
      await api.post('auth/resend-verification-email', {
        json: { email },
      });

      toast.success('인증 메일이 재발송되었습니다');
      setRemainingTime(60); // 60초 타이머 시작
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = (error as { message: string }).message;

        if (errorMessage.includes('429')) {
          toast.error('잠시 후에 다시 시도해주세요');
        } else if (errorMessage.includes('이미 인증된')) {
          toast.error('이미 인증된 이메일입니다');
        } else {
          toast.error('메일 재발송에 실패했습니다');
        }
      }
    } finally {
      setIsResending(false);
    }
  };

  // Verifying state
  if (token && isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
              </div>
            </div>

            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">이메일 인증 중...</h2>
            <p className="text-center text-gray-600">잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // Verified state
  if (token && isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">인증 완료! 🎉</h2>
            <p className="mb-6 text-center text-gray-600">
              이메일 인증이 완료되었습니다.
              <br />
              로그인 페이지로 이동합니다...
            </p>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-center text-sm text-green-800">
                3초 후 자동으로 로그인 페이지로 이동합니다.
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                바로 로그인하기 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verification error state
  if (token && verificationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>

            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">인증 실패</h2>
            <p className="mb-6 text-center text-gray-600">{verificationError}</p>

            {email && (
              <>
                <Button
                  onClick={handleResend}
                  variant="primary"
                  loading={isResending}
                  disabled={isResending || remainingTime > 0}
                  fullWidth
                >
                  {remainingTime > 0
                    ? `재발송 가능까지 ${remainingTime}초`
                    : '새로운 인증 메일 받기'}
                </Button>

                <div className="mt-4 rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    💡 <span className="font-medium">안내사항</span>
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    <li>• 인증 링크는 24시간 동안 유효합니다</li>
                    <li>• 재발송은 1분에 1회만 가능합니다</li>
                  </ul>
                </div>
              </>
            )}

            <div className="mt-6 text-center text-sm text-gray-600">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Email resend UI (no token)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
          </Link>
        </div>

        {/* Verification Info */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">이메일 인증</h2>

          <p className="mb-6 text-center text-gray-600">
            <span className="font-medium text-gray-900">{email}</span>
            <br />
            으로 인증 메일을 발송했습니다.
            <br />
            <br />
            이메일을 확인하고 인증 링크를 클릭해주세요.
          </p>

          {/* Info Box */}
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              💡 <span className="font-medium">안내사항</span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>• 인증 링크는 24시간 동안 유효합니다</li>
              <li>• 메일이 오지 않으면 스팸함을 확인해주세요</li>
              <li>• 재발송은 1분에 1회만 가능합니다</li>
            </ul>
          </div>

          {/* Resend Button */}
          <Button
            onClick={handleResend}
            variant="secondary"
            loading={isResending}
            disabled={isResending || remainingTime > 0}
            fullWidth
          >
            {remainingTime > 0
              ? `재발송 가능까지 ${remainingTime}초`
              : '인증 메일 재발송'}
          </Button>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            이미 인증을 완료하셨나요?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
