import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, ArrowUpDown, Edit2, Trash2, FolderOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import AppLayout from '#components/layout/AppLayout';
import { listsApi } from '#lib/api';
import type { List, CreateListData } from '#types/list';
import { LIST_ICONS, getListIcon } from '#utils/listIconConfig';

export default function ListManagementPage() {
  const navigate = useNavigate();

  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'createdAt'>('updatedAt');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [contextMenuListId, setContextMenuListId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconType, setFormIconType] = useState<'category' | 'image'>('category');
  const [formIconValue, setFormIconValue] = useState('travel');

  const fetchLists = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listsApi.getAll({ sort: sortBy });
      setLists(data.lists);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
      toast.error('목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);



  const openCreateModal = () => {
    setEditingList(null);
    setFormName('');
    setFormDescription('');
    setFormIconType('category');
    setFormIconValue('travel');
    setShowFormModal(true);
  };

  const openEditModal = (list: List) => {
    setEditingList(list);
    setFormName(list.name);
    setFormDescription(list.description || '');
    setFormIconType(list.iconType as 'category' | 'image');
    setFormIconValue(list.iconValue);
    setShowFormModal(true);
    setContextMenuListId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error('목록 이름을 입력해주세요.');
      return;
    }

    if (formName.length > 50) {
      toast.error('목록 이름은 최대 50자까지 입력할 수 있습니다.');
      return;
    }

    if (formDescription.length > 200) {
      toast.error('설명은 최대 200자까지 입력할 수 있습니다.');
      return;
    }

    try {
      const data: CreateListData = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        icon: {
          type: formIconType,
          value: formIconValue,
        },
      };

      if (editingList) {
        await listsApi.update(editingList.id, data);
        toast.success('목록을 수정했습니다.');
      } else {
        await listsApi.create(data);
        toast.success('목록을 생성했습니다.');
      }

      setShowFormModal(false);
      fetchLists();
    } catch (error) {
      console.error('Failed to save list:', error);
      toast.error(editingList ? '목록 수정에 실패했습니다.' : '목록 생성에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deletingListId) return;

    try {
      await listsApi.delete(deletingListId);
      toast.success('목록을 삭제했습니다.');
      setShowDeleteDialog(false);
      setDeletingListId(null);
      setContextMenuListId(null);
      fetchLists();
    } catch (error) {
      console.error('Failed to delete list:', error);
      toast.error('목록 삭제에 실패했습니다.');
    }
  };

  const getProgressPercent = (list: List) => {
    if (list.placesCount === 0) return 0;
    return Math.round((list.visitedCount / list.placesCount) * 100);
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'updatedAt':
        return '최근 수정순';
      case 'name':
        return '이름순';
      case 'createdAt':
        return '생성일순';
      default:
        return '정렬';
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="내 목록">
        <div className="max-w-screen-lg mx-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-full mb-4 mx-auto"></div>
                <div className="w-24 h-4 bg-muted rounded mb-2 mx-auto"></div>
                <div className="w-16 h-3 bg-muted rounded mb-3 mx-auto"></div>
                <div className="w-full h-2 bg-muted rounded-full mb-2"></div>
                <div className="w-20 h-3 bg-muted rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="내 목록">
      <div className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* 정렬 버튼 */}
        <div className="flex justify-end mb-4">
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-lg hover:bg-background transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm font-medium">{getSortLabel(sortBy)}</span>
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                <button
                  onClick={() => {
                    setSortBy('updatedAt');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-background ${
                    sortBy === 'updatedAt' ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  최근 수정순
                </button>
                <button
                  onClick={() => {
                    setSortBy('name');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-background ${
                    sortBy === 'name' ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  이름순
                </button>
                <button
                  onClick={() => {
                    setSortBy('createdAt');
                    setShowSortMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-background ${
                    sortBy === 'createdAt' ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  생성일순
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 목록 그리드 */}
        {lists.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {lists.map((list) => (
              <div
                key={list.id}
                className="relative bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/lists/${list.id}`)}
              >
                {/* 컨텍스트 메뉴 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenuListId(contextMenuListId === list.id ? null : list.id);
                  }}
                  className="absolute top-3 right-3 p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* 컨텍스트 메뉴 */}
                {contextMenuListId === list.id && (
                  <div
                    className="absolute top-10 right-3 w-32 bg-card rounded-lg shadow-lg border border-border py-1 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEditModal(list)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background flex items-center gap-2"
                    >
                      <Edit2 className="w-3 h-3" />
                      편집
                    </button>
                    <button
                      onClick={() => {
                        setDeletingListId(list.id);
                        setShowDeleteDialog(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      삭제
                    </button>
                  </div>
                )}

                {/* 아이콘 */}
                <div className="flex justify-center mb-4">
                  {list.iconType === 'category' ? (
                    (() => {
                      const Icon = getListIcon(list.iconValue);
                      return <Icon className="w-16 h-16 text-primary-600" />;
                    })()
                  ) : list.iconType === 'emoji' ? (
                    <span className="text-5xl">{list.iconValue}</span>
                  ) : (
                    <img
                      src={list.iconValue}
                      alt={list.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                </div>

                {/* 이름 */}
                <h3 className="text-center font-semibold text-foreground mb-1 truncate">
                  {list.name}
                </h3>

                {/* 설명 */}
                {list.description && (
                  <p className="text-center text-sm text-muted-foreground mb-3 line-clamp-1">
                    {list.description}
                  </p>
                )}

                {/* 진행률 바 */}
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${getProgressPercent(list)}%` }}
                  ></div>
                </div>

                {/* 장소 수 및 방문 정보 */}
                <p className="text-center text-xs text-muted-foreground">
                  {list.placesCount}개 · {list.visitedCount}/{list.placesCount}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* 빈 상태 */
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">아직 생성된 목록이 없습니다.</p>
            <p className="text-sm text-muted-foreground mb-6">
              첫 목록을 만들어 장소를 관리해보세요!
            </p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              첫 목록 만들기
            </button>
          </div>
        )}
      </div>

      {/* 플로팅 버튼 */}
      {lists.length > 0 && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-20 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center z-20"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* 목록 생성/편집 모달 */}
      {showFormModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowFormModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-card rounded-t-2xl md:rounded-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {editingList ? '목록 편집' : '새 목록 만들기'}
              </h2>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* 스크롤 가능한 컨텐츠 영역 */}
            <div className="overflow-y-auto px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이름 입력 */}
              <div>
                <Input
                  type="text"
                  label={<>이름 <span className="text-red-500">*</span></>}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: 제주도 여행, 맛집 탐방"
                  maxLength={50}
                  fullWidth
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">{formName.length}/50</p>
              </div>

              {/* 설명 입력 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  설명 (선택)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="목록에 대한 설명을 입력하세요"
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-foreground bg-background placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">{formDescription.length}/200</p>
              </div>

              {/* 아이콘 선택 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-4">아이콘 선택</label>

                {/* 목록 아이콘 선택 */}
                <div className="grid grid-cols-3 gap-3">
                  {LIST_ICONS.map((listIcon) => {
                    const Icon = listIcon.icon;
                    const isSelected = formIconValue === listIcon.value;
                    return (
                      <button
                        key={listIcon.value}
                        type="button"
                        onClick={() => setFormIconValue(listIcon.value)}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-border hover:border-primary-300 hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-8 h-8" />
                        <span className="text-sm font-medium">{listIcon.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              </form>
            </div>

            {/* 하단 버튼 (스크롤 영역 밖에 고정) */}
            <div className="flex gap-3 p-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                {editingList ? '수정' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && deletingListId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">목록 삭제</h3>
            <p className="text-muted-foreground mb-4">
              '{lists.find((l) => l.id === deletingListId)?.name}'을(를) 삭제하시겠습니까?
              <br />
              <span className="text-sm text-muted-foreground">목록 내 장소는 삭제되지 않습니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
