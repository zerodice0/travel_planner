import { useState, useEffect, useRef } from 'react';
import { X, Plus, MapPin, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
import type { SearchResult } from '#types/map';
import type { CreatePlaceData, Place } from '#types/place';
import type { List, ListPlaceItem } from '#types/list';
import type { PlaceDetails } from '#hooks/useGooglePlaceDetails';
import { CATEGORIES, getCategoryLabel, getCategoryIcon } from '#utils/categoryConfig';
import { getListIcon } from '#utils/listIconConfig';
import { useGoogleMap } from '#hooks/useGoogleMap';
import { listsApi } from '#lib/api';
import { GoogleMarkerManager } from '#utils/GoogleMarkerManager';
import { createCustomMarkerContent } from '#components/map/CustomMarker';

interface PlaceAddModalProps {
  isOpen: boolean;
  searchResult: SearchResult | null;
  poiPlaceDetails?: PlaceDetails | null; // Google Maps POI 장소 정보
  onClose: () => void;
  onConfirm: (
    data: CreatePlaceData,
    selectedListIds?: string[]
  ) => Promise<void>;
  isSubmitting: boolean;
  lists?: List[]; // 사용 가능한 목록 (옵션)
  currentListId?: string; // 현재 목록 ID (지도에 표시할 내 장소용)
}

export function PlaceAddModal({
  isOpen,
  searchResult,
  poiPlaceDetails,
  onClose,
  onConfirm,
  isSubmitting,
  lists,
  currentListId,
}: PlaceAddModalProps) {
  const [category, setCategory] = useState('');
  const [customName, setCustomName] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [listPlaces, setListPlaces] = useState<Place[]>([]);

  const modalRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const markerManagerRef = useRef<GoogleMarkerManager | null>(null);
  const tempMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Google Map for modal (레이지 로딩)
  const placeSource = searchResult || poiPlaceDetails;
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall
  const { map, isLoaded } = useGoogleMap(
    isOpen ? 'place-add-modal-map' : '',
    {
      center: placeSource
        ? { lat: placeSource.latitude, lng: placeSource.longitude }
        : DEFAULT_CENTER,
      level: 15,
    }
  );

  // Load list places when modal opens
  useEffect(() => {
    if (isOpen && currentListId) {
      listsApi
        .getPlaces(currentListId)
        .then((data) => {
          // Convert ListPlaceItem to Place
          const places: Place[] = data.places.map((item: ListPlaceItem) => ({
            id: item.id,
            name: item.name,
            address: item.address || '',
            category: item.category,
            latitude: item.latitude,
            longitude: item.longitude,
            visited: item.visited || false,
            createdAt: new Date().toISOString(),
          }));
          setListPlaces(places);
        })
        .catch((error) => {
          console.error('Failed to load list places:', error);
        });
    } else {
      setListPlaces([]);
    }
  }, [isOpen, currentListId]);

  // Initialize marker manager when map loads
  useEffect(() => {
    if (map && isLoaded) {
      markerManagerRef.current = new GoogleMarkerManager(map as google.maps.Map);
    }

    return () => {
      if (markerManagerRef.current) {
        markerManagerRef.current.clearMarkers();
        markerManagerRef.current = null;
      }
      // Cleanup temp marker
      if (tempMarkerRef.current) {
        tempMarkerRef.current.map = null;
        tempMarkerRef.current = null;
      }
    };
  }, [map, isLoaded]);

  // Render markers when places or search result changes
  useEffect(() => {
    if (!markerManagerRef.current || !isLoaded) return;

    const renderMarkers = async () => {
      if (!markerManagerRef.current) return;

      // Clear existing markers
      markerManagerRef.current.clearMarkers();

      // Add list places markers (gray)
      await Promise.all(
        listPlaces.map((place) => markerManagerRef.current?.addMarker(place))
      );

      // Add search result marker (blue, highlighted)
      if (placeSource) {
        await addTempMarker(placeSource);
      }
    };

    renderMarkers();
  }, [listPlaces, placeSource, isLoaded]);

  // Add temporary marker for search result
  const addTempMarker = async (result: SearchResult | PlaceDetails) => {
    if (!map || !isLoaded) return;

    // Remove existing temp marker
    if (tempMarkerRef.current) {
      tempMarkerRef.current.map = null;
      tempMarkerRef.current = null;
    }

    try {
      // Import marker library
      const { AdvancedMarkerElement } = (await google.maps.importLibrary(
        'marker'
      )) as google.maps.MarkerLibrary;

      // Create custom marker content with label
      const markerContent = createCustomMarkerContent(result.name);

      // Create marker
      const marker = new AdvancedMarkerElement({
        position: { lat: result.latitude, lng: result.longitude },
        map: map as google.maps.Map,
        title: result.name,
        content: markerContent,
      });

      tempMarkerRef.current = marker;

      // Center map on marker
      if (markerManagerRef.current) {
        markerManagerRef.current.panTo(result.latitude, result.longitude);
      }
    } catch (error) {
      console.error('Failed to add temp marker:', error);
    }
  };

  // Initialize category from search result or POI details
  useEffect(() => {
    if (isOpen && (searchResult || poiPlaceDetails)) {
      // Determine category from search result or POI types
      let initialCategory = 'etc';
      if (searchResult?.category) {
        initialCategory = searchResult.category;
      } else if (poiPlaceDetails?.types && poiPlaceDetails.types.length > 0) {
        // Map Google Maps types to our categories (simplified mapping)
        const typeMap: Record<string, string> = {
          restaurant: 'restaurant',
          cafe: 'cafe',
          lodging: 'accommodation',
          tourist_attraction: 'attraction',
          shopping_mall: 'shopping',
          bar: 'restaurant',
          park: 'attraction',
        };
        const firstType = poiPlaceDetails.types[0];
        if (firstType) {
          initialCategory = typeMap[firstType] || 'etc';
        }
      }

      setCategory(initialCategory);
      setCustomName('');
      setLabels([]);
      setNote('');
      setNewLabel('');
      setIsAddingLabel(false);
      setShowCategoryDropdown(false);
      setHasUnsavedChanges(false);
      setShowCloseConfirm(false);
      setSelectedLists(new Set());
    }
  }, [isOpen, searchResult, poiPlaceDetails]);

  // Track unsaved changes
  useEffect(() => {
    if (customName || labels.length > 0 || note) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [customName, labels, note]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, hasUnsavedChanges]);

  const handleClose = () => {
    // Don't allow closing while submitting or if ConfirmDialog is already open
    if (isSubmitting || showCloseConfirm) return;

    // Show ConfirmDialog if there are unsaved changes
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
      return;
    }

    onClose();
  };

  // Prevent Enter key from submitting form in input fields
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling to parent form
    }
  };

  // Confirm close: reset all fields and close both dialogs
  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    setCategory('');
    setCustomName('');
    setLabels([]);
    setNote('');
    setNewLabel('');
    setIsAddingLabel(false);
    setHasUnsavedChanges(false);
    setSelectedLists(new Set());
    onClose();
  };

  // Cancel close: close ConfirmDialog, keep PlaceAddModal open
  const handleCancelClose = () => {
    setShowCloseConfirm(false);
    // Return focus to close button
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) {
      setIsAddingLabel(false);
      return;
    }

    if (labels.length >= 5) {
      toast.error('라벨은 최대 5개까지 추가할 수 있습니다.');
      return;
    }

    if (newLabel.length > 20) {
      toast.error('라벨은 최대 20자까지 입력할 수 있습니다.');
      return;
    }

    if (labels.includes(newLabel.trim())) {
      toast.error('이미 추가된 라벨입니다.');
      return;
    }

    setLabels([...labels, newLabel.trim()]);
    setNewLabel('');
    setIsAddingLabel(false);
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((label) => label !== labelToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get place data from either searchResult or poiPlaceDetails
    const placeSource = searchResult || poiPlaceDetails;
    if (!placeSource) return;

    const data: CreatePlaceData = {
      name: placeSource.name,
      address: placeSource.address,
      phone: placeSource.phone,
      latitude: placeSource.latitude,
      longitude: placeSource.longitude,
      category,
      customName: customName.trim() || undefined,
      labels: labels.length > 0 ? labels : undefined,
      note: note.trim() || undefined,
      description: searchResult?.description || poiPlaceDetails?.description,
      externalUrl: searchResult?.url || poiPlaceDetails?.externalUrl,
      externalId: (searchResult?.id || poiPlaceDetails?.placeId)?.substring(0, 255),
    };

    await onConfirm(
      data,
      selectedLists.size > 0 ? Array.from(selectedLists) : undefined
    );
  };

  if (!isOpen || (!searchResult && !poiPlaceDetails)) return null;

  const CategoryIcon = getCategoryIcon(category);
  const categoryLabel = getCategoryLabel(category);
  // Filter out 'all' category from dropdown
  const selectableCategories = CATEGORIES.filter((cat) => cat.value !== 'all');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-5xl bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        aria-hidden={showCloseConfirm}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-foreground">장소 추가</h2>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid Layout: Map (left) + Form (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left: Map Area */}
          <div className="h-[400px] lg:h-[600px] border-b lg:border-b-0 lg:border-r border-border bg-muted/20 relative">
            {isOpen ? (
              <>
                <div id="place-add-modal-map" className="w-full h-full" />
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-primary mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Right: Form Area */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
          {/* Place Info */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">{placeSource!.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{placeSource!.address}</p>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              🏷️ 카테고리
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg hover:bg-muted transition-colors flex items-center justify-between disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{categoryLabel}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    showCategoryDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-20">
                  {selectableCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setCategory(cat.value);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 ${
                          category === cat.value ? 'bg-primary/10 text-primary' : ''
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Custom Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ✏️ 별칭 (선택)
            </label>
            <Input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: 우리 단골 카페, 야경 명소"
              maxLength={100}
              disabled={isSubmitting}
              fullWidth
            />
            <p className="text-xs text-muted-foreground mt-1">
              자신만의 이름으로 장소를 구분할 수 있습니다
            </p>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              🏷️ 라벨 (선택, 최대 5개)
            </label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(label)}
                    disabled={isSubmitting}
                    className="hover:bg-primary/20 rounded-full p-0.5 disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {isAddingLabel ? (
                <div className="inline-flex items-center gap-1">
                  <Input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent event bubbling to parent form
                        handleAddLabel();
                      }
                    }}
                    onBlur={() => {
                      if (!newLabel.trim()) setIsAddingLabel(false);
                    }}
                    placeholder="라벨 입력"
                    maxLength={20}
                    autoFocus
                    className="px-3 py-1 rounded-full text-sm w-32"
                    disabled={isSubmitting}
                  />
                </div>
              ) : (
                labels.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingLabel(true)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-foreground rounded-full text-sm hover:bg-muted/80 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    추가
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              장소를 분류하고 검색하기 쉽게 태그를 추가하세요
            </p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              📝 메모 (선택)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                // Allow Shift+Enter for line breaks, but prevent Enter alone from submitting
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                }
              }}
              placeholder="이 장소에 대한 메모를 남겨보세요 (가고싶은 이유, 추천받은 내용 등)"
              maxLength={2000}
              rows={4}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-foreground bg-background placeholder:text-muted-foreground disabled:opacity-50"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                방문 계획, 추천 이유 등을 기록하세요
              </p>
              <p className="text-xs text-muted-foreground">{note.length}/2000</p>
            </div>
          </div>

          {/* List Selection */}
          {lists && lists.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                📋 목록에 추가 (선택)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {lists.map((list) => {
                  const Icon = getListIcon(list.iconValue);
                  const isSelected = selectedLists.has(list.id);
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => {
                        const newSet = new Set(selectedLists);
                        if (isSelected) {
                          newSet.delete(list.id);
                        } else {
                          newSet.add(list.id);
                        }
                        setSelectedLists(newSet);
                      }}
                      disabled={isSubmitting}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'border-border hover:bg-muted'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 flex-shrink-0 text-primary" />
                        <span className="font-medium flex-1 truncate">{list.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                이 장소를 추가할 목록을 선택하세요
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  추가 중...
                </>
              ) : (
                '추가하기'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && (
        <div className="fixed inset-0" style={{ zIndex: 60 }}>
          <ConfirmDialog
            isOpen={showCloseConfirm}
            onClose={handleCancelClose}
            onConfirm={handleConfirmClose}
            title="장소 추가 취소"
            message="입력 중인 내용이 있습니다. 정말 취소하시겠습니까?"
            confirmText="취소하기"
            cancelText="계속 작성"
            variant="warning"
          />
        </div>
      )}
    </div>
  );
}
