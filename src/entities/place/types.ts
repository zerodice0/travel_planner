// src/entities/place/types.ts
export interface Place {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: string; // 음식점, 관광지, 쇼핑, 숙소 등
  notes: string | null;
  rating: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type CreatePlaceData = Omit<Place, 'id' | 'created_at' | 'updated_at' | 'owner_id'>;