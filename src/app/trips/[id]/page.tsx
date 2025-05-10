'use client';

import { useParams } from 'next/navigation';
import { useTrip } from '@/entities/trip/hooks';
import { useVisits } from '@/entities/visit/hooks';
import { TripTimeline } from '@/widgets/trip-timeline/TripTimeline';
import { TripRoute } from '@/widgets/trip-route/TripRoute';
import { MediaGallery } from '@/widgets/media-gallery/MediaGallery';

export default function TripDetailPage() {
  const { id } = useParams();
  const { trip, loading: tripLoading } = useTrip(id as string);
  const { visits, loading: visitsLoading } = useVisits(id as string);
  
  if (tripLoading || visitsLoading) {
    return <div className="p-6">로딩 중...</div>;
  }
  
  if (!trip) {
    return <div className="p-6">여행 정보를 찾을 수 없습니다.</div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{trip.title}</h1>
        <p className="text-gray-600">
          {trip.start_date} - {trip.end_date} • {trip.location}
        </p>
        {trip.description && (
          <p className="mt-2">{trip.description}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">여행 경로</h2>
            </div>
            <div className="h-[500px]">
              <TripRoute visits={visits} />
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">타임라인</h2>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              <TripTimeline visits={visits} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">사진 & 기록</h2>
        <MediaGallery tripId={id as string} />
      </div>
      
      <div className="mt-8 flex justify-between">
        <button className="px-4 py-2 border rounded hover:bg-gray-50">
          PDF로 내보내기
        </button>
        
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded mr-2">
            여행 공유
          </button>
          <button className="px-4 py-2 border rounded hover:bg-gray-50">
            편집
          </button>
        </div>
      </div>
    </div>
  );
}