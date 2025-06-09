import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/api/supabase';
import { TripPlace, UpdateTripPlaceData, AddPlaceToTripData } from './types';

// 특정 여행의 장소들을 가져오는 훅
export function useTripPlaces(tripId: string) {
  const [tripPlaces, setTripPlaces] = useState<TripPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    
    async function fetchTripPlaces() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('trip_places')
          .select(`
            *,
            places_of_interest!place_id(*),
            trips!trip_id(*)
          `)
          .eq('trip_id', tripId)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        setTripPlaces(data || []);
      } catch (err) {
        console.error('여행 장소 불러오기 오류:', err);
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchTripPlaces();
  }, [tripId]);

  const addPlaceToTrip = useCallback(async (data: AddPlaceToTripData) => {
    try {
      const { data: newTripPlace, error } = await supabase
        .from('trip_places')
        .insert({
          trip_id: data.trip_id,
          place_id: data.place_id,
          custom_label: data.custom_label || null,
          priority: data.priority || 0,
          status: data.status || 'planned',
          notes: data.notes || null
        })
        .select(`
          *,
          places_of_interest!place_id(*),
          trips!trip_id(*)
        `)
        .single();
      
      if (error) throw error;
      
      setTripPlaces(prev => [newTripPlace as TripPlace, ...prev]);
      return newTripPlace as TripPlace;
    } catch (err) {
      console.error('여행에 장소 추가 오류:', err);
      throw err;
    }
  }, []);

  const updateTripPlace = useCallback(async (id: string, updates: UpdateTripPlaceData) => {
    try {
      const { data, error } = await supabase
        .from('trip_places')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          places_of_interest!place_id(*),
          trips!trip_id(*)
        `)
        .single();
      
      if (error) throw error;
      
      setTripPlaces(prev => 
        prev.map(tripPlace => tripPlace.id === id ? (data as TripPlace) : tripPlace)
      );
      
      return data as TripPlace;
    } catch (err) {
      console.error('여행 장소 업데이트 오류:', err);
      throw err;
    }
  }, []);

  const removePlaceFromTrip = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('trip_places')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTripPlaces(prev => prev.filter(tripPlace => tripPlace.id !== id));
    } catch (err) {
      console.error('여행에서 장소 제거 오류:', err);
      throw err;
    }
  }, []);

  const updatePlacePriority = useCallback(async (id: string, priority: number) => {
    return updateTripPlace(id, { priority });
  }, [updateTripPlace]);

  const updatePlaceStatus = useCallback(async (id: string, status: 'planned' | 'visited' | 'cancelled') => {
    return updateTripPlace(id, { status });
  }, [updateTripPlace]);

  return {
    tripPlaces,
    loading,
    error,
    addPlaceToTrip,
    updateTripPlace,
    removePlaceFromTrip,
    updatePlacePriority,
    updatePlaceStatus
  };
}

// 특정 장소가 포함된 여행들을 가져오는 훅
export function usePlaceTrips(placeId: string) {
  const [placeTrips, setPlaceTrips] = useState<TripPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;
    
    async function fetchPlaceTrips() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('trip_places')
          .select(`
            *,
            places_of_interest!place_id(*),
            trips!trip_id(*)
          `)
          .eq('place_id', placeId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPlaceTrips(data || []);
      } catch (err) {
        console.error('장소의 여행 목록 불러오기 오류:', err);
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchPlaceTrips();
  }, [placeId]);

  return {
    placeTrips,
    loading,
    error
  };
}

// 사용자의 모든 여행 장소를 가져오는 훅 (선택적)
export function useAllUserTripPlaces() {
  const [allTripPlaces, setAllTripPlaces] = useState<TripPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllTripPlaces() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('trip_places')
          .select(`
            *,
            places_of_interest!place_id(*),
            trips!trip_id(*)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setAllTripPlaces(data || []);
      } catch (err) {
        console.error('모든 여행 장소 불러오기 오류:', err);
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchAllTripPlaces();
  }, []);

  return {
    allTripPlaces,
    loading,
    error
  };
} 