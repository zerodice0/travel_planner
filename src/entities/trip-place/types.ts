import { Place } from '../place/types';
import { Trip } from '../trip/types';

export interface TripPlace {
  id: string;
  trip_id: string;
  place_id: string;
  custom_label?: string | null;
  priority: number;
  status: 'planned' | 'visited' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // 조인된 데이터
  places_of_interest?: Place;
  trips?: Trip;
}

export type CreateTripPlaceData = Omit<TripPlace, 'id' | 'created_at' | 'updated_at' | 'place' | 'trip'>;

export type UpdateTripPlaceData = Partial<Pick<TripPlace, 'custom_label' | 'priority' | 'status' | 'notes'>>;

// 여행에 장소를 추가할 때 사용하는 데이터
export interface AddPlaceToTripData {
  trip_id: string;
  place_id: string;
  custom_label?: string;
  priority?: number;
  status?: 'planned' | 'visited' | 'cancelled';
  notes?: string;
} 