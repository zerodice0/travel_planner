import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '#contexts/AuthContext';
import { MapProviderProvider } from '#contexts/MapProviderContext';
import { ThemeProvider } from '#contexts/ThemeContext';
import ProtectedRoute from '#components/ProtectedRoute';
import { EmailVerificationRequiredModal } from '#components/modals/EmailVerificationRequiredModal';
import { emailVerificationRequiredEvent } from '#lib/api';
import SplashScreen from '#pages/SplashScreen';
import OnboardingScreen from '#pages/OnboardingScreen';
import LoginPage from '#pages/LoginPage';
import SignupPage from '#pages/SignupPage';
import GoogleSignupPage from '#pages/GoogleSignupPage';
import AuthCallbackPage from '#pages/AuthCallbackPage';
import EmailVerificationPage from '#pages/EmailVerificationPage';
import ForgotPasswordPage from '#pages/ForgotPasswordPage';
import ResetPasswordPage from '#pages/ResetPasswordPage';
import ExplorePage from '#pages/ExplorePage';
import PublicPlaceDetailPage from '#pages/PublicPlaceDetailPage';
import DashboardPage from '#pages/DashboardPage';
import MapPage from '#pages/MapPage';
import PlaceDetailPage from '#pages/PlaceDetailPage';
import ListManagementPage from '#pages/ListManagementPage';
import ListDetailPage from '#pages/ListDetailPage';
import SearchPage from '#pages/SearchPage';
import CategoryManagementPage from '#pages/CategoryManagementPage';
import SettingsPage from '#pages/SettingsPage';
import ProfileEditPage from '#pages/ProfileEditPage';

// EmailVerificationModalWrapper to access user from AuthContext
function EmailVerificationModalWrapper({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <EmailVerificationRequiredModal
      isOpen={isOpen}
      onClose={onClose}
      userEmail={user.email}
    />
  );
}

// Root redirect component based on auth state
function RootRedirect() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Redirect to splash, which will handle further navigation
  return <Navigate to="/splash" replace />;
}

function App() {
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);

  useEffect(() => {
    const handleEmailVerificationRequired = () => {
      setShowEmailVerificationModal(true);
    };

    emailVerificationRequiredEvent.addEventListener('required', handleEmailVerificationRequired);

    return () => {
      emailVerificationRequiredEvent.removeEventListener('required', handleEmailVerificationRequired);
    };
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MapProviderProvider>
            <Toaster position="top-center" />
            <EmailVerificationModalWrapper
              isOpen={showEmailVerificationModal}
              onClose={() => setShowEmailVerificationModal(false)}
            />
            <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/signup/google" element={<GoogleSignupPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/explore/places/:placeId" element={<PublicPlaceDetailPage />} />
              <Route path="/" element={<RootRedirect />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/places/:id"
                element={
                  <ProtectedRoute>
                    <PlaceDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lists"
                element={
                  <ProtectedRoute>
                    <ListManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lists/:id"
                element={
                  <ProtectedRoute>
                    <ListDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <CategoryManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/profile"
                element={
                  <ProtectedRoute>
                    <ProfileEditPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/splash" replace />} />
            </Routes>
            </div>
          </MapProviderProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
