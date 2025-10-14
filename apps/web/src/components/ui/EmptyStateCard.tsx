import {
  Coffee,
  Utensils,
  Landmark,
  Hotel,
  ShoppingBag,
  Theater,
  TreePine,
  MapPin,
  LogIn,
  Plus
} from 'lucide-react';

interface EmptyStateCardProps {
  category: string;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onAddPlace: () => void;
}

interface CategoryConfig {
  icon: typeof MapPin;
  iconColor: string;
  iconBgColor: string;
  title: string;
  message: string;
}

const categoryConfigs: Record<string, CategoryConfig> = {
  cafe: {
    icon: Coffee,
    iconColor: 'text-amber-600',
    iconBgColor: 'bg-amber-50',
    title: '아직 등록된 카페가 없습니다',
    message: '멋진 카페를 추가하고 여행자들과 공유해보세요!',
  },
  restaurant: {
    icon: Utensils,
    iconColor: 'text-orange-600',
    iconBgColor: 'bg-orange-50',
    title: '아직 등록된 음식점이 없습니다',
    message: '맛집을 추가하고 여행자들을 도와주세요!',
  },
  attraction: {
    icon: Landmark,
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-50',
    title: '아직 등록된 관광지가 없습니다',
    message: '숨은 명소를 추가하고 소개해주세요!',
  },
  accommodation: {
    icon: Hotel,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-50',
    title: '아직 등록된 숙소가 없습니다',
    message: '편안한 숙소를 추가하고 추천해주세요!',
  },
  shopping: {
    icon: ShoppingBag,
    iconColor: 'text-pink-600',
    iconBgColor: 'bg-pink-50',
    title: '아직 등록된 쇼핑 장소가 없습니다',
    message: '인기 쇼핑 스팟을 추가하고 공유해보세요!',
  },
  culture: {
    icon: Theater,
    iconColor: 'text-indigo-600',
    iconBgColor: 'bg-indigo-50',
    title: '아직 등록된 문화시설이 없습니다',
    message: '문화 체험 장소를 추가하고 알려주세요!',
  },
  nature: {
    icon: TreePine,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-50',
    title: '아직 등록된 자연 명소가 없습니다',
    message: '아름다운 자연을 추가하고 소개해주세요!',
  },
  etc: {
    icon: MapPin,
    iconColor: 'text-gray-600',
    iconBgColor: 'bg-gray-50',
    title: '아직 등록된 장소가 없습니다',
    message: '특별한 장소를 추가하고 추천해주세요!',
  },
};

const defaultConfig: CategoryConfig = {
  icon: MapPin,
  iconColor: 'text-primary-600',
  iconBgColor: 'bg-primary-50',
  title: '아직 등록된 장소가 없습니다',
  message: '장소를 추가하고 여행 커뮤니티를 시작해보세요!',
};

export function EmptyStateCard({
  category,
  isAuthenticated,
  onLoginClick,
  onAddPlace
}: EmptyStateCardProps) {
  const config = category ? (categoryConfigs[category] || defaultConfig) : defaultConfig;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-md mx-auto">
      {/* Icon */}
      <div className={`w-20 h-20 rounded-full ${config.iconBgColor} flex items-center justify-center mb-6 shadow-sm`}>
        <Icon className={`w-10 h-10 ${config.iconColor}`} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-foreground text-center mb-3">
        {config.title}
      </h3>

      {/* Message */}
      <p className="text-muted-foreground text-center mb-8 leading-relaxed">
        {config.message}
      </p>

      {/* CTA Button */}
      <div className="w-full">
        {isAuthenticated ? (
          <button
            onClick={onAddPlace}
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            첫 장소 추가하기
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            로그인하고 장소 추가하기
          </button>
        )}
      </div>
    </div>
  );
}
