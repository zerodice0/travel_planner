import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Input, Button, Checkbox } from '../components/ui';
import { loginSchema, type LoginFormData } from '../lib/validations';
import api from '../lib/api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    profileImage?: string;
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: keyof LoginFormData, value: string | boolean) => {
    try {
      loginSchema.pick({ [field]: true }).parse({ [field]: value });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof Error) {
        const zodError = JSON.parse(error.message);
        setErrors((prev) => ({ ...prev, [field]: zodError[0]?.message }));
      }
    }
  };

  const handleChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Debounced validation
    setTimeout(() => {
      validateField(field, value);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    try {
      loginSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof Error) {
        const zodErrors = JSON.parse(error.message);
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
        zodErrors.forEach((err: { path: string[]; message: string }) => {
          fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await api
        .post('auth/login', {
          json: {
            email: formData.email,
            password: formData.password,
          },
        })
        .json<LoginResponse>();

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      if (formData.rememberMe) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      toast.success('로그인 성공!');
      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = (error as { message: string }).message;

        if (errorMessage.includes('401')) {
          toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
        } else if (errorMessage.includes('네트워크')) {
          toast.error('네트워크 연결을 확인해주세요');
        } else {
          toast.error('로그인에 실패했습니다');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
          <p className="mt-2 text-gray-600">여행 계획과 장소 관리를 위한 플래너</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <Input
              type="email"
              label="이메일"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onKeyPress={handleKeyPress}
              error={errors.email}
              placeholder="example@email.com"
              fullWidth
              autoComplete="email"
            />

            {/* Password Input */}
            <Input
              type="password"
              label="비밀번호"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              error={errors.password}
              placeholder="최소 8자 이상"
              fullWidth
              autoComplete="current-password"
            />

            {/* Remember Me Checkbox */}
            <Checkbox
              label="자동 로그인"
              checked={formData.rememberMe || false}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
            />

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading || !!errors.email || !!errors.password}
              fullWidth
            >
              로그인
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">또는</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/google`}
                className="flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
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
                Google로 로그인
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                아직 회원이 아니신가요?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
