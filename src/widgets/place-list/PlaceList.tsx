import { useState } from 'react';
import { Place } from '@/entities/place/types';

interface PlaceListProps {
  places: Place[];
  onPlaceSelect?: (place: Place) => void;
  onPlaceDelete?: (id: string) => Promise<void>;
}

export function PlaceList({ places, onPlaceSelect, onPlaceDelete }: PlaceListProps) {
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedPlaceId(expandedPlaceId === id ? null : id);
  };

  const handleDelete = async (id: string) => {
    if (!onPlaceDelete) return;
    
    try {
      setDeletingId(id);
      await onPlaceDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (places.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>저장된 관심 장소가 없습니다.</p>
        <p className="mt-2 text-sm">지도에서 장소를 검색하여 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {places.map(place => (
        <div 
          key={place.id}
          className="border rounded-lg overflow-hidden shadow-sm bg-white"
        >
          <div 
            className="p-3 flex justify-between items-start cursor-pointer hover:bg-gray-50"
            onClick={() => {
              if (onPlaceSelect) onPlaceSelect(place);
              handleToggleExpand(place.id);
            }}
          >
            <div>
              <h3 className="font-medium">{place.name}</h3>
              <div className="flex items-center mt-1">
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full mr-2">
                  {place.category}
                </span>
                {place.rating && (
                  <div className="text-xs text-yellow-500">
                    {Array.from({ length: place.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-1">
              <button 
                className="p-1 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPlaceDelete) handleDelete(place.id);
                }}
                disabled={deletingId === place.id}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {expandedPlaceId === place.id && (
            <div className="p-3 border-t bg-gray-50">
              {place.address && (
                <p className="text-sm text-gray-600 mb-2">{place.address}</p>
              )}
              {place.notes && (
                <p className="text-sm mt-2">{place.notes}</p>
              )}
              <div className="mt-2 flex justify-end">
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => onPlaceSelect && onPlaceSelect(place)}
                >
                  지도에서 보기
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}