import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MoreVertical, Edit2, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '#components/ui/Input';
import { categoriesApi } from '#lib/api';
import type { Category, CreateCategoryData } from '#types/category';

const COLOR_PALETTE = [
  { name: '빨강', value: '#FF6B6B' },
  { name: '주황', value: '#FF8C42' },
  { name: '노랑', value: '#FFE66D' },
  { name: '초록', value: '#38A169' },
  { name: '청록', value: '#4ECDC4' },
  { name: '파랑', value: '#5D5FEF' },
  { name: '보라', value: '#9B59B6' },
  { name: '분홍', value: '#FFB3BA' },
  { name: '갈색', value: '#A0522D' },
  { name: '회색', value: '#95A5A6' },
  { name: '검정', value: '#2C3E50' },
  { name: '하늘', value: '#87CEEB' },
];

export default function CategoryManagementPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [contextMenuCategoryId, setContextMenuCategoryId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#FF6B6B');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoriesApi.getAll();
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('카테고리를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormColor('#FF6B6B');
    setShowFormModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormColor(category.color);
    setShowFormModal(true);
    setContextMenuCategoryId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    if (formName.length > 20) {
      toast.error('카테고리 이름은 최대 20자까지 입력할 수 있습니다.');
      return;
    }

    try {
      const data: CreateCategoryData = {
        name: formName.trim(),
        color: formColor,
      };

      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, data);
        toast.success('카테고리를 수정했습니다.');
      } else {
        await categoriesApi.create(data);
        toast.success('카테고리를 생성했습니다.');
      }

      setShowFormModal(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      const message = error.response?.data?.message || (editingCategory ? '카테고리 수정에 실패했습니다.' : '카테고리 생성에 실패했습니다.');
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategoryId) return;

    try {
      await categoriesApi.delete(deletingCategoryId);
      toast.success('카테고리를 삭제했습니다.');
      setShowDeleteDialog(false);
      setDeletingCategoryId(null);
      setContextMenuCategoryId(null);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      const message = error.response?.data?.message || '카테고리 삭제에 실패했습니다.';
      toast.error(message);
    }
  };

  const defaultCategories = categories.filter((c) => !c.isCustom);
  const customCategories = categories.filter((c) => c.isCustom);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1 text-center mx-4">
            카테고리 관리
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Default Categories */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">기본 카테고리</h2>
          <div className="space-y-2">
            {defaultCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="font-medium text-foreground">{category.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{category.placesCount}개</span>
              </div>
            ))}
          </div>
        </section>

        {/* Custom Categories */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">내 카테고리</h2>
          {customCategories.length > 0 ? (
            <div className="space-y-2">
              {customCategories.map((category) => (
                <div
                  key={category.id}
                  className="relative flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-medium text-foreground">{category.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{category.placesCount}개</span>
                    <button
                      onClick={() =>
                        setContextMenuCategoryId(
                          contextMenuCategoryId === category.id ? null : category.id
                        )
                      }
                      className="p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Context Menu */}
                  {contextMenuCategoryId === category.id && (
                    <div className="absolute top-12 right-4 w-32 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                      <button
                        onClick={() => openEditModal(category)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-background flex items-center gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        편집
                      </button>
                      <button
                        onClick={() => {
                          setDeletingCategoryId(category.id);
                          setShowDeleteDialog(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-background text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Tag className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">아직 생성된 카테고리가 없습니다.</p>
              <p className="text-sm text-muted-foreground mb-6">나만의 카테고리를 만들어보세요!</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                카테고리 만들기
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Floating Button */}
      {customCategories.length > 0 && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-20 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center z-20"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowFormModal(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-2xl md:rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-foreground mb-6">
              {editingCategory ? '카테고리 편집' : '새 카테고리 만들기'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div>
                <Input
                  type="text"
                  label={<>이름 <span className="text-red-500">*</span></>}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: 데이트"
                  maxLength={20}
                  fullWidth
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">{formName.length}/20</p>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">색상</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormColor(color.value)}
                      className={`w-full aspect-square rounded-lg transition-all ${
                        formColor === color.value ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    ></button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  {editingCategory ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingCategoryId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">카테고리 삭제</h3>
            <p className="text-muted-foreground mb-4">
              '{categories.find((c) => c.id === deletingCategoryId)?.name}'을(를) 삭제하시겠습니까?
              <br />
              <span className="text-sm text-muted-foreground">
                이 카테고리의 장소는 '기타'로 이동됩니다.
              </span>
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
    </div>
  );
}
