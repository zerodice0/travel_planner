export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isCustom: boolean;
  placesCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CreateCategoryData {
  name: string;
  color: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
}
