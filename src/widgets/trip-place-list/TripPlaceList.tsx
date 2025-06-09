'use client';

import { useState, useRef } from 'react';
import { TripPlace } from '@/entities/trip-place/types';
import { Place } from '@/entities/place/types';

interface TripPlaceListProps {
  tripPlaces: TripPlace[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place | null) => void;
  onTripPlaceRemove: (tripPlaceId: string) => Promise<void>;
  onTripPlaceUpdate?: (tripPlace: TripPlace) => Promise<void>;
}

export function TripPlaceList({ 
  tripPlaces, 
  selectedPlace, 
  onPlaceSelect, 
  onTripPlaceRemove,
  onTripPlaceUpdate
}: TripPlaceListProps) {
  const [expandedTripPlaceId, setExpandedTripPlaceId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [newLabelValue, setNewLabelValue] = useState<string>("");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [newNotesValue, setNewNotesValue] = useState<string>("");
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    tripPlaceId: string;
    placeName: string;
  }>({
    isOpen: false,
    tripPlaceId: '',
    placeName: ''
  });
  
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedTripPlaceId(expandedTripPlaceId === id ? null : id);
  };

  // 삭제 확인 다이얼로그 열기
  const openDeleteConfirmDialog = (tripPlaceId: string, placeName: string) => {
    setDeleteConfirmDialog({
      isOpen: true,
      tripPlaceId,
      placeName
    });
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  // 삭제 확인 다이얼로그 닫기
  const closeDeleteConfirmDialog = () => {
    setDeleteConfirmDialog({
      isOpen: false,
      tripPlaceId: '',
      placeName: ''
    });
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  // 실제 삭제 실행
  const executeDelete = async () => {
    if (!deleteConfirmDialog.tripPlaceId) return;
    
    try {
      await onTripPlaceRemove(deleteConfirmDialog.tripPlaceId);
      closeDeleteConfirmDialog();
    } catch (error) {
      console.error('삭제 중 오류 발생:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 커스텀 라벨 편집 시작
  const handleStartEditLabel = (tripPlace: TripPlace) => {
    setEditingLabelId(tripPlace.id);
    setNewLabelValue(tripPlace.custom_label || "");
  };

  // 커스텀 라벨 저장
  const handleSaveLabel = async (tripPlace: TripPlace) => {
    if (!onTripPlaceUpdate) return;
    
    try {
      setEditingLabelId(null);
      
      const updatedTripPlace = {
        ...tripPlace,
        custom_label: newLabelValue || null
      };
      
      await onTripPlaceUpdate(updatedTripPlace);
    } catch (error) {
      console.error("라벨 업데이트 중 오류 발생:", error);
      setEditingLabelId(tripPlace.id);
      alert('라벨 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 커스텀 라벨 편집 취소
  const handleCancelEditLabel = () => {
    setEditingLabelId(null);
  };

  // 메모 편집 시작
  const handleStartEditNotes = (tripPlace: TripPlace) => {
    setEditingNotesId(tripPlace.id);
    setNewNotesValue(tripPlace.notes || "");
  };

  // 메모 저장
  const handleSaveNotes = async (tripPlace: TripPlace) => {
    if (!onTripPlaceUpdate) return;
    
    try {
      setEditingNotesId(null);
      
      const updatedTripPlace = {
        ...tripPlace,
        notes: newNotesValue || null
      };
      
      await onTripPlaceUpdate(updatedTripPlace);
    } catch (error) {
      console.error("메모 업데이트 중 오류 발생:", error);
      setEditingNotesId(tripPlace.id);
      alert('메모 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 메모 편집 취소
  const handleCancelEditNotes = () => {
    setEditingNotesId(null);
  };

  // 주소 복사
  const copyAddressToClipboard = (id: string, address: string | null) => {
    if (!address) return;
    
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddressId(id);
      setTimeout(() => setCopiedAddressId(null), 2000);
    }).catch(err => {
      console.error('주소 복사 실패:', err);
      alert('주소 복사에 실패했습니다.');
    });
  };

  // 구글맵으로 장소 열기
  const openInGoogleMaps = (place: Place) => {
    if (!place) return;
    
    const userAgent = navigator.userAgent || navigator.vendor || '';
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    
    let googleMapsUrl = '';
    
    if (isMobile) {
      if (/android/i.test(userAgent)) {
        googleMapsUrl = `geo:${place.latitude},${place.longitude}?q=${encodeURIComponent(place.name || place.address || '')}`;
      } else {
        googleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(place.name || place.address || '')}&ll=${place.latitude},${place.longitude}`;
      }
    } else {
      googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    }
    
    try {
      window.open(googleMapsUrl, '_blank');
    } catch (error) {
      console.error('지도 앱을 열 수 없습니다:', error);
      const webFallbackUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
      window.open(webFallbackUrl, '_blank');
    }
  };

  if (tripPlaces.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-4">📍</div>
        <p>아직 추가된 장소가 없습니다.</p>
        <p className="mt-2 text-sm">장소 추가 버튼을 클릭하여 관심 장소를 추가해보세요.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tripPlaces.map(tripPlace => (
        <div 
          key={tripPlace.id}
          className={`border rounded-lg overflow-hidden shadow-sm ${
            selectedPlace?.id === tripPlace.places_of_interest?.id 
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' 
              : 'bg-white dark:bg-gray-800 dark:border-gray-700'
          } transition-colors`}
        >
          {/* 메인 컨텐츠 */}
          <div 
            className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => {
              handleToggleExpand(tripPlace.id);
              onPlaceSelect(tripPlace.places_of_interest || null);
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium dark:text-white truncate">
                  {tripPlace.custom_label || tripPlace.places_of_interest?.name}
                </h3>
                {tripPlace.custom_label && tripPlace.places_of_interest?.name !== tripPlace.custom_label && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    원래 이름: {tripPlace.places_of_interest?.name}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full dark:text-gray-300">
                    {tripPlace.places_of_interest?.category}
                  </span>
                  
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tripPlace.status === 'visited' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : tripPlace.status === 'cancelled'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {tripPlace.status === 'planned' ? '계획' : tripPlace.status === 'visited' ? '방문' : '취소'}
                  </span>
                </div>
                
                {tripPlace.notes && (
                  <div className="mt-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 markdown-content markdown-inherit-color">
                      <span className="font-medium">메모: </span>
                      <div className="inline" dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(tripPlace.notes) }} />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {expandedTripPlaceId === tripPlace.id ? '▼' : '▶'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteConfirmDialog(
                      tripPlace.id, 
                      tripPlace.custom_label || tripPlace.places_of_interest?.name || '이 장소'
                    );
                  }}
                  className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                  title="여행에서 제거"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          {/* 아코디언 상세 정보 */}
          {expandedTripPlaceId === tripPlace.id && (
            <div className="px-3 pb-3 bg-gray-50 dark:bg-gray-700/30">
              <div className="border-t dark:border-gray-600 pt-3 space-y-3">
                {/* 커스텀 라벨 섹션 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      커스텀 라벨
                    </label>
                    {editingLabelId !== tripPlace.id && onTripPlaceUpdate && (
                      <button 
                        onClick={() => handleStartEditLabel(tripPlace)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        편집
                      </button>
                    )}
                  </div>
                  
                  {editingLabelId === tripPlace.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLabelValue}
                        onChange={(e) => setNewLabelValue(e.target.value)}
                        className="flex-1 text-sm p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="커스텀 라벨 입력..."
                      />
                      <button
                        onClick={() => handleSaveLabel(tripPlace)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelEditLabel}
                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tripPlace.custom_label || '설정되지 않음'}
                    </p>
                  )}
                </div>

                {/* 메모 섹션 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      메모
                    </label>
                    {editingNotesId !== tripPlace.id && onTripPlaceUpdate && (
                      <button 
                        onClick={() => handleStartEditNotes(tripPlace)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        편집
                      </button>
                    )}
                  </div>
                  
                  {editingNotesId === tripPlace.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={newNotesValue}
                        onChange={(e) => setNewNotesValue(e.target.value)}
                        rows={3}
                        className="w-full text-sm p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="메모를 입력하세요... (마크다운 지원: **볼드**, *이탤릭*, ```코드```, # 제목, - 목록)"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveNotes(tripPlace)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEditNotes}
                          className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {tripPlace.notes ? (
                        <div className="markdown-content markdown-inherit-color">
                          <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(tripPlace.notes) }} />
                        </div>
                      ) : (
                        '메모가 없습니다.'
                      )}
                    </div>
                  )}
                </div>

                {/* 장소 정보 */}
                {tripPlace.places_of_interest && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">주소</label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {tripPlace.places_of_interest.address || '주소 정보 없음'}
                        </p>
                        {tripPlace.places_of_interest.address && (
                          <button
                            onClick={() => copyAddressToClipboard(tripPlace.id, tripPlace.places_of_interest?.address || null)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              copiedAddressId === tripPlace.id
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                            }`}
                          >
                            {copiedAddressId === tripPlace.id ? '복사됨!' : '복사'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {tripPlace.places_of_interest && (
                        <button
                          onClick={() => openInGoogleMaps(tripPlace.places_of_interest!)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          🗺️ 지도에서 보기
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <dialog 
        ref={dialogRef}
        className="backdrop:bg-black backdrop:bg-opacity-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-0 p-0 max-w-sm w-full"
        onClick={(e) => {
          // backdrop 클릭 시 다이얼로그 닫기
          if (e.target === e.currentTarget) {
            closeDeleteConfirmDialog();
          }
        }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                장소 제거 확인
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                이 작업은 되돌릴 수 없습니다
              </p>
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            <strong>{deleteConfirmDialog.placeName}</strong>을(를) 여행에서 제거하시겠습니까?
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={closeDeleteConfirmDialog}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={executeDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              제거하기
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

// 마크다운을 HTML로 변환하는 함수
function parseMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';
  
  // 줄바꿈을 임시로 다른 문자열로 대체
  let html = markdown.replace(/\r\n|\n\r|\n|\r/g, '\n');
  
  // 코드 블록 (```..```) - 이 부분이 다른 정규식에 영향을 주지 않도록 먼저 처리
  html = html.replace(/```([\s\S]*?)```/gm, function(_, code) {
    return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });
  
  // 인라인 코드 (`..`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 헤더
  html = html.replace(/^### (.*?)$/gm, '<h3 class="font-medium">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="font-semibold">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="font-bold">$1</h1>');
  
  // 볼드, 이탤릭
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 링크
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>');
  
  // 순서없는 목록
  // 전체 목록을 찾아서 처리
  html = html.replace(/((^|\n)- (.*?)(\n|$))+/g, function(match) {
    return '<ul class="list-disc pl-5">' + match.replace(/^- (.*?)$/gm, '<li>$1</li>') + '</ul>';
  });
  
  // 인용문
  html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic">$1</blockquote>');
  
  // 수평선
  html = html.replace(/^---+$/gm, '<hr class="my-2 border-t border-gray-300 dark:border-gray-600">');
  
  // 일반 텍스트를 p 태그로 감싸기 (다른 태그에 포함되지 않은 텍스트)
  // 먼저 줄바꿈으로 분리
  const lines = html.split('\n');
  html = '';
  let inSpecialBlock = false;
  
  for (const line of lines) {
    // 이미 태그로 감싸져 있는지 체크
    if (line.trim() === '') {
      html += '<br>';
      continue;
    }
    
    if (line.match(/^<(h1|h2|h3|pre|ul|ol|blockquote|hr)/)) {
      inSpecialBlock = true;
      html += line + '\n';
    } else if (line.match(/^<\/(h1|h2|h3|pre|ul|ol|blockquote)>/)) {
      inSpecialBlock = false;
      html += line + '\n';
    } else if (!inSpecialBlock && !line.match(/^<\w+/)) {
      // 일반 텍스트이고 태그로 시작하지 않으면 p 태그로 감싼다
      html += `<p>${line}</p>\n`;
    } else {
      html += line + '\n';
    }
  }
  
  return html;
} 