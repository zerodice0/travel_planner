'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTrips } from '@/entities/trip/hooks';
import { CreateTripForm } from '@/features/trip/create-trip/ui/CreateTripForm';
import { createTrip } from '@/features/trip/create-trip/model';
import { CreateTripData } from '@/entities/trip/types';

export default function TripSelectPage() {
  const router = useRouter();
  const { trips, loading: tripsLoading } = useTrips();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTrip = async (tripData: CreateTripData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newTrip = await createTrip(tripData);
      // 새로 생성된 여행의 장소 관리 페이지로 이동
      router.push(`/trips/${newTrip.id}/places`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (tripId: string) => {
    router.push(`/trips/${tripId}/places`);
  };

  if (tripsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">여행 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white mb-2">여행할 지역 선택</h1>
        <p className="text-gray-600 dark:text-gray-400">
          관심 장소를 관리할 여행을 선택하거나 새로운 여행을 계획해보세요.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {/* 새 여행 계획 만들기 버튼 */}
      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">➕</div>
            <h3 className="text-lg font-semibold dark:text-white">새 여행 계획 만들기</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              새로운 여행지의 관심 장소를 관리해보세요
            </p>
          </div>
        </button>
      </div>

      {/* 새 여행 계획 만들기 폼 */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-white">새 여행 계획</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <CreateTripForm 
            onSubmit={handleCreateTrip}
            loading={loading}
          />
        </div>
      )}

      {/* 기존 여행 목록 */}
      <div>
        <h2 className="text-xl font-semibold dark:text-white mb-4">기존 여행 계획</h2>
        
        {trips.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">✈️</div>
            <p className="text-lg font-medium mb-2">아직 여행 계획이 없습니다</p>
            <p>위의 버튼을 클릭하여 첫 여행 계획을 만들어보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => (
              <div
                key={trip.id}
                onClick={() => handleSelectTrip(trip.id)}
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
              >
                {trip.cover_image_url && (
                  <Image
                    src={trip.cover_image_url}
                    alt={trip.title}
                    className="w-full h-32 object-cover rounded-md mb-4"
                  />
                )}
                
                <h3 className="text-lg font-semibold dark:text-white mb-2">{trip.title}</h3>
                
                {trip.location && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">📍 {trip.location}</p>
                )}
                
                {trip.start_date && trip.end_date && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                    📅 {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                  </p>
                )}
                
                {trip.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{trip.description}</p>
                )}
                
                <div className="mt-4 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trip.is_completed 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {trip.is_completed ? '완료' : '계획 중'}
                  </span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(trip.created_at).toLocaleDateString()} 생성
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="mt-8 pt-6 border-t dark:border-gray-700">
        <div className="flex justify-between items-center">
          <Link 
            href="/places"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← 전체 관심 장소 보기
          </Link>
          
          <Link 
            href="/trips"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            모든 여행 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
} 