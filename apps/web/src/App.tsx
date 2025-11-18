import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MapProviderProvider } from '#contexts/MapProviderContext';
import { ThemeProvider } from '#contexts/ThemeContext';
import ProtectedRoute from '#components/ProtectedRoute';
import AdminRoute from '#components/AdminRoute';
import LoginPage from '#pages/LoginPage';
import SignupPage from '#pages/SignupPage';
import ExplorePage from '#pages/ExplorePage';
import PublicPlaceDetailPage from '#pages/PublicPlaceDetailPage';
import StatsPage from '#pages/StatsPage';
import MapPage from '#pages/MapPage';
import PlaceDetailPage from '#pages/PlaceDetailPage';
import ListManagementPage from '#pages/ListManagementPage';
import ListDetailPage from '#pages/ListDetailPage';
import SearchPage from '#pages/SearchPage';
import CategoryManagementPage from '#pages/CategoryManagementPage';
import SettingsPage from '#pages/SettingsPage';
import ProfileEditPage from '#pages/ProfileEditPage';
import AdminModerationPage from '#pages/AdminModerationPage';

/**
 * App Component - Main application router with Clerk authentication
 *
 * Purpose: Configure application routing and global providers
 * Uses Clerk for authentication (ClerkProvider configured in main.tsx)
 *
 * Key Changes from Legacy Auth:
 * - Removed AuthProvider (replaced by Clerk's ClerkProvider in main.tsx)
 * - Removed custom auth routes (Google signup, email verification, password reset)
 * - Clerk handles all authentication flows internally
 * - ProtectedRoute and AdminRoute now use Clerk's SignedIn/SignedOut components
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MapProviderProvider>
          <Toaster position="top-center" />
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Splash/Onboarding redirects (deprecated) */}
              <Route path="/splash" element={<Navigate to="/explore" replace />} />
              <Route path="/onboarding" element={<Navigate to="/explore" replace />} />

              {/* Auth routes - Clerk components */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Legacy auth routes - redirect to Clerk equivalents */}
              <Route path="/signup/google" element={<Navigate to="/signup" replace />} />
              <Route path="/auth/callback" element={<Navigate to="/map" replace />} />
              <Route path="/verify-email" element={<Navigate to="/signup" replace />} />
              <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
              <Route path="/reset-password" element={<Navigate to="/login" replace />} />

              {/* Public routes */}
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/explore/places/:placeId" element={<PublicPlaceDetailPage />} />

              {/* Root redirect - go directly to explore */}
              <Route path="/" element={<Navigate to="/explore" replace />} />
              <Route path="/dashboard" element={<Navigate to="/map" replace />} />

              {/* Map page (hybrid: public explore + authenticated my places) */}
              <Route path="/map" element={<MapPage />} />

              {/* Protected routes - require Clerk authentication */}
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
                path="/settings/stats"
                element={
                  <ProtectedRoute>
                    <StatsPage />
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

              {/* Admin routes */}
              <Route
                path="/admin/moderation"
                element={
                  <AdminRoute>
                    <AdminModerationPage />
                  </AdminRoute>
                }
              />

              {/* 404 fallback - redirect to explore */}
              <Route path="*" element={<Navigate to="/explore" replace />} />
            </Routes>
          </div>
        </MapProviderProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
