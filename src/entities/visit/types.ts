import { Place } from '../place/types';

export interface Visit {
  id: string;
  trip_id: string;
  place_id: string | null;
  custom_place_name: string | null;
  custom_place_lat: number | null;
  custom_place_lng: number | null;
  visit_time: string;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  places_of_interest?: Place | null;
}

export type CreateVisitData = Omit<Visit, 'id' | 'created_at' | 'updated_at'>;