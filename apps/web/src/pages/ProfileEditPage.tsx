import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import Input from '#components/ui/Input';
import { useAuth } from '#contexts/AuthContext';
import { usersApi, uploadApi, type UpdateProfileData } from '#lib/api';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      // blob URL 필터링: blob URL이면 빈 문자열로 초기화
      const imageUrl = user.profileImage || '';
      setProfileImage(imageUrl.startsWith('blob:') ? '' : imageUrl);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.length < 2) {
      toast.error('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }

    if (nickname.length > 20) {
      toast.error('닉네임은 최대 20자까지 입력할 수 있습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const data: UpdateProfileData = {
        nickname: nickname.trim(),
        // profileImage는 업로드 시 이미 서버에 저장됨
      };

      const updatedUser = await usersApi.updateProfile(data);
      updateUser(updatedUser);
      toast.success('프로필을 수정했습니다.');
      navigate('/settings');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const message = error.response?.data?.message || '프로필 수정에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('JPEG, PNG, WebP 형식만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    try {
      // 압축 옵션 설정
      const options = {
        maxSizeMB: 1.8, // 최대 1.8MB (서버 제한 2MB보다 여유 있게)
        maxWidthOrHeight: 1200, // 최대 너비/높이
        useWebWorker: true, // Web Worker 사용 (성능 향상)
        fileType: 'image/webp', // WebP로 변환
      };

      // 이미지 압축
      toast.loading('이미지 최적화 중...', { id: 'compress' });
      const compressedFile = await imageCompression(file, options);
      toast.dismiss('compress');

      // 압축 결과 로그
      console.log(`원본: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`압축: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      // 서버로 업로드
      const result = await uploadApi.uploadProfileImage(compressedFile);
      setProfileImage(result.images.medium);
      updateUser({ ...user!, profileImage: result.images.medium });
      toast.success('이미지가 업로드되었습니다.');
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      const message = error.response?.data?.message || '이미지 업로드에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1 text-center mx-4">프로필 편집</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로필 이미지 */}
          <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="프로필"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                <label
                  htmlFor="profile-image"
                  className={`absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {isUploading ? '이미지 최적화 중...' : '프로필 사진을 변경하려면 클릭하세요'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP (자동으로 최적화됩니다)
              </p>
            </div>
          </section>

          {/* 닉네임 */}
          <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div>
              <Input
                type="text"
                label={
                  <>
                    닉네임 <span className="text-red-500">*</span>
                  </>
                }
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                fullWidth
                required
              />
              <p className="text-xs text-muted-foreground mt-1">{nickname.length}/20</p>
            </div>
          </section>

          {/* 이메일 (읽기 전용) */}
          <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div>
              <Input type="email" label="이메일" value={user?.email || ''} disabled fullWidth />
              <p className="text-xs text-muted-foreground mt-1">이메일은 변경할 수 없습니다.</p>
            </div>
          </section>

          {/* 저장 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
