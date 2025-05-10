export interface Trip {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  is_completed: boolean;
  is_public: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  // 조인을 위한 필드 추가
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

// 여행 생성 시 필요한 데이터 타입
export type CreateTripData = Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'is_completed'>;