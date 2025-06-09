import { useState } from 'react';
import { Trip } from '@/entities/trip/types';
import { LocationPicker } from '@/widgets/location-picker/LocationPicker';

interface EditTripFormProps {
  trip: Trip;
  onSubmit: (tripData: Partial<Trip>) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

export function EditTripForm({ trip, onSubmit, loading, onCancel }: EditTripFormProps) {
  const [formData, setFormData] = useState({
    title: trip.title,
    description: trip.description || '',
    start_date: trip.start_date || '',
    end_date: trip.end_date || '',
    location: trip.location || '',
    is_public: trip.is_public,
    cover_image_url: trip.cover_image_url || '',
    initial_latitude: trip.initial_latitude,
    initial_longitude: trip.initial_longitude
  });

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    trip.initial_latitude && trip.initial_longitude
      ? { lat: trip.initial_latitude, lng: trip.initial_longitude }
      : null
  );

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setSelectedLocation({ lat: location.lat, lng: location.lng });
    setFormData(prev => ({
      ...prev,
      initial_latitude: location.lat,
      initial_longitude: location.lng,
      // 주소가 있으면 location 필드도 업데이트 (선택사항)
      location: location.address || prev.location
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('여행 제목을 입력해주세요.');
      return;
    }
    
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        location: formData.location || null,
        is_public: formData.is_public,
        cover_image_url: formData.cover_image_url || null,
        initial_latitude: formData.initial_latitude,
        initial_longitude: formData.initial_longitude
      });
    } catch (err) {
      console.error('폼 제출 오류:', err);
    }
  };

  const clearInitialLocation = () => {
    setSelectedLocation(null);
    setFormData(prev => ({
      ...prev,
      initial_latitude: null,
      initial_longitude: null
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              여행 제목 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              placeholder="예: 도쿄 여행, 유럽 배낭여행"
            />
          </div>
          
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              여행 설명
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              placeholder="여행에 대한 간단한 설명을 입력하세요."
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              여행 지역
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              placeholder="예: 서울, 부산, 도쿄, 파리"
            />
          </div>
          
          <div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">여행 일정</legend>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start_date" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="end_date" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </fieldset>
          </div>
          
          <div>
            <label htmlFor="cover_image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              커버 이미지 URL (선택사항)
            </label>
            <input
              type="url"
              id="cover_image_url"
              name="cover_image_url"
              value={formData.cover_image_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                이 여행을 공개로 설정
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              공개 여행은 링크가 있는 모든 사람이 볼 수 있습니다.
            </p>
          </div>
        </div>

        {/* 초기 위치 설정 */}
        <div className="col-span-2 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">지도 초기 위치 설정</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                여행 지도의 초기 중심점을 설정합니다. (선택사항)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
            >
              {showLocationPicker ? '위치 선택 닫기' : '위치 선택'}
            </button>
          </div>

          {selectedLocation && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    초기 위치가 설정되었습니다
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    위도: {selectedLocation.lat.toFixed(6)}, 경도: {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearInitialLocation}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                >
                  제거
                </button>
              </div>
            </div>
          )}

          {showLocationPicker && (
            <div className="mb-4">
              <LocationPicker
                initialCenter={
                  selectedLocation || 
                  (trip.initial_latitude && trip.initial_longitude 
                    ? { lat: trip.initial_latitude, lng: trip.initial_longitude }
                    : { lat: 37.5665, lng: 126.9780 })
                }
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}