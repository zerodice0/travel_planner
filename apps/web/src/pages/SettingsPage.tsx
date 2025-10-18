import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Moon,
  Sun,
  Monitor,
  Bell,
  Tag,
  LogOut,
  Trash2,
  ChevronRight,
  FileText,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '#components/layout/AppLayout';
import { useAuth } from '#contexts/AuthContext';
import { useTheme, type Theme } from '#contexts/ThemeContext';
import { usersApi } from '#lib/api';

type Language = 'ko' | 'en';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'ko';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const savedNotifications = localStorage.getItem('notifications');
    return savedNotifications === 'true';
  });
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setShowThemeModal(false);
    toast.success('테마를 변경했습니다.');
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    setShowLanguageModal(false);
    toast.success('언어를 변경했습니다.');
  };

  const handleNotificationToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notifications', String(newValue));
    toast.success(newValue ? '알림을 켰습니다.' : '알림을 껐습니다.');
  };

  const handleLogout = () => {
    logout();
    toast.success('로그아웃 되었습니다.');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      // 계정 삭제 중임을 표시 (AuthContext의 토큰 만료 이벤트에서 토스트를 건너뛰기 위함)
      localStorage.setItem('isDeletingAccount', 'true');

      await usersApi.deleteAccount();
      logout();
      toast.success('계정이 삭제되었습니다.');
      navigate('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('계정 삭제에 실패했습니다.');
    } finally {
      // 플래그 제거
      localStorage.removeItem('isDeletingAccount');
    }
  };

  const getThemeLabel = (t: Theme) => {
    switch (t) {
      case 'light':
        return '라이트';
      case 'dark':
        return '다크';
      case 'system':
        return '시스템';
    }
  };

  const getThemeIcon = (t: Theme) => {
    switch (t) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'system':
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getLanguageLabel = (lang: Language) => {
    switch (lang) {
      case 'ko':
        return '한국어';
      case 'en':
        return 'English';
    }
  };

  return (
    <AppLayout title="설정">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 프로필 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.nickname}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-primary-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{user?.nickname}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <button
              onClick={() => navigate('/settings/profile')}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-lg transition-colors"
            >
              편집
            </button>
          </div>
        </section>

        {/* 앱 설정 */}
        <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <h3 className="px-6 py-4 text-sm font-semibold text-muted-foreground border-b border-border">
            앱 설정
          </h3>

          <button
            onClick={() => setShowThemeModal(true)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              {getThemeIcon(theme)}
              <span className="text-foreground">테마</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">{getThemeLabel(theme)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* <button
            onClick={() => setShowLanguageModal(true)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" />
              <span className="text-foreground">언어</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">{getLanguageLabel(language)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button> */}

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span className="text-foreground">알림</span>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-primary-600' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* 카테고리 관리 */}
        <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <button
            onClick={() => navigate('/categories')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5" />
              <span className="text-foreground">카테고리 관리</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </section>

        {/* 계정 */}
        <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <h3 className="px-6 py-4 text-sm font-semibold text-muted-foreground border-b border-border">
            계정
          </h3>

          <button
            onClick={() => setShowLogoutDialog(true)}
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-muted transition-colors border-b border-border"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">로그아웃</span>
          </button>

          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-muted transition-colors text-red-600"
          >
            <Trash2 className="w-5 h-5" />
            <span>계정 탈퇴</span>
          </button>
        </section>

        {/* 정보 */}
        <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <h3 className="px-6 py-4 text-sm font-semibold text-muted-foreground border-b border-border">
            정보
          </h3>

          <div className="px-6 py-4 flex items-center justify-between border-b border-border">
            <span className="text-foreground">버전</span>
            <span className="text-sm text-muted-foreground">v1.0.0</span>
          </div>

          <button
            onClick={() => window.open('/terms', '_blank')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span className="text-foreground">이용약관</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => window.open('/privacy', '_blank')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span className="text-foreground">개인정보 처리방침</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </section>
      </div>

      {/* 테마 선택 모달 */}
      {showThemeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowThemeModal(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-2xl md:rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">테마 선택</h2>
            <div className="space-y-2">
              {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`w-full px-4 py-3 text-left rounded-lg hover:bg-muted transition-colors flex items-center gap-3 ${
                    theme === t ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  {getThemeIcon(t)}
                  <span className="font-medium">{getThemeLabel(t)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 언어 선택 모달 */}
      {showLanguageModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowLanguageModal(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-2xl md:rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">언어 선택</h2>
            <div className="space-y-2">
              {(['ko', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full px-4 py-3 text-left rounded-lg hover:bg-muted transition-colors ${
                    language === lang ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <span className="font-medium">{getLanguageLabel(lang)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 로그아웃 확인 다이얼로그 */}
      {showLogoutDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowLogoutDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">로그아웃</h3>
            <p className="text-muted-foreground mb-4">정말 로그아웃 하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계정 탈퇴 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">계정 탈퇴</h3>
            <p className="text-muted-foreground mb-4">
              정말 탈퇴하시겠습니까?
              <br />
              <span className="text-sm text-red-600">모든 데이터가 영구적으로 삭제됩니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                탈퇴
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
