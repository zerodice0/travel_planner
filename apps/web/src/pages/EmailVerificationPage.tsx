import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HTTPError } from 'ky';
import { Button } from '#components/ui';
import api from '#lib/api';

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
  const [verificationError, setVerificationError] = useState<{
    message: string;
    type: 'expired' | 'invalid' | 'already_verified' | 'network' | 'server' | 'unknown';
    statusCode?: number;
  } | null>(null);

  // Token verification effect
  useEffect(() => {
    const controller = new AbortController();

    const verifyToken = async () => {
      if (!token) return;

      setIsVerifying(true);
      setVerificationError(null);

      try {
        await api.get(`auth/verify-email?token=${token}`, {
          signal: controller.signal,
        });

        // Check if request was aborted before updating state
        if (controller.signal.aborted) return;

        setIsVerified(true);
        toast.success('이메일 인증이 완료되었습니다! 로그인 페이지로 이동합니다.');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        // Ignore AbortError from cleanup
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        // Check if request was aborted before showing error
        if (controller.signal.aborted) return;

        let errorMessage = '인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
        let errorType: 'expired' | 'invalid' | 'already_verified' | 'network' | 'server' | 'unknown' = 'unknown';
        let statusCode: number | undefined;

        // HTTPError 처리 - ky 라이브러리의 HTTP 에러
        if (error instanceof HTTPError) {
          statusCode = error.response.status;
          try {
            const errorData = await error.response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // JSON 파싱 실패 시 status code 기반 메시지
            if (error.response.status === 500) {
              errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
              errorType = 'server';
            } else if (error.response.status === 404) {
              errorMessage = '인증 링크를 찾을 수 없습니다. 새로운 인증 메일을 받으세요.';
              errorType = 'invalid';
            }
          }
        } else if (error instanceof Error && error.message.includes('fetch')) {
          // 네트워크 에러
          errorMessage = '네트워크 연결을 확인해주세요.';
          errorType = 'network';
        }

        // 에러 메시지 기반 타입 분류
        if (errorMessage.includes('이미 인증된')) {
          errorType = 'already_verified';
        } else if (errorMessage.includes('만료된')) {
          errorType = 'expired';
        } else if (errorMessage.includes('유효하지 않은')) {
          errorType = 'invalid';
        } else if (errorMessage.includes('네트워크')) {
          errorType = 'network';
        } else if (errorMessage.includes('서버 오류')) {
          errorType = 'server';
        }

        setVerificationError({ message: errorMessage, type: errorType, statusCode });
        toast.error('이메일 인증에 실패했습니다.');
      } finally {
        if (!controller.signal.aborted) {
          setIsVerifying(false);
        }
      }
    };

    verifyToken();

    // Cleanup: abort ongoing request when component unmounts or deps change
    return () => controller.abort();
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
      let errorMessage = '메일 재발송에 실패했습니다';

      // HTTPError 처리 - ky 라이브러리의 HTTP 에러
      if (error instanceof HTTPError) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // JSON 파싱 실패 시 status code 기반 메시지
          if (error.response.status === 429) {
            errorMessage = '너무 많은 요청입니다. 잠시 후에 다시 시도해주세요';
          } else if (error.response.status === 500) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요';
          }
        }
      } else if (error instanceof Error && error.message.includes('fetch')) {
        // 네트워크 에러
        errorMessage = '네트워크 연결을 확인해주세요';
      }

      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Verifying state
  if (token && isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
            </Link>
          </div>

          <div className="rounded-2xl bg-card p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
              </div>
            </div>

            <h2 className="mb-4 text-center text-2xl font-bold text-foreground">이메일 인증 중...</h2>
            <p className="text-center text-muted-foreground">잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // Verified state
  if (token && isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
            </Link>
          </div>

          <div className="rounded-2xl bg-card p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="인증 성공"
                >
                  <title>인증 성공</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="mb-4 text-center text-2xl font-bold text-foreground">인증 완료! 🎉</h2>
            <p className="mb-6 text-center text-muted-foreground">
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
    // 에러 타입별 아이콘, 색상, 타이틀
    const errorConfig = {
      expired: {
        icon: 'clock',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        title: '인증 링크 만료'
      },
      invalid: {
        icon: 'x',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        title: '유효하지 않은 링크'
      },
      already_verified: {
        icon: 'check',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        title: '이미 인증됨'
      },
      network: {
        icon: 'wifi',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600',
        title: '네트워크 오류'
      },
      server: {
        icon: 'server',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        title: '서버 오류'
      },
      unknown: {
        icon: 'alert',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        title: '인증 실패'
      },
    };

    const config = errorConfig[verificationError.type];
    const isDev = import.meta.env.DEV;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
            </Link>
          </div>

          <div className="rounded-2xl bg-card p-8 shadow-lg">
            {/* 에러 아이콘 */}
            <div className="mb-6 flex justify-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${config.bgColor}`}>
                {config.icon === 'clock' ? (
                  <svg
                    className={`h-8 w-8 ${config.textColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="인증 링크 만료"
                  >
                    <title>인증 링크 만료</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : config.icon === 'check' ? (
                  <svg
                    className={`h-8 w-8 ${config.textColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="이미 인증됨"
                  >
                    <title>이미 인증됨</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : config.icon === 'wifi' ? (
                  <svg
                    className={`h-8 w-8 ${config.textColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="네트워크 연결 오류"
                  >
                    <title>네트워크 연결 오류</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                ) : (
                  <svg
                    className={`h-8 w-8 ${config.textColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="인증 실패"
                  >
                    <title>인증 실패</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>

            <h2 className="mb-4 text-center text-2xl font-bold text-foreground">{config.title}</h2>
            <p className="mb-6 text-center text-muted-foreground">{verificationError.message}</p>

            {/* 다음 조치 가이드 */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">💡 다음 조치</p>
              {verificationError.type === 'already_verified' ? (
                <p className="text-sm text-blue-800">이미 인증이 완료되었습니다. 로그인 페이지로 이동하여 로그인해주세요.</p>
              ) : verificationError.type === 'network' ? (
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• 인터넷 연결 상태를 확인해주세요</li>
                  <li>• 페이지를 새로고침하거나 잠시 후 다시 시도해주세요</li>
                </ul>
              ) : verificationError.type === 'server' ? (
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• 서버에 일시적인 문제가 발생했습니다</li>
                  <li>• 잠시 후 다시 시도해주세요</li>
                  <li>• 문제가 지속되면 고객센터로 문의해주세요</li>
                </ul>
              ) : (
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• 아래 버튼을 클릭하여 새로운 인증 메일을 받으세요</li>
                  <li>• 인증 링크는 24시간 동안 유효합니다</li>
                  <li>• 메일이 오지 않으면 스팸함을 확인해주세요</li>
                </ul>
              )}
            </div>

            {/* 액션 버튼 */}
            {verificationError.type === 'already_verified' ? (
              <Link to="/login">
                <Button variant="primary" fullWidth>
                  로그인하러 가기
                </Button>
              </Link>
            ) : email && verificationError.type !== 'network' ? (
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
            ) : null}

            {/* 개발 환경 디버그 정보 */}
            {isDev && verificationError.statusCode && (
              <div className="mt-4 rounded-lg bg-gray-100 p-3">
                <p className="text-xs font-mono text-gray-600">
                  <span className="font-semibold">디버그:</span> HTTP {verificationError.statusCode} | Type: {verificationError.type}
                </p>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
          </Link>
        </div>

        {/* Verification Info */}
        <div className="rounded-2xl bg-card p-8 shadow-lg">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="이메일 전송"
              >
                <title>이메일 전송</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h2 className="mb-4 text-center text-2xl font-bold text-foreground">이메일 인증</h2>

          <p className="mb-6 text-center text-muted-foreground">
            <span className="font-medium text-foreground">{email}</span>
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
          <div className="mt-6 text-center text-sm text-muted-foreground">
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
