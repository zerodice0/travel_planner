// src/widgets/visit-form/VisitForm.tsx
import { useState } from 'react';
import { useVisits } from '@/entities/visit/hooks';
import { useMedia } from '@/entities/media/hooks';
import { Place } from '@/entities/place/types';

interface VisitFormProps {
  tripId: string;
  place: Place;
  onComplete: () => void;
  onCancel: () => void;
}

export function VisitForm({ tripId, place, onComplete, onCancel }: VisitFormProps) {
  const { createVisit } = useVisits(tripId);
  const { uploadMedia } = useMedia();
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 1. 방문 기록 생성
      const visit = await createVisit({
        trip_id: tripId,
        place_id: place.id,
        custom_place_name: null,
        custom_place_lat: null,
        custom_place_lng: null,
        visit_time: new Date().toISOString(),
        notes,
        rating
      });
      
      // 2. 미디어 업로드
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(file => {
          const fileType = file.type.startsWith('image/') ? 'image' : 'video';
          return uploadMedia({
            visit_id: visit.id,
            file,
            type: fileType as 'image' | 'video',
            caption: ''
          });
        });
        
        await Promise.all(uploadPromises);
      }
      
      onComplete();
    } catch (err) {
      console.error('방문 기록 저장 오류:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2 bg-red-50 text-red-700 text-sm rounded">
          {error}
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-medium">{place.name}</h3>
        <p className="text-sm text-gray-500">{place.address}</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">평점</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">방문 감상</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded"
          placeholder="이곳에 대한 감상을 기록하세요..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">사진/동영상</label>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => {
            if (e.target.files) {
              setMediaFiles(Array.from(e.target.files));
            }
          }}
          className="w-full"
        />
        {mediaFiles.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {mediaFiles.map((file, index) => (
              <div key={index} className="w-20 h-20 relative">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="미리보기"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                    <span className="text-xs">Video</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
          disabled={loading}
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? '저장 중...' : '방문 기록 저장'}
        </button>
      </div>
    </form>
  );
}