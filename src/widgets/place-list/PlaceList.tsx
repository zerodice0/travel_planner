import { useState } from 'react';
import { Place } from '@/entities/place/types';

interface PlaceListProps {
  places: Place[];
  selectedPlace: Place | null; // 선택된 장소 추가
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (id: string) => Promise<void>;
  onPlaceUpdate?: (place: Place) => Promise<void>; // 장소 업데이트 함수 추가
}

export function PlaceList({ places, selectedPlace, onPlaceSelect, onPlaceDelete, onPlaceUpdate }: PlaceListProps) {
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [newLabelValue, setNewLabelValue] = useState<string>("");

  const handleToggleExpand = (id: string) => {
    setExpandedPlaceId(expandedPlaceId === id ? null : id);
  };

  // 라벨 편집 시작 함수
  const handleStartEditLabel = (place: Place) => {
    setEditingLabelId(place.id);
    setNewLabelValue(place.custom_label || "");
  };

  // 라벨 저장 함수
  const handleSaveLabel = async (place: Place) => {
    if (!onPlaceUpdate) return;
    
    try {
      setEditingLabelId(null); // 먼저 편집 상태 해제
      
      // 전체 place 객체를 복사하고 라벨만 업데이트
      const updatedPlace = {
        ...place,
        custom_label: newLabelValue || '' // 빈 값이면 빈 문자열로 설정
      };
      
      console.log('라벨 업데이트 요청:', updatedPlace);
      await onPlaceUpdate(updatedPlace);
    } catch (error) {
      console.error("라벨 업데이트 중 오류 발생:", error);
      // 실패 시 편집 모드 유지
      setEditingLabelId(place.id);
      alert('라벨 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 라벨 편집 취소 함수
  const handleCancelEditLabel = () => {
    setEditingLabelId(null);
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
          className={`border rounded-lg overflow-hidden shadow-sm ${
            selectedPlace?.id === place.id ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <div 
            className="p-3 flex justify-between items-start cursor-pointer hover:bg-gray-50"
            onClick={() => {
              // 라벨 편집 중일 때는 클릭 이벤트 무시
              if (editingLabelId !== place.id) {
                onPlaceSelect(place); // 장소 선택 이벤트 발생
                handleToggleExpand(place.id);
              }
            }}
          >
            <div>
              <h3 className="font-medium">
                {place.name}
                {editingLabelId === place.id ? (
                  <div className="mt-1 flex items-center">
                    <input
                      type="text"
                      value={newLabelValue}
                      onChange={(e) => setNewLabelValue(e.target.value)}
                      className="text-xs px-2 py-1 border rounded-md"
                      placeholder="라벨 입력..."
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveLabel(place);
                      }}
                      className="ml-1 text-xs text-green-600 hover:text-green-800"
                    >
                      저장
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEditLabel();
                      }}
                      className="ml-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    {place.custom_label ? (
                      <div className="inline-flex items-center ml-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {place.custom_label}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditLabel(place);
                          }}
                          className="ml-1 text-xs text-gray-400 hover:text-gray-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditLabel(place);
                        }}
                        className="ml-2 text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded-full border border-dashed border-gray-300"
                      >
                        라벨 추가
                      </button>
                    )}
                  </>
                )}
              </h3>
              <div className="flex items-center mt-1">
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full mr-2">
                  {place.category}
                </span>
                {place.rating && place.rating > 0 && (
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
                  e.stopPropagation(); // 버블링 방지
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
                <p className="text-sm mt-2 whitespace-pre-wrap">{place.notes}</p>
              )}
              <div className="mt-2 flex justify-end">
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => onPlaceSelect(place)}
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