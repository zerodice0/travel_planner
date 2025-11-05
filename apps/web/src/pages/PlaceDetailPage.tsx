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
  Edit2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HTTPError } from 'ky';
import Input from '#components/ui/Input';
import { ConfirmDialog } from '#components/ui/ConfirmDialog';
import { placesApi, listsApi, reviewsApi, publicPlacesApi } from '#lib/api';
import type { PlaceDetail, PlaceListSummary } from '#types/place';
import type { PublicPlaceDetail } from '#types/publicPlace';
import type { List } from '#types/list';
import type { Review, CreateReviewData, UpdateReviewData } from '#types/review';
import { ReviewList } from '#components/reviews/ReviewList';
import { ReviewForm } from '#components/reviews/ReviewForm';
import { useAuth } from '#contexts/AuthContext';

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

/**
 * PublicPlaceDetail을 PlaceDetail로 변환하는 함수
 * PublicPlace에는 개인화 정보가 없으므로 기본값으로 설정
 */
function convertPublicPlaceToPlaceDetail(publicPlace: PublicPlaceDetail): PlaceDetail {
  return {
    id: publicPlace.id,
    name: publicPlace.name,
    category: publicPlace.category,
    address: publicPlace.address,
    phone: publicPlace.phone,
    latitude: publicPlace.latitude,
    longitude: publicPlace.longitude,
    description: publicPlace.description,
    externalUrl: publicPlace.externalUrl,
    externalId: publicPlace.externalId,
    createdAt: publicPlace.createdAt,
    updatedAt: publicPlace.updatedAt,
    // PlaceDetail 전용 필드 (기본값)
    visited: false,
    labels: [],
    photos: publicPlace.photos || [],
  };
}

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [isPublicPlace, setIsPublicPlace] = useState(false);
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
  const [isAddingToMyPlaces, setIsAddingToMyPlaces] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [showCancelReviewDialog, setShowCancelReviewDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setIsPublicPlace(false); // Reset public place flag

      let placeData: PlaceDetail | null = null;
      let isPublic = false;

      // 먼저 UserPlace API 호출 시도
      try {
        placeData = await placesApi.getOne(id);
        isPublic = false;
      } catch (userPlaceError) {
        // UserPlace 조회 실패 시 PublicPlace API로 폴백
        console.log('UserPlace not found, trying PublicPlace API...');

        // HTTPError 체크 및 404인 경우만 PublicPlace API 시도
        if (userPlaceError instanceof Error && 'response' in userPlaceError) {
          const httpError = userPlaceError as { response?: { status?: number } };

          if (httpError.response?.status === 404) {
            try {
              const publicPlaceData = await publicPlacesApi.getOne(id);
              placeData = convertPublicPlaceToPlaceDetail(publicPlaceData);
              isPublic = true;
              console.log('PublicPlace loaded successfully');
            } catch (publicPlaceError) {
              console.error('Failed to fetch public place:', publicPlaceError);
              toast.error('장소를 찾을 수 없습니다. 삭제되었거나 접근 권한이 없습니다.');
              setPlace(null);
              setIsLoading(false);
              return;
            }
          } else if (httpError.response?.status === 401) {
            toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
            setPlace(null);
            setIsLoading(false);
            return;
          } else {
            toast.error('장소 정보를 불러오는 중 문제가 발생했습니다.');
            setPlace(null);
            setIsLoading(false);
            return;
          }
        } else {
          toast.error('장소 정보를 불러오는 중 문제가 발생했습니다.');
          setPlace(null);
          setIsLoading(false);
          return;
        }
      }

      // 장소 데이터 설정
      if (placeData) {
        setPlace(placeData);
        setIsPublicPlace(isPublic);
        setVisitNote(placeData.visitNote || '');
        setCustomName(placeData.customName || '');
        setNote(placeData.note || '');

        // 리뷰 가져오기
        await fetchReviews();

        // PublicPlace가 아닌 경우에만 목록 정보 로드
        if (!isPublic) {
          // Promise.allSettled를 사용하여 목록 정보를 독립적으로 처리
          const [listsResult, allListsResult] = await Promise.allSettled([
            placesApi.getLists(id),
            listsApi.getAll({ limit: 100 }),
          ]);

          // 포함된 목록 처리
          if (listsResult.status === 'fulfilled') {
            setIncludedLists(listsResult.value.lists);
          } else {
            console.warn('Failed to fetch included lists:', listsResult.reason);
            setIncludedLists([]);
          }

          // 전체 목록 처리
          if (allListsResult.status === 'fulfilled') {
            setAllLists(allListsResult.value.lists);
          } else {
            console.warn('Failed to fetch all lists:', allListsResult.reason);
            setAllLists([]);
          }
        } else {
          // PublicPlace인 경우 목록 정보 초기화
          setIncludedLists([]);

          // 전체 목록은 로드 (내 장소에 추가 기능을 위해)
          try {
            const allListsData = await listsApi.getAll({ limit: 100 });
            setAllLists(allListsData.lists);
          } catch (error) {
            console.warn('Failed to fetch all lists:', error);
            setAllLists([]);
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchData:', error);
      toast.error('예상치 못한 오류가 발생했습니다.');
      setPlace(null);
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

      if (error instanceof HTTPError) {
        const status = error.response.status;

        if (status === 403) {
          toast.error('이메일 인증 후 리뷰를 작성할 수 있습니다.');
        } else if (status === 404) {
          toast.error('장소를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        } else {
          toast.error('리뷰 작성에 실패했습니다.');
        }
      } else {
        toast.error('리뷰 작성에 실패했습니다.');
      }
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
    // 성공 시 content 초기화
    setReviewContent('');
  };

  const handleCancelReview = () => {
    // 작성 중인 내용이 있는지 확인
    if (reviewContent.trim()) {
      // 확인 다이얼로그 표시
      setShowCancelReviewDialog(true);
    } else {
      // 내용 없으면 바로 폼 닫기
      setShowReviewForm(false);
      setEditingReview(undefined);
      setReviewContent('');
    }
  };

  const handleConfirmCancelReview = () => {
    // 확인 → 폼 닫기 + 내용 삭제
    setShowReviewForm(false);
    setEditingReview(undefined);
    setReviewContent('');
    setShowCancelReviewDialog(false);
  };

  const handleDismissCancelDialog = () => {
    // 취소 → 다이얼로그만 닫기
    setShowCancelReviewDialog(false);
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

  const handleAddToMyPlaces = async () => {
    if (!place || !isPublicPlace) return;

    setIsAddingToMyPlaces(true);
    try {
      // PublicPlace를 CreatePlaceData 형식으로 변환
      const createData = {
        name: place.name,
        address: place.address,
        phone: place.phone,
        latitude: place.latitude,
        longitude: place.longitude,
        category: place.category,
        description: place.description,
        externalUrl: place.externalUrl,
        externalId: place.externalId,
      };

      // 내 장소에 추가
      const newUserPlace = await placesApi.create(createData);
      toast.success(`"${place.name}"이(가) 내 장소에 추가되었습니다.`);

      // UserPlace 상세 페이지로 이동 (새로 생성된 UserPlace ID 사용)
      navigate(`/places/${newUserPlace.id}`, { replace: true });

      // 페이지 새로고침하여 UserPlace로 표시
      await fetchData();
    } catch (error) {
      console.error('Failed to add to my places:', error);
      toast.error('내 장소에 추가하는데 실패했습니다.');
    } finally {
      setIsAddingToMyPlaces(false);
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
              장소를 찾을 수 없습니다
            </h1>
            <div className="w-10" /> {/* Spacer for center alignment */}
          </div>
        </header>

        {/* Error Content */}
        <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-foreground">장소를 찾을 수 없습니다</h2>
            <p className="text-muted-foreground max-w-md">
              요청하신 장소가 삭제되었거나 접근 권한이 없습니다.
              <br />
              다른 장소를 확인해보세요.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4 inline-block mr-2" />
                이전 페이지로
              </button>
              <button
                onClick={() => navigate('/map')}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                <MapPin className="w-4 h-4 inline-block mr-2" />
                지도로 이동
              </button>
            </div>
          </div>
        </div>
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
          {/* 메뉴는 UserPlace일 때만 표시 */}
          {!isPublicPlace ? (
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
                      // NOTE: Edit functionality will be implemented in Phase 2
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
          ) : (
            /* Spacer for center alignment */
            <div className="w-10" />
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* PublicPlace 안내 배너 */}
        {isPublicPlace && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">ℹ️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">공개 장소</h3>
                <p className="text-sm text-blue-700">
                  이 장소는 모든 사용자가 공유하는 공개 장소입니다. 내 장소에 추가하여 개인화된 정보를 관리할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 별칭 섹션 - UserPlace만 */}
        {!isPublicPlace && (
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
        )}

        {/* 메모 섹션 - UserPlace만 */}
        {!isPublicPlace && (
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
        )}

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

        {/* 방문 여부 섹션 - UserPlace만 */}
        {!isPublicPlace && (
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
        )}

        {/* 라벨 섹션 - UserPlace만 */}
        {!isPublicPlace && (
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
        )}

        {/* 카테고리 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">카테고리</h3>
            {/* 변경 버튼은 UserPlace일 때만 표시 */}
            {!isPublicPlace && (
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                변경
              </button>
            )}
          </div>
          <p className="text-foreground mt-2">{getCategoryLabel(place.category)}</p>
        </section>

        {/* 목록 관리 섹션 - UserPlace만 */}
        {!isPublicPlace && (
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
        )}

        {/* 내 장소에 추가 섹션 - PublicPlace일 때만 */}
        {isPublicPlace && (
          <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">내 장소에 추가</h3>
            <p className="text-sm text-muted-foreground mb-4">
              이 장소를 내 장소에 추가하여 별칭, 메모, 방문 기록 등 개인화된 정보를 관리할 수 있습니다.
            </p>
            <button
              onClick={handleAddToMyPlaces}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAddingToMyPlaces}
            >
              <Plus className="w-4 h-4" />
              {isAddingToMyPlaces ? '추가 중...' : '내 장소에 추가'}
            </button>
          </section>
        )}

        {/* 리뷰 섹션 */}
        <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              공개 리뷰 ({reviews.length})
            </h3>
            {user?.emailVerified ? (
              <button
                onClick={() => {
                  if (showReviewForm) {
                    // 폼 닫기 시도 (취소)
                    handleCancelReview();
                  } else {
                    // 폼 열기
                    setEditingReview(undefined);
                    setReviewContent('');  // 초기화
                    setShowReviewForm(true);
                  }
                }}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                {showReviewForm ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    취소
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    리뷰 작성
                  </>
                )}
              </button>
            ) : (
              <div className="text-sm text-muted-foreground px-4 py-2 bg-muted rounded-lg">
                이메일 인증 후 리뷰 작성 가능
              </div>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-6 p-4 bg-background rounded-lg border border-border">
              <h4 className="text-md font-semibold text-foreground mb-4">
                {editingReview ? '리뷰 수정' : '새 리뷰 작성'}
              </h4>
              <ReviewForm
                existingReview={editingReview}
                content={reviewContent}
                onContentChange={setReviewContent}
                onSubmit={handleReviewSubmit}
                onCancel={handleCancelReview}
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

        {/* 위험 영역 섹션 - UserPlace만 */}
        {!isPublicPlace && (
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
        )}
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

      {/* 리뷰 취소 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showCancelReviewDialog}
        onClose={handleDismissCancelDialog}
        onConfirm={handleConfirmCancelReview}
        title="리뷰 작성 취소"
        message="작성 중인 리뷰가 삭제됩니다. 계속하시겠습니까?"
        confirmText="삭제"
        cancelText="계속 작성"
        variant="warning"
      />
    </div>
  );
}
