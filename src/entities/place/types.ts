export interface Place {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: string;
  memo: string | null;
  rating: number | null;
  is_public: boolean;
  custom_label?: string | null;
  created_at: string;
  updated_at: string;
}

export type CreatePlaceData = Omit<Place, 'id' | 'created_at' | 'updated_at' | 'owner_id'>;