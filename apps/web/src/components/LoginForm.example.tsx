import React, { useState, FormEvent } from 'react';
import { Input, Button, Checkbox } from './ui';

/**
 * Example usage of the UI components in a login form
 * This file demonstrates how to use Input, Button, and Checkbox components
 */
const LoginFormExample: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Simple validation
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        console.log('Login attempt:', { email, password, rememberMe });
        setLoading(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center">로그인</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            여행 플래너에 오신 것을 환영합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              type="email"
              label="이메일"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              fullWidth
              autoComplete="email"
            />

            <Input
              type="password"
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              fullWidth
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              label="로그인 상태 유지"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />

            <a href="#" className="text-sm text-[#4A90E2] hover:text-[#2E5C8A]">
              비밀번호 찾기
            </a>
          </div>

          <div className="space-y-3">
            <Button type="submit" variant="primary" loading={loading} fullWidth>
              로그인
            </Button>

            <Button type="button" variant="secondary" fullWidth>
              회원가입
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginFormExample;
