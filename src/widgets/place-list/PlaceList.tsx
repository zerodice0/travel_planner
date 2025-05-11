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
  // 메모 수정을 위한 상태 추가
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [newNotesValue, setNewNotesValue] = useState<string>("");

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

  // 메모 편집 시작 함수
  const handleStartEditNotes = (place: Place) => {
    setEditingNotesId(place.id);
    setNewNotesValue(place.notes || "");
  };

  // 메모 저장 함수
  const handleSaveNotes = async (place: Place) => {
    if (!onPlaceUpdate) return;
    
    try {
      setEditingNotesId(null); // 먼저 편집 상태 해제
      
      // 전체 place 객체를 복사하고 메모만 업데이트
      const updatedPlace = {
        ...place,
        notes: newNotesValue || '' // 빈 값이면 빈 문자열로 설정
      };
      
      console.log('메모 업데이트 요청:', updatedPlace);
      await onPlaceUpdate(updatedPlace);
    } catch (error) {
      console.error("메모 업데이트 중 오류 발생:", error);
      // 실패 시 편집 모드 유지
      setEditingNotesId(place.id);
      alert('메모 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 메모 편집 취소 함수
  const handleCancelEditNotes = () => {
    setEditingNotesId(null);
  };

  // 구글맵으로 장소 열기
  const openInGoogleMaps = (place: Place) => {
    // 사용자 에이전트 문자열을 가져옴
    const userAgent = navigator.userAgent || navigator.vendor || '';
    
    // 모바일 기기인지 확인 (iOS 또는 Android)
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    
    // 구글맵 URL 생성 (웹 또는 앱용)
    let googleMapsUrl = '';
    
    if (isMobile) {
      // 모바일 환경에서는 앱 스키마 또는 유니버설 링크 사용
      // Android의 경우 geo: 스키마 사용
      if (/android/i.test(userAgent)) {
        // Android용 URL 스키마
        googleMapsUrl = `geo:${place.latitude},${place.longitude}?q=${encodeURIComponent(place.name || place.address || '')}`;
      } else {
        // iOS용 URL 스키마
        googleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(place.name || place.address || '')}&ll=${place.latitude},${place.longitude}`;
      }
    } else {
      // 데스크톱 환경에서는 일반 웹 URL 사용
      googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
      if (place.name) {
        googleMapsUrl += `&query_place_id=${encodeURIComponent(place.name)}`;
      }
    }
    
    // URL 열기 시도
    try {
      window.open(googleMapsUrl, '_blank');
    } catch (error) {
      console.error('지도 앱을 열 수 없습니다:', error);
      // 앱 열기 실패 시 웹 버전으로 대체
      const webFallbackUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
      window.open(webFallbackUrl, '_blank');
    }
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
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
            selectedPlace?.id === place.id 
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' 
              : 'bg-white dark:bg-gray-800 dark:border-gray-700'
          } transition-colors`}
        >
          <div 
            className="p-3 flex justify-between items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                      className="text-xs px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="라벨 입력..."
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveLabel(place);
                      }}
                      className="ml-1 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      저장
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEditLabel();
                      }}
                      className="ml-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    {place.custom_label ? (
                      <div className="inline-flex items-center ml-2">
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                          {place.custom_label}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditLabel(place);
                          }}
                          className="ml-1 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
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
                        className="ml-2 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 px-2 py-0.5 rounded-full border border-dashed border-gray-300 dark:border-gray-600"
                      >
                        라벨 추가
                      </button>
                    )}
                  </>
                )}
              </h3>
              <div className="flex items-center mt-1">
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full mr-2">
                  {place.category}
                </span>
                {place.rating && place.rating > 0 && (
                  <div className="text-xs text-yellow-500 dark:text-yellow-400">
                    {Array.from({ length: place.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-1">
              <button 
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
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
            <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700 transition-colors">
              {place.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{place.address}</p>
              )}
              
              {/* 구글맵에서 보기 버튼 */}
              <div className="mt-2 mb-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openInGoogleMaps(place);
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:hover:bg-gray-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  지도 앱에서 보기
                </button>
              </div>
              
              {place.notes && (
                <div className="mt-2">
                  {editingNotesId === place.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={newNotesValue}
                        onChange={(e) => setNewNotesValue(e.target.value)}
                        className="w-full h-32 text-sm p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="메모를 입력하세요... (마크다운 지원)"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveNotes(place);
                          }}
                          className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          저장
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEditNotes();
                          }}
                          className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">메모</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditNotes(place);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                      <div 
                        className="text-sm text-gray-600 dark:text-gray-400 prose-sm max-w-none prose-headings:my-1 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(place.notes) }}
                      ></div>
                    </div>
                  )}
                </div>
              )}
              {!place.notes && (
                <div className="mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNotesId(place.id);
                      setNewNotesValue("");
                    }}
                    className="text-xs text-gray-500 dark:text-gray-400 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    메모 추가하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 마크다운을 HTML로 변환하는 함수 추가
// 컴포넌트 밖에 정의
function parseMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';
  
  // 줄바꿈을 임시로 다른 문자열로 대체
  let html = markdown.replace(/\r\n|\n\r|\n|\r/g, '\n');
  
  // 코드 블록 (```..```) - 이 부분이 다른 정규식에 영향을 주지 않도록 먼저 처리
  html = html.replace(/```([\s\S]*?)```/gm, function(match, code) {
    return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });
  
  // 인라인 코드 (`..`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 헤더
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // 볼드, 이탤릭
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 링크
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // 순서없는 목록
  // 전체 목록을 찾아서 처리
  html = html.replace(/((^|\n)- (.*?)(\n|$))+/g, function(match) {
    return '<ul>' + match.replace(/^- (.*?)$/gm, '<li>$1</li>') + '</ul>';
  });
  
  // 인용문
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
  
  // 수평선
  html = html.replace(/^---+$/gm, '<hr>');
  
  // 줄바꿈
  html = html.replace(/\n/g, '<br>');
  
  return html;
}