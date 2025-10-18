import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, MapPin, FolderOpen } from 'lucide-react';
import Input from '#components/ui/Input';
import { searchApi, placesApi } from '#lib/api';
import type { SearchResults, SearchHistory } from '#types/search';
import toast from 'react-hot-toast';
import { getCategoryIcon } from '#utils/categoryConfig';

const STORAGE_KEY = 'travel-planner:search-history';
const MAX_HISTORY = 5;

function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function SearchPage() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  useEffect(() => {
    // Load search history from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  const performSearch = async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchApi.search(q);
      setResults(data);

      // Save to search history
      const newHistory: SearchHistory[] = [
        { keyword: q, searchedAt: new Date().toISOString() },
        ...searchHistory.filter((h) => h.keyword !== q),
      ].slice(0, MAX_HISTORY);

      setSearchHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((q: string) => performSearch(q), 300),
    [searchHistory]
  );

  useEffect(() => {
    debouncedSearch(keyword);
  }, [keyword, debouncedSearch]);

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleRemoveHistoryItem = (itemKeyword: string) => {
    const newHistory = searchHistory.filter((h) => h.keyword !== itemKeyword);
    setSearchHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const handleToggleVisit = async (placeId: string) => {
    if (!results) return;

    const place = results.places.find((p) => p.id === placeId);
    if (!place) return;

    const newVisited = !place.visited;

    // Optimistic update
    setResults({
      ...results,
      places: results.places.map((p) =>
        p.id === placeId ? { ...p, visited: newVisited } : p
      ),
    });

    try {
      await placesApi.update(placeId, { visited: newVisited });
    } catch (error) {
      console.error('Failed to toggle visit:', error);
      // Revert on error
      setResults({
        ...results,
        places: results.places.map((p) =>
          p.id === placeId ? { ...p, visited: !newVisited } : p
        ),
      });
      toast.error('방문 상태 변경에 실패했습니다.');
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search Bar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="장소, 목록 검색..."
              autoFocus
              className="pl-10 pr-10"
              fullWidth
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors z-10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Search History */}
        {!keyword && searchHistory.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">최근 검색어</h2>
              <button
                onClick={handleClearHistory}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                전체 삭제
              </button>
            </div>
            <div className="space-y-2">
              {searchHistory.map((item) => (
                <div
                  key={item.keyword}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
                >
                  <button
                    onClick={() => setKeyword(item.keyword)}
                    className="flex-1 text-left text-foreground"
                  >
                    {item.keyword}
                  </button>
                  <button
                    onClick={() => handleRemoveHistoryItem(item.keyword)}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-border border-t-primary-500"></div>
            <p className="text-muted-foreground mt-4">검색 중...</p>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && results && (
          <div className="space-y-6">
            {/* Places Section */}
            {results.places.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  장소 ({results.total.places})
                </h2>
                <div className="space-y-3">
                  {results.places.map((place) => (
                    <div
                      key={place.id}
                      className="bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleVisit(place.id)}
                          className={`flex-shrink-0 w-6 h-6 border-2 rounded flex items-center justify-center transition-colors ${
                            place.visited
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-input hover:border-primary-500'
                          }`}
                        >
                          {place.visited && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Place Info */}
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/places/${place.id}`)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {(() => {
                              const Icon = getCategoryIcon(place.category);
                              return <Icon className="w-5 h-5 text-muted-foreground" />;
                            })()}
                            <h3
                              className={`font-semibold ${
                                place.visited ? 'text-muted-foreground line-through' : 'text-foreground'
                              }`}
                            >
                              {place.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{place.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Lists Section */}
            {results.lists.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  목록 ({results.total.lists})
                </h2>
                <div className="space-y-3">
                  {results.lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => navigate(`/lists/${list.id}`)}
                      className="w-full bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-center gap-3">
                        {list.iconType === 'category' ? (
                          (() => {
                            const Icon = getCategoryIcon(list.iconValue);
                            return <Icon className="w-12 h-12 text-primary-600" />;
                          })()
                        ) : list.iconType === 'emoji' ? (
                          <span className="text-3xl">{list.iconValue}</span>
                        ) : (
                          <img
                            src={list.iconValue}
                            alt={list.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{list.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FolderOpen className="w-3 h-3" />
                            <span>
                              {list.placesCount}개 장소 · {list.visitedCount}/{list.placesCount} 방문
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {results.places.length === 0 && results.lists.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">'{keyword}' 검색 결과가 없습니다.</p>
                <p className="text-sm text-muted-foreground">다른 검색어를 입력해보세요.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
