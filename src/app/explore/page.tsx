'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/shared/api/supabase';
import { Trip } from '@/entities/trip/types';

export default function ExplorePage() {
  const [publicTrips, setPublicTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicTrips = async () => {
      try {
        setLoading(true);
        
        // 공개된 여행 계획 가져오기
        const { data, error } = await supabase
          .from('trips')
          .select(`
            *,
            profiles(username, avatar_url)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPublicTrips(data || []);
      } catch (err) {
        console.error('공개 여행 불러오기 오류:', err);
        setError(err instanceof Error ? err.message : '여행 불러오기 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicTrips();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">여행 탐색</h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">여행 정보를 불러오는 중...</div>
        </div>
      ) : publicTrips.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">아직 공개된 여행 계획이 없습니다.</p>
          <Link 
            href="/trips/new" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition inline-block"
          >
            첫 여행 계획 공유하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicTrips.map((trip) => (
            <Link 
              href={`/trips/${trip.id}`} 
              key={trip.id}
              className="block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
            >
              <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center p-4">
                <h3 className="text-white text-xl font-semibold text-center">{trip.title}</h3>
              </div>
              <div className="p-4">
                {trip.description && (
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">{trip.description}</p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : '날짜 미정'}
                    {trip.end_date && ` - ${new Date(trip.end_date).toLocaleDateString()}`}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">{trip.profiles?.username || '사용자'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}