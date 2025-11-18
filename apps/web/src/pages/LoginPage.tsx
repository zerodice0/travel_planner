import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

/**
 * LoginPage - Clerk-based Sign In
 *
 * Purpose: Provide authentication UI using Clerk's built-in SignIn component
 * Replaces the custom login form with Clerk's fully-featured authentication
 *
 * Features:
 * - Email/password authentication
 * - Social login (Google, etc.) configured in Clerk Dashboard
 * - Automatic session management
 * - Built-in validation and error handling
 * - Responsive design matching application theme
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <Link to="/explore" className="inline-block">
            <h1 className="text-4xl font-bold text-primary-600">Travel Planner</h1>
          </Link>
          <p className="mt-2 text-muted-foreground">여행 계획과 장소 관리를 위한 플래너</p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-lg',
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/signup"
            redirectUrl="/map"
          />
        </div>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            아직 회원이 아니신가요?{' '}
            <Link
              to="/signup"
              className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
