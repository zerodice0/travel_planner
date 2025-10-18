import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, MapPin, Lightbulb } from 'lucide-react';
import Input from '#components/ui/Input';
import type { SearchResult } from '#types/map';

interface PlaceSearchBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (keyword: string) => Promise<void>;
  searchResults: SearchResult[];
  isSearching: boolean;
  onResultSelect: (result: SearchResult) => void;
  onResultAdd: (result: SearchResult) => void;
  selectedSearchResultId: string | null;
}

export function PlaceSearchBottomSheet({
  isOpen,
  onClose,
  onSearch,
  searchResults,
  isSearching,
  onResultSelect,
  onResultAdd,
  selectedSearchResultId,
}: PlaceSearchBottomSheetProps) {
  const [keyword, setKeyword] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    setKeyword('');
    onClose();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    await onSearch(keyword);
  };

  // Debounce search
  const debounce = <T extends (...args: never[]) => unknown>(
    func: T,
    delay: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: number;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (value.trim()) {
        onSearch(value);
      }
    }, 300),
    [onSearch],
  );

  useEffect(() => {
    debouncedSearch(keyword);
  }, [keyword, debouncedSearch]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Bottom Sheet */}
      <div
        ref={bottomSheetRef}
        className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between border-b border-border">
          <h2 className="text-xl font-bold text-foreground">장소 추가하기</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Section */}
        <div className="px-6 py-4 border-b border-border">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="어디로 여행가시나요? 🌍"
                className="pl-12 pr-4 py-4 text-lg"
                fullWidth
                autoComplete="off"
              />
            </div>
          </form>

          {/* Search Hints */}
          <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground mb-1">검색 팁</p>
              <p className="text-xs">
                예: <span className="text-primary">남산타워</span>,{' '}
                <span className="text-primary">명동 맛집</span>,{' '}
                <span className="text-primary">강남역 카페</span>
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="overflow-y-auto max-h-[calc(85vh-280px)] px-6 py-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">검색 중...</p>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {/* Local Results Section */}
              {searchResults.some((r) => r.isLocal) && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-2">
                    저장된 장소
                  </p>
                  <div className="space-y-2">
                    {searchResults
                      .filter((r) => r.isLocal)
                      .map((result) => (
                        <div
                          key={result.id}
                          onClick={() => onResultSelect(result)}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                            selectedSearchResultId === result.id
                              ? 'bg-primary/10 border-2 border-primary shadow-md'
                              : 'bg-background border-2 border-transparent hover:bg-muted'
                          }`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onResultSelect(result);
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                              <h3 className="font-medium text-foreground truncate">
                                {result.name}
                              </h3>
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex-shrink-0">
                                저장됨
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate ml-6">
                              {result.address}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* External Results Section */}
              {searchResults.some((r) => !r.isLocal) && (
                <div>
                  {searchResults.some((r) => r.isLocal) && (
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-2">
                      검색 결과
                    </p>
                  )}
                  <div className="space-y-2">
                    {searchResults
                      .filter((r) => !r.isLocal)
                      .map((result) => (
                        <div
                          key={result.id}
                          onClick={() => onResultSelect(result)}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                            selectedSearchResultId === result.id
                              ? 'bg-primary/10 border-2 border-primary shadow-md'
                              : 'bg-background border-2 border-transparent hover:bg-muted'
                          }`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onResultSelect(result);
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <h3 className="font-medium text-foreground truncate">
                                {result.name}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground truncate ml-6">
                              {result.address}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onResultAdd(result);
                            }}
                            className={`ml-3 px-4 py-2 text-sm rounded-lg transition-all flex-shrink-0 font-medium ${
                              selectedSearchResultId === result.id
                                ? 'bg-primary text-white shadow-lg scale-105 hover:bg-primary-dark'
                                : 'bg-primary text-white hover:bg-primary-dark'
                            }`}
                          >
                            추가
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : keyword.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-foreground font-medium mb-1">검색 결과가 없습니다</p>
              <p className="text-sm text-muted-foreground">
                다른 키워드로 검색해보세요
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-foreground font-medium mb-1">장소를 검색해보세요</p>
              <p className="text-sm text-muted-foreground">
                가고 싶은 여행지나 맛집을 찾아보세요
              </p>
            </div>
          )}
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
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
