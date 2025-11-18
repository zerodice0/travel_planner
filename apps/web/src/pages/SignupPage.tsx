import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

/**
 * SignupPage - Clerk-based Sign Up
 *
 * Purpose: Provide user registration UI using Clerk's built-in SignUp component
 * Replaces the custom signup form with Clerk's fully-featured registration
 *
 * Features:
 * - Email/password registration with validation
 * - Social signup (Google, etc.) configured in Clerk Dashboard
 * - Email verification flow handled by Clerk
 * - Automatic session creation after signup
 * - Built-in password strength validation
 * - Responsive design matching application theme
 */
export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <Link to="/explore" className="inline-block">
            <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
          </Link>
          <p className="mt-2 text-muted-foreground">새로운 여행을 시작하세요</p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-lg',
              },
            }}
            routing="path"
            path="/signup"
            signInUrl="/login"
            redirectUrl="/map"
          />
        </div>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
