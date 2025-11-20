import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, ExternalLink, ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { publicPlacesApi } from '#lib/api';
import type { PublicPlaceDetail } from '#types/publicPlace';
import toast from 'react-hot-toast';

const CATEGORIES = {
  restaurant: '음식점',
  cafe: '카페',
  attraction: '관광지',
  accommodation: '숙소',
  shopping: '쇼핑',
  culture: '문화시설',
  nature: '자연',
  etc: '기타',
};

export default function PublicPlaceDetailPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();
  const [place, setPlace] = useState<PublicPlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const fetchPlaceDetail = useCallback(async () => {
    if (!placeId) return;

    try {
      setIsLoading(true);
      const data = await publicPlacesApi.getOne(placeId);
      setPlace(data);
    } catch (error) {
      console.error('Failed to fetch place detail:', error);
      toast.error('장소 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    if (placeId) {
      fetchPlaceDetail();
    }
  }, [placeId, fetchPlaceDetail]);

  const handleBack = () => {
    navigate('/explore');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const handleMapClick = () => {
    if (place) {
      const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Travel Planner</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoginClick}
                  className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  로그인
                </button>
                <button
                  onClick={handleSignupClick}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  회원가입
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-xl mb-6"></div>
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">장소를 찾을 수 없습니다.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Travel Planner</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoginClick}
                className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                로그인
              </button>
              <button
                onClick={handleSignupClick}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          목록으로 돌아가기
        </button>

        {/* Photo Gallery */}
        {place.photos.length > 0 && (
          <div className="mb-8">
            <div className="relative w-full h-96 bg-muted rounded-xl overflow-hidden mb-4">
              <img
                src={place.photos[selectedPhotoIndex]}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            </div>

            {place.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {place.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedPhotoIndex === index
                        ? 'border-primary-500'
                        : 'border-border hover:border-primary-300'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${place.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Place Info */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{place.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
              {CATEGORIES[place.category as keyof typeof CATEGORIES] || place.category}
            </span>
          </div>

          {/* 리뷰 수 */}
          {place.reviewCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span>💬</span>
              <span>{place.reviewCount}명이 이 장소를 기록했습니다</span>
            </div>
          )}

          {/* 커스텀 라벨 */}
          {place.topLabels && place.topLabels.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">
                다른 사용자들은 이렇게 저장했습니다
              </p>
              <div className="flex flex-wrap gap-2">
                {place.topLabels.slice(0, 10).map((labelObj, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {labelObj.label}
                    <span className="text-xs text-gray-500">({labelObj.count})</span>
                  </span>
                ))}
              </div>
              {place.topLabels.length > 10 && (
                <button className="mt-2 text-sm text-primary-600 hover:underline">
                  더보기
                </button>
              )}
            </div>
          )}

          {/* Address */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-foreground">{place.address}</p>
                <button
                  onClick={handleMapClick}
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm mt-1 transition-colors"
                >
                  지도에서 보기
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Phone */}
            {place.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <a
                  href={`tel:${place.phone}`}
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {place.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 text-center text-white mb-6">
          <h3 className="text-2xl font-bold mb-4">이 장소를 내 여행 계획에 추가하세요</h3>
          <p className="text-lg mb-6 opacity-90">
            로그인하여 나만의 여행 계획을 만들고, 메모를 추가하고, 리뷰를 작성하세요.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleLoginClick}
              className="px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              로그인
            </button>
            <button
              onClick={handleSignupClick}
              className="px-6 py-3 bg-primary-600 text-white border-2 border-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              회원가입
            </button>
          </div>
        </div>

        {/* Reviews Section (Future Enhancement) */}
        {place.reviewCount > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">리뷰</h2>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                로그인하여 이 장소의 리뷰를 확인하세요
              </p>
              <button
                onClick={handleLoginClick}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                로그인하고 리뷰 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
