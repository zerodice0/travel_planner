import { Place } from '@/entities/place/types';

export interface PlaceMapProps {
  places: Place[];
  userLocation?: { lat: number; lng: number } | null;
  selectedPlace?: Place | null;
  initialCenter?: { lat: number; lng: number } | null;
  onPlaceAdd?: (placeData: Omit<Place, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => Promise<void>;
  onPlaceSelect?: (place: Place) => void;
  onPlaceUpdate?: (place: Place) => Promise<void>;
}