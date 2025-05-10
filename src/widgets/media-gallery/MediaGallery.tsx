import { useState } from 'react';
import { useTripMedia } from '@/entities/media/hooks';

interface MediaGalleryProps {
  tripId: string;
}

export function MediaGallery({ tripId }: MediaGalleryProps) {
  const { media, loading, error } = useTripMedia(tripId);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  
  if (loading) {
    return <div className="text-center py-4">미디어를 불러오는 중...</div>;
  }
  
  if (error) {
    return <div className="text-center py-4 text-red-500">미디어를 불러오는 중 오류가 발생했습니다.</div>;
  }
  
  if (media.length === 0) {
    return <div className="text-center py-4 text-gray-500">아직 업로드된 사진이나 동영상이 없습니다.</div>;
  }
  
  // 선택된 미디어 찾기
  const selectedMedia = selectedMediaId ? media.find(item => item.id === selectedMediaId) : null;
  
  return (
    <div>
      {/* 미디어 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {media.map(item => (
          <div 
            key={item.id}
            className="aspect-square overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition"
            onClick={() => setSelectedMediaId(item.id)}
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.caption || '방문 사진'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 선택된 미디어 상세 보기 */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl max-h-full flex flex-col">
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setSelectedMediaId(null)}
                className="text-white hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-black overflow-hidden rounded-lg">
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.caption || '방문 사진'}
                  className="max-h-[80vh] max-w-full"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-h-[80vh] max-w-full"
                />
              )}
            </div>
            
            {selectedMedia.caption && (
              <div className="mt-2 text-white px-2">
                {selectedMedia.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}