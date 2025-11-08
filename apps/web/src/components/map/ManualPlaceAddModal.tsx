import { useState, useEffect, useRef } from 'react';
import { X, MapPin, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
import { QualityGuidelinesPanel } from '#components/map/QualityGuidelinesPanel';
import { CATEGORIES, getCategoryLabel, getCategoryIcon } from '#utils/categoryConfig';
import { useGoogleMap } from '#hooks/useGoogleMap';
import type { CreatePublicPlaceData } from '#types/publicPlace';

interface ManualPlaceAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number } | null;
  onConfirm: (data: CreatePublicPlaceData) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * ManualPlaceAddModal
 *
 * Purpose: Allow users to manually add places by entering details
 * Use case: When clicking on map or when external search is unavailable
 *
 * Features:
 * - Manual input for all place details
 * - Google Maps Reverse Geocoding to auto-fill address
 * - Category selection
 * - Coordinate display and editing
 * - Unsaved changes warning
 */
export function ManualPlaceAddModal({
  isOpen,
  onClose,
  initialLocation,
  onConfirm,
  isSubmitting,
}: ManualPlaceAddModalProps) {
  const [formData, setFormData] = useState<CreatePublicPlaceData>({
    name: '',
    address: '',
    phone: '',
    latitude: initialLocation?.lat || 0,
    longitude: initialLocation?.lng || 0,
    category: 'etc',
    description: '',
    externalUrl: '',
    externalId: '',
  });

  const [category, setCategory] = useState('etc');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const tempMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Google Map for modal
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall
  const { map, isLoaded } = useGoogleMap(
    isOpen ? 'manual-place-add-modal-map' : '',
    {
      center: initialLocation || DEFAULT_CENTER,
      level: 15,
    }
  );

  // Initialize form data when modal opens with initial location
  useEffect(() => {
    if (isOpen && initialLocation) {
      setFormData({
        name: '',
        address: '',
        phone: '',
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
        category: 'etc',
        description: '',
        externalUrl: '',
        externalId: '',
      });
      setCategory('etc');
      setShowCategoryDropdown(false);
      setHasUnsavedChanges(false);
      setShowCloseConfirm(false);

      // Auto-fill address using Google Maps Reverse Geocoding
      performReverseGeocode(initialLocation.lat, initialLocation.lng);
    } else if (isOpen && !initialLocation) {
      // Reset form when opened without location
      setFormData({
        name: '',
        address: '',
        phone: '',
        latitude: 0,
        longitude: 0,
        category: 'etc',
        description: '',
        externalUrl: '',
        externalId: '',
      });
      setCategory('etc');
      setShowCategoryDropdown(false);
      setHasUnsavedChanges(false);
      setShowCloseConfirm(false);
    }
  }, [isOpen, initialLocation]);

  // Add marker when location changes
  useEffect(() => {
    if (!map || !isLoaded || !initialLocation) return;

    const addTempMarker = async () => {
      try {
        // Remove existing temp marker
        if (tempMarkerRef.current) {
          tempMarkerRef.current.map = null;
          tempMarkerRef.current = null;
        }

        // Import marker library
        const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

        // Create blue pin
        const pinElement = new PinElement({
          background: '#3B82F6',
          borderColor: '#1E40AF',
          glyphColor: '#FFFFFF',
        });

        // Create marker
        const marker = new AdvancedMarkerElement({
          position: { lat: initialLocation.lat, lng: initialLocation.lng },
          map: map as google.maps.Map,
          title: '새 장소',
          content: pinElement.element,
        });

        tempMarkerRef.current = marker;

        // Center map on marker
        (map as google.maps.Map).panTo({ lat: initialLocation.lat, lng: initialLocation.lng });
      } catch (error) {
        console.error('Failed to add temp marker:', error);
      }
    };

    addTempMarker();

    return () => {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.map = null;
        tempMarkerRef.current = null;
      }
    };
  }, [map, isLoaded, initialLocation]);

  // Track unsaved changes
  useEffect(() => {
    if (formData.name || formData.address || formData.description) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [formData.name, formData.address, formData.description]);

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

  /**
   * Google Maps Reverse Geocoding
   * Converts coordinates to human-readable address
   */
  const performReverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({
        location: { lat, lng },
      });

      if (result.results && result.results.length > 0) {
        const firstResult = result.results[0];
        if (firstResult) {
          const address = firstResult.formatted_address;
          setFormData((prev) => ({ ...prev, address }));
        } else {
          toast.error('주소를 찾을 수 없습니다');
        }
      } else {
        toast.error('주소를 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      toast.error('주소 조회에 실패했습니다');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || showCloseConfirm) return;

    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
      return;
    }

    onClose();
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    setFormData({
      name: '',
      address: '',
      phone: '',
      latitude: 0,
      longitude: 0,
      category: 'etc',
      description: '',
      externalUrl: '',
      externalId: '',
    });
    setCategory('etc');
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('장소 이름을 입력해주세요');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('주소를 입력해주세요');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('유효한 좌표를 입력해주세요');
      return;
    }

    const data: CreatePublicPlaceData = {
      ...formData,
      category,
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      externalUrl: formData.externalUrl?.trim() || undefined,
      externalId: formData.externalId?.trim() || undefined,
    };

    await onConfirm(data);
  };

  if (!isOpen) return null;

  const CategoryIcon = getCategoryIcon(category);
  const categoryLabel = getCategoryLabel(category);
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
          <h2 className="text-xl font-bold text-foreground">수동 장소 추가</h2>
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
                <div id="manual-place-add-modal-map" className="w-full h-full" />
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
            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 지도를 클릭하여 선택한 위치에 장소를 추가합니다.
              </p>
            </div>

            {/* Quality Guidelines */}
            <QualityGuidelinesPanel />

            {/* Place Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                📍 장소 이름 *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="예: 맛있는 식당, 아름다운 공원"
                maxLength={100}
                disabled={isSubmitting}
                required
                fullWidth
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                🏠 주소 *
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder={isLoadingAddress ? '주소 조회 중...' : '주소를 입력하세요'}
                  maxLength={500}
                  disabled={isSubmitting || isLoadingAddress}
                  required
                  fullWidth
                />
                {isLoadingAddress && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                위치 기반으로 자동 입력되었습니다 (수정 가능)
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                🏷️ 카테고리 *
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
                            setFormData({ ...formData, category: cat.value });
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

            {/* Phone (Optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                📞 전화번호 (선택)
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="예: 02-1234-5678"
                maxLength={20}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                📝 설명 (선택)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="장소에 대한 설명을 입력하세요"
                maxLength={2000}
                rows={4}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-foreground bg-background placeholder:text-muted-foreground disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description?.length || 0}/2000
              </p>
            </div>

            {/* Coordinates (Read-only display) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                🌐 좌표
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                  }
                  placeholder="위도"
                  disabled={isSubmitting}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background placeholder:text-muted-foreground disabled:opacity-50"
                />
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                  }
                  placeholder="경도"
                  disabled={isSubmitting}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                클릭한 위치의 좌표입니다
              </p>
            </div>

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
