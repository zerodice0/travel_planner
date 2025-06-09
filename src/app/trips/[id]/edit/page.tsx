'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTrip, useTrips } from '@/entities/trip/hooks';
import { EditTripForm } from '@/features/trip/edit-trip/ui/EditTripForm';
import { Trip } from '@/entities/trip/types';

export default function EditTripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  
  const { trip, loading: tripLoading, error } = useTrip(tripId);
  const { updateTrip, loading: updateLoading } = useTrips();

  const handleSubmit = async (tripData: Partial<Trip>) => {
    try {
      await updateTrip(tripId, tripData);
      router.push(`/trips/${tripId}`);
    } catch (err) {
      console.error('여행 수정 실패:', err);
      alert('여행 정보 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancel = () => {
    router.push(`/trips/${tripId}`);
  };

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-600 dark:text-gray-400">여행 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            여행을 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            존재하지 않거나 접근 권한이 없는 여행입니다.
          </p>
          <button
            onClick={() => router.push('/trips')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            여행 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                여행 정보 수정
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {trip.title}의 정보를 수정합니다
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <EditTripForm
          trip={trip}
          onSubmit={handleSubmit}
          loading={updateLoading}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}