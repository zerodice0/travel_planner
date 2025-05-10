// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/shared/api/supabase';
import { Trip } from '@/entities/trip/types';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);

  useEffect(() => {
    // 인증된 사용자 확인
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // 최근 여행 목록 가져오기 (최대 3개)
          const { data } = await supabase
            .from('trips')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          
          setRecentTrips(data || []);
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  // 로그인한 사용자에게 보여줄 화면
  if (user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">안녕하세요, {user.email || '여행자'} 님!</h1>
            <p className="mt-2 text-gray-600">오늘은 어떤 여행을 계획해볼까요?</p>
          </div>
          <Link 
            href="/trips/new" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            새 여행 만들기
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 p-2 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </span>
              관심 장소 관리
            </h2>
            <p className="text-gray-600 mb-4">
              방문하고 싶은 장소를 미리 저장하고 관리하세요. 카테고리별로 정리하고 메모를 추가할 수 있습니다.
            </p>
            <Link 
              href="/places" 
              className="text-blue-600 font-medium hover:text-blue-800 flex items-center"
            >
              관심 장소 보기
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-green-100 text-green-700 p-2 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </span>
              여행 계획
            </h2>
            <p className="text-gray-600 mb-4">
              여행 일정을 계획하고 관리하세요. 저장한 관심 장소들을 바탕으로 효율적인 여행 계획을 세워보세요.
            </p>
            <Link 
              href="/trips" 
              className="text-green-600 font-medium hover:text-green-800 flex items-center"
            >
              여행 계획 목록
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">최근 여행</h2>
          
          {recentTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentTrips.map(trip => (
                <Link 
                  key={trip.id} 
                  href={`/trips/${trip.id}`}
                  className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
                >
                  <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center p-4">
                    <h3 className="text-white text-xl font-semibold text-center">{trip.title}</h3>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{trip.start_date ? new Date(trip.start_date).toLocaleDateString() : '날짜 미정'}</span>
                      <span>{trip.is_completed ? '완료됨' : '진행 중'}</span>
                    </div>
                    {trip.description && (
                      <p className="mt-2 text-sm text-gray-700 line-clamp-2">{trip.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-600 mb-4">아직 여행 계획이 없습니다.</p>
              <Link 
                href="/trips/new" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
              >
                첫 여행 계획 만들기
              </Link>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">탐색하기</h2>
          <p className="text-gray-600 mb-4">다른 여행자들의 공개된 여행 계획을 탐색하고 아이디어를 얻어보세요.</p>
          <Link 
            href="/explore" 
            className="text-blue-600 font-medium hover:text-blue-800 flex items-center"
          >
            여행 탐색하기
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </main>
    );
  }

  // 로그인하지 않은 사용자에게 보여줄 랜딩 페이지
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-6">
            여행을 더 특별하게, 더 쉽게
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
            목적지를 탐색하고, 장소를 정리하고, 여행 경로를 계획하세요. 
            모든 여행 기록을 한 곳에서 관리할 수 있습니다.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              href="/register" 
              className="px-8 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition shadow-md w-full sm:w-auto"
            >
              무료로 시작하기
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-3 bg-white text-blue-600 border border-blue-200 rounded-md text-lg font-medium hover:bg-blue-50 transition shadow-sm w-full sm:w-auto"
            >
              로그인하기
            </Link>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-500 text-3xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">체계적인 계획</h3>
            <p className="text-gray-600">
              음식점, 관광 명소, 숙소 등을 카테고리별로 관리하고 효율적인 동선을 계획하세요.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-500 text-3xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">지도 기반 관리</h3>
            <p className="text-gray-600">
              모든 장소를 지도에서 한눈에 확인하고, 위치 기반으로 다음 목적지를 쉽게 결정하세요.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-500 text-3xl mb-4">📸</div>
            <h3 className="text-xl font-semibold mb-2">추억 기록</h3>
            <p className="text-gray-600">
              여행 중 방문한 장소에 사진과 메모를 남기고, 여행이 끝난 후에도 소중한 추억을 간직하세요.
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">왜 다른 서비스와 다른가요?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md text-left">
              <h3 className="text-lg font-semibold mb-2">📍 관심 장소와 여행 계획 분리</h3>
              <p className="text-gray-600">
                방문하고 싶은 장소를 먼저 저장하고, 이후 실제 여행 계획에 활용할 수 있어 더 유연한 계획이 가능합니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-left">
              <h3 className="text-lg font-semibold mb-2">📱 실시간 위치 기반 추천</h3>
              <p className="text-gray-600">
                여행 중에 현재 위치를 기준으로 가까운 관심 장소를 추천받아 더 효율적인 여행이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}