import { useState, useEffect, useRef } from 'react';
import { X, Plus, MapPin, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
import type { SearchResult } from '#types/map';
import type { CreatePlaceData } from '#types/place';
import { CATEGORIES, getCategoryLabel, getCategoryIcon } from '#utils/categoryConfig';

interface PlaceAddModalProps {
  isOpen: boolean;
  searchResult: SearchResult | null;
  onClose: () => void;
  onConfirm: (data: CreatePlaceData) => Promise<void>;
  isSubmitting: boolean;
}

export function PlaceAddModal({
  isOpen,
  searchResult,
  onClose,
  onConfirm,
  isSubmitting,
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

  const modalRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize category from search result
  useEffect(() => {
    if (isOpen && searchResult) {
      setCategory(searchResult.category || 'etc');
      setCustomName('');
      setLabels([]);
      setNote('');
      setNewLabel('');
      setIsAddingLabel(false);
      setShowCategoryDropdown(false);
      setHasUnsavedChanges(false);
      setShowCloseConfirm(false);
    }
  }, [isOpen, searchResult]);

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
    if (!searchResult) return;

    const data: CreatePlaceData = {
      name: searchResult.name,
      address: searchResult.address,
      phone: searchResult.phone,
      latitude: searchResult.latitude,
      longitude: searchResult.longitude,
      category,
      customName: customName.trim() || undefined,
      labels: labels.length > 0 ? labels : undefined,
      note: note.trim() || undefined,
      description: searchResult.description,
      externalUrl: searchResult.url,
      externalId: searchResult.id?.substring(0, 255),
    };

    await onConfirm(data);
  };

  if (!isOpen || !searchResult) return null;

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
        className="w-full max-w-2xl bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Place Info */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">{searchResult.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{searchResult.address}</p>
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddLabel();
                  }}
                  className="inline-flex items-center gap-1"
                >
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
                </form>
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
