import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '#contexts/AuthContext';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const checkOnboardingAndNavigate = () => {
      // Check if splash was already shown in this session
      sessionStorage.getItem('travel-planner:splash-shown');

      // Check if onboarding is completed
      const onboardingCompleted = localStorage.getItem('travel-planner:onboarding-completed');

      // Mark splash as shown for this session
      sessionStorage.setItem('travel-planner:splash-shown', 'true');

      if (user) {
        // Logged in user → Dashboard
        navigate('/dashboard', { replace: true });
      } else if (onboardingCompleted === 'true') {
        // Not logged in but onboarding completed → Explore page (public access)
        navigate('/explore', { replace: true });
      } else {
        // First visit → Onboarding
        navigate('/onboarding', { replace: true });
      }
    };

    // Wait for auth loading to complete
    if (isLoading) return;

    // Check if splash was already shown in this session (skip animation)
    const splashShown = sessionStorage.getItem('travel-planner:splash-shown');
    if (splashShown) {
      checkOnboardingAndNavigate();
      return;
    }

    // Start fade out animation after 1.7 seconds
    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1700);

    // Navigate after 2 seconds
    const navigationTimer = setTimeout(() => {
      checkOnboardingAndNavigate();
    }, 2000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(navigationTimer);
    };
  }, [user, isLoading, navigate]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex flex-col items-center justify-center transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo */}
      <div className="animate-fade-in">
        <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <Compass className="w-16 h-16 text-primary-600" />
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl font-bold text-white text-center mb-2">Travel Planner</h1>
        <p className="text-primary-100 text-center text-lg">여행의 모든 순간을 기록하세요</p>

        {/* Loading Indicator */}
        <div className="mt-12 flex justify-center">
          <div className="flex space-x-2">
            <div
              className="w-3 h-3 bg-card rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-3 h-3 bg-card rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-3 h-3 bg-card rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
