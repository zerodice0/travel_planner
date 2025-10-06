import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, List, CheckCircle, ChevronRight } from 'lucide-react';

interface OnboardingSlide {
  illustration: React.ReactNode;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    illustration: (
      <div className="w-48 h-48 bg-primary-100 rounded-3xl flex items-center justify-center">
        <MapPin className="w-24 h-24 text-primary-600" />
      </div>
    ),
    title: '지도에서 장소를 찾아보세요',
    description: '방문하고 싶은 장소를 지도에 추가하고 한눈에 확인하세요',
  },
  {
    illustration: (
      <div className="w-48 h-48 bg-secondary-100 rounded-3xl flex items-center justify-center">
        <List className="w-24 h-24 text-secondary-600" />
      </div>
    ),
    title: '테마별로 장소를 정리하세요',
    description: '카페 투어, 맛집 탐방 등 나만의 목록을 만들어보세요',
  },
  {
    illustration: (
      <div className="w-48 h-48 bg-primary-100 rounded-3xl flex items-center justify-center">
        <CheckCircle className="w-24 h-24 text-primary-600" />
      </div>
    ),
    title: '여행의 기록을 남겨보세요',
    description: '방문한 장소를 체크하고 소감을 기록할 수 있어요',
  },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleSkip = () => {
    localStorage.setItem('travel-planner:onboarding-completed', 'true');
    localStorage.setItem(
      'travel-planner:onboarding-storage',
      JSON.stringify({
        completed: true,
        completedAt: new Date().toISOString(),
        version: '1.0',
      })
    );
    navigate('/login', { replace: true });
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      // Last slide - complete onboarding
      handleSkip();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientX ?? null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX ?? null);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          aria-label="온보딩 건너뛰기"
        >
          건너뛰기
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Screen reader announcement for current slide */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          슬라이드 {currentSlide + 1} / {slides.length}: {slides[currentSlide]?.title}
        </div>

        <div className="mb-12 transition-all duration-300 ease-out animate-fade-in" aria-hidden="true">
          {slides[currentSlide]?.illustration}
        </div>

        <h2 className="text-2xl font-bold text-foreground text-center mb-4 transition-all duration-300">
          {slides[currentSlide]?.title}
        </h2>

        <p className="text-muted-foreground text-center max-w-sm transition-all duration-300">
          {slides[currentSlide]?.description}
        </p>
      </div>

      {/* Indicators and Next Button */}
      <div className="pb-12 px-8">
        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-primary-600' : 'w-2 bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Next/Start Button */}
        <button
          onClick={handleNext}
          className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          aria-label={currentSlide === slides.length - 1 ? '온보딩 완료하고 시작하기' : '다음 슬라이드로 이동'}
        >
          {currentSlide === slides.length - 1 ? '시작하기' : '다음'}
          {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
