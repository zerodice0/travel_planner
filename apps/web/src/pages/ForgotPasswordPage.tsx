import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button, Input } from '#components/ui';
import api from '#lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('이메일을 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('auth/request-password-reset', {
        json: { email },
      });

      setIsEmailSent(true);
      toast.success('재설정 링크가 발송되었습니다');
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = (error as { message: string }).message;

        if (errorMessage.includes('429')) {
          toast.error('잠시 후에 다시 시도해주세요');
        } else {
          toast.error('메일 발송에 실패했습니다');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 발송 완료 화면
  if (isEmailSent) {
    const maskedEmail = email.replace(/(.{1})(.*)(@.*)/, (_, first, middle, domain) => {
      return first + '*'.repeat(middle.length) + domain;
    });

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
            </Link>
          </div>

          <div className="rounded-2xl bg-card p-8 shadow-lg">
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

            <h2 className="mb-4 text-center text-2xl font-bold text-foreground">이메일을 확인해주세요</h2>

            <p className="mb-6 text-center text-muted-foreground">
              <span className="font-medium text-foreground">{maskedEmail}</span>
              <br />
              으로 비밀번호 재설정 링크를 발송했습니다.
            </p>

            {/* Info Box */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                💡 <span className="font-medium">안내사항</span>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• 링크는 1시간 동안 유효합니다</li>
                <li>• 메일이 오지 않으면 스팸함을 확인해주세요</li>
                <li>• 재발송은 1시간에 3회까지 가능합니다</li>
              </ul>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                로그인 화면으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 이메일 입력 화면
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

          <h2 className="mb-2 text-2xl font-bold text-foreground">비밀번호 찾기</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            등록된 이메일 주소를 입력해주세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              fullWidth
            >
              재설정 링크 보내기
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
