import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  MapPin,
  Phone,
  ExternalLink,
  X,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
import { placesApi, listsApi, reviewsApi } from '#lib/api';
import type { PlaceDetail, PlaceListSummary } from '#types/place';
import type { List } from '#types/list';
import type { Review, CreateReviewData, UpdateReviewData } from '#types/review';
import { ReviewList } from '#components/reviews/ReviewList';
import { ReviewForm } from '#components/reviews/ReviewForm';

const CATEGORIES = [
  { value: 'restaurant', label: '음식점', emoji: '🍔' },
  { value: 'cafe', label: '카페', emoji: '☕' },
  { value: 'attraction', label: '관광지', emoji: '🎡' },
  { value: 'accommodation', label: '숙소', emoji: '🏨' },
  { value: 'shopping', label: '쇼핑', emoji: '🛍️' },
  { value: 'culture', label: '문화시설', emoji: '🎭' },
  { value: 'nature', label: '자연', emoji: '🌲' },
  { value: 'etc', label: '기타', emoji: '📍' },
];

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [includedLists, setIncludedLists] = useState<PlaceListSummary[]>([]);
  const [allLists, setAllLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [visitNote, setVisitNote] = useState('');
  const [customName, setCustomName] = useState('');
  const [note, setNote] = useState('');
  const [isEditingCustomName, setIsEditingCustomName] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | undefined>();
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [placeData, listsData, allListsData] = await Promise.all([
        placesApi.getOne(id),
        placesApi.getLists(id),
        listsApi.getAll({ limit: 100 }),
      ]);

      setPlace(placeData);
      setIncludedLists(listsData.lists);
      setAllLists(allListsData.lists);
      setVisitNote(placeData.visitNote || '');
      setCustomName(placeData.customName || '');
      setNote(placeData.note || '');

      // Fetch reviews
      await fetchReviews();
    } catch (error) {
      console.error('Failed to fetch place:', error);
      toast.error('장소 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;

    try {
      setIsLoadingReviews(true);
      const reviewsData = await reviewsApi.getByPlace(id);
      setReviews(reviewsData.reviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleToggleVisit = async () => {
    if (!place) return;

    const newVisited = !place.visited;
    const updatedPlace = {
      ...place,
      visited: newVisited,
      visitedAt: newVisited ? new Date().toISOString() : undefined,
      visitNote: newVisited ? visitNote : '',
    };

    setPlace(updatedPlace);

    try {
      await placesApi.update(place.id, {
        visited: newVisited,
        visitedAt: newVisited ? new Date().toISOString() : undefined,
        visitNote: newVisited ? visitNote : undefined,
      });
      toast.success(newVisited ? '방문 완료로 표시했습니다.' : '방문 취소했습니다.');
    } catch (error) {
      console.error('Failed to toggle visit:', error);
      setPlace(place);
      toast.error('방문 상태 변경에 실패했습니다.');
    }
  };

  const handleUpdateVisitNote = async () => {
    if (!place) return;

    try {
      await placesApi.update(place.id, { visitNote });
      setPlace({ ...place, visitNote });
      toast.success('방문 소감을 저장했습니다.');
    } catch (error) {
      console.error('Failed to update visit note:', error);
      toast.error('방문 소감 저장에 실패했습니다.');
    }
  };

  const handleAddLabel = async () => {
    if (!place || !newLabel.trim()) return;
    if (place.labels.length >= 5) {
      toast.error('라벨은 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    if (newLabel.length > 20) {
      toast.error('라벨은 최대 20자까지 입력할 수 있습니다.');
      return;
    }

    const updatedLabels = [...place.labels, newLabel.trim()];

    try {
      await placesApi.update(place.id, { labels: updatedLabels });
      setPlace({ ...place, labels: updatedLabels });
      setNewLabel('');
      setIsAddingLabel(false);
      toast.success('라벨을 추가했습니다.');
    } catch (error) {
      console.error('Failed to add label:', error);
      toast.error('라벨 추가에 실패했습니다.');
    }
  };

  const handleRemoveLabel = async (labelToRemove: string) => {
    if (!place) return;

    const updatedLabels = place.labels.filter((label) => label !== labelToRemove);

    try {
      await placesApi.update(place.id, { labels: updatedLabels });
      setPlace({ ...place, labels: updatedLabels });
      toast.success('라벨을 삭제했습니다.');
    } catch (error) {
      console.error('Failed to remove label:', error);
      toast.error('라벨 삭제에 실패했습니다.');
    }
  };

  const handleUpdateCategory = async (category: string) => {
    if (!place) return;

    try {
      await placesApi.update(place.id, { category });
      setPlace({ ...place, category });
      setShowCategoryModal(false);
      toast.success('카테고리를 변경했습니다.');
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('카테고리 변경에 실패했습니다.');
    }
  };

  const handleAddToList = async (listId: string) => {
    if (!place) return;

    try {
      await placesApi.addToList(place.id, listId);
      const listsData = await placesApi.getLists(place.id);
      setIncludedLists(listsData.lists);
      toast.success('목록에 추가했습니다.');
    } catch (error) {
      console.error('Failed to add to list:', error);
      toast.error('목록 추가에 실패했습니다.');
    }
  };

  const handleRemoveFromList = async (listId: string) => {
    if (!place) return;

    try {
      await placesApi.removeFromList(place.id, listId);
      setIncludedLists(includedLists.filter((list) => list.id !== listId));
      toast.success('목록에서 제거했습니다.');
    } catch (error) {
      console.error('Failed to remove from list:', error);
      toast.error('목록 제거에 실패했습니다.');
    }
  };

  const handleUpdateCustomName = async () => {
    if (!place) return;

    try {
      await placesApi.update(place.id, { customName: customName || undefined });
      setPlace({ ...place, customName: customName || undefined });
      setIsEditingCustomName(false);
      toast.success('별칭을 저장했습니다.');
    } catch (error) {
      console.error('Failed to update custom name:', error);
      toast.error('별칭 저장에 실패했습니다.');
    }
  };

  const handleUpdateNote = async () => {
    if (!place) return;

    try {
      await placesApi.update(place.id, { note: note || undefined });
      setPlace({ ...place, note: note || undefined });
      setIsEditingNote(false);
      toast.success('메모를 저장했습니다.');
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('메모 저장에 실패했습니다.');
    }
  };

  const handleCreateReview = async (data: CreateReviewData) => {
    if (!place) return;

    setIsSubmittingReview(true);
    try {
      await reviewsApi.create(place.id, data);
      toast.success('리뷰를 작성했습니다.');
      setShowReviewForm(false);
      await fetchReviews();
    } catch (error) {
      console.error('Failed to create review:', error);
      toast.error('리뷰 작성에 실패했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleUpdateReview = async (data: UpdateReviewData) => {
    if (!editingReview) return;

    setIsSubmittingReview(true);
    try {
      await reviewsApi.update(editingReview.id, data);
      toast.success('리뷰를 수정했습니다.');
      setEditingReview(undefined);
      setShowReviewForm(false);
      await fetchReviews();
    } catch (error) {
      console.error('Failed to update review:', error);
      toast.error('리뷰 수정에 실패했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewSubmit = async (data: CreateReviewData | UpdateReviewData) => {
    if (editingReview) {
      await handleUpdateReview(data as UpdateReviewData);
    } else {
      await handleCreateReview(data as CreateReviewData);
    }
  };

  const handleDelete = async () => {
    if (!place) return;

    setIsDeleting(true);
    try {
      await placesApi.delete(place.id);
      toast.success('장소를 삭제했습니다.');
      setShowDeleteDialog(false);
      navigate(-1);
    } catch (error) {
      console.error('Failed to delete place:', error);
      toast.error('장소 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = CATEGORIES.find((c) => c.value === category);
    return found ? `${found.emoji} ${found.label}` : category;
  };

  const openMapLink = () => {
    if (!place) return;
    const url = place.externalUrl || `https://map.kakao.com/link/map/${place.name},${place.latitude},${place.longitude}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">장소를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const availableLists = allLists.filter(
    (list) => !includedLists.some((included) => included.id === list.id)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1 text-center mx-4 truncate">
            {place.name}
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // TODO: Navigate to edit page
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-background flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteDialog(true);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-background text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 별칭 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">별칭</h3>
            {!isEditingCustomName && (
              <button
                onClick={() => setIsEditingCustomName(true)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {customName ? '수정' : '추가'}
              </button>
            )}
          </div>
          {isEditingCustomName ? (
            <div className="space-y-2">
              <Input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="예: 우리 단골 카페, 작업하기 좋은 곳"
                maxLength={100}
                className="w-full"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateCustomName}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setCustomName(place?.customName || '');
                    setIsEditingCustomName(false);
                  }}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <p className="text-foreground">
              {customName || <span className="text-muted-foreground">별칭을 추가해보세요</span>}
            </p>
          )}
        </section>

        {/* 메모 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">메모</h3>
            {!isEditingNote && (
              <button
                onClick={() => setIsEditingNote(true)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {note ? '수정' : '추가'}
              </button>
            )}
          </div>
          {isEditingNote ? (
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="이 장소에 대한 메모를 남겨보세요. (가고싶은 이유, 추천받은 내용 등)"
                maxLength={2000}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-foreground bg-background placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{note.length}/2000</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateNote}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setNote(place?.note || '');
                      setIsEditingNote(false);
                    }}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-foreground whitespace-pre-wrap">
              {note || <span className="text-muted-foreground">메모를 추가해보세요</span>}
            </p>
          )}
        </section>

        {/* 기본 정보 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{place.name}</h2>
              <p className="text-muted-foreground">{getCategoryLabel(place.category)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-foreground">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{place.address}</span>
              </div>

              {place.phone && (
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="w-5 h-5 flex-shrink-0" />
                  <a href={`tel:${place.phone}`} className="hover:text-primary-600">
                    {place.phone}
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={openMapLink}
              className="w-full px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              지도에서 보기
            </button>
          </div>
        </section>

        {/* 방문 여부 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">방문 여부</h3>
              <button
                onClick={handleToggleVisit}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  place.visited ? 'bg-primary-600' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                    place.visited ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {place.visited && (
              <div className="space-y-3">
                {place.visitedAt && (
                  <p className="text-sm text-muted-foreground">
                    방문 날짜: {new Date(place.visitedAt).toLocaleDateString('ko-KR')}
                  </p>
                )}

                <div>
                  <textarea
                    value={visitNote}
                    onChange={(e) => setVisitNote(e.target.value)}
                    onBlur={handleUpdateVisitNote}
                    placeholder="방문 소감을 남겨보세요..."
                    maxLength={500}
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-foreground bg-background placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{visitNote.length}/500</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 라벨 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-3">라벨</h3>
          <div className="flex flex-wrap gap-2">
            {place.labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
              >
                {label}
                <button
                  onClick={() => handleRemoveLabel(label)}
                  className="hover:bg-primary-100 rounded-full p-0.5"
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
                  onBlur={() => {
                    if (!newLabel.trim()) setIsAddingLabel(false);
                  }}
                  placeholder="라벨 입력"
                  maxLength={20}
                  autoFocus
                  className="px-3 py-1 rounded-full text-sm w-32"
                />
              </form>
            ) : (
              place.labels.length < 5 && (
                <button
                  onClick={() => setIsAddingLabel(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-foreground rounded-full text-sm hover:bg-muted transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  추가
                </button>
              )
            )}
          </div>
          {place.labels.length >= 5 && (
            <p className="text-xs text-muted-foreground mt-2">라벨은 최대 5개까지 추가할 수 있습니다.</p>
          )}
        </section>

        {/* 카테고리 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">카테고리</h3>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              변경
            </button>
          </div>
          <p className="text-foreground mt-2">{getCategoryLabel(place.category)}</p>
        </section>

        {/* 목록 관리 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-3">포함된 목록</h3>

          {includedLists.length > 0 ? (
            <div className="space-y-2 mb-4">
              {includedLists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{list.iconValue}</span>
                    <span className="font-medium text-foreground">{list.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFromList(list.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    제거
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm mb-4">아직 포함된 목록이 없습니다.</p>
          )}

          <button
            onClick={() => setShowListModal(true)}
            className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            목록에 추가
          </button>
        </section>

        {/* 리뷰 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              공개 리뷰 ({reviews.length})
            </h3>
            <button
              onClick={() => {
                setEditingReview(undefined);
                setShowReviewForm(!showReviewForm);
              }}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              리뷰 작성
            </button>
          </div>

          {showReviewForm && (
            <div className="mb-6 p-4 bg-background rounded-lg border border-border">
              <h4 className="text-md font-semibold text-foreground mb-4">
                {editingReview ? '리뷰 수정' : '새 리뷰 작성'}
              </h4>
              <ReviewForm
                existingReview={editingReview}
                onSubmit={handleReviewSubmit}
                onCancel={() => {
                  setShowReviewForm(false);
                  setEditingReview(undefined);
                }}
                isSubmitting={isSubmittingReview}
              />
            </div>
          )}

          {isLoadingReviews ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : (
            <ReviewList
              reviews={reviews}
              isMyReviews={false}
            />
          )}
        </section>

        {/* 위험 영역 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-red-200">
          <h3 className="text-lg font-semibold text-foreground mb-3">위험 영역</h3>
          <p className="text-sm text-muted-foreground mb-4">
            장소를 삭제하면 복구할 수 없습니다. 이 장소가 포함된 모든 목록에서도 제거됩니다.
          </p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            장소 삭제하기
          </button>
        </section>
      </div>

      {/* 카테고리 선택 모달 */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-card rounded-t-2xl p-6 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">카테고리 선택</h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleUpdateCategory(cat.value)}
                  className={`w-full px-4 py-3 text-left rounded-lg hover:bg-background transition-colors flex items-center gap-3 ${
                    place.category === cat.value ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 목록 선택 모달 */}
      {showListModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50"
          onClick={() => setShowListModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-card rounded-t-2xl p-6 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">목록 선택</h3>
            {availableLists.length > 0 ? (
              <div className="space-y-1">
                {availableLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => {
                      handleAddToList(list.id);
                      setShowListModal(false);
                    }}
                    className="w-full px-4 py-3 text-left rounded-lg hover:bg-background transition-colors flex items-center gap-3"
                  >
                    <span className="text-2xl">{list.iconValue}</span>
                    <span className="font-medium">{list.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">추가할 수 있는 목록이 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="장소 삭제"
        message={place ? `"${place.name}"을(를) 삭제하시겠습니까?\n이 장소가 포함된 목록에서도 제거됩니다.` : '장소를 삭제하시겠습니까?'}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
