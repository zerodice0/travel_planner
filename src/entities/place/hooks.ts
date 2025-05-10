// src/entities/place/hooks.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Place, CreatePlaceData } from './types';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaces() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('places_of_interest')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPlaces(data || []);
      } catch (err) {
        console.error('관심 장소 불러오기 오류:', err);
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, []);

  const createPlace = async (placeData: CreatePlaceData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('인증된 사용자만 장소를 추가할 수 있습니다.');
      }
      
      // 프로필 존재 여부 확인 및 생성 로직 (필요시)
      
      const { data, error } = await supabase
        .from('places_of_interest')
        .insert({
          ...placeData,
          owner_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setPlaces(prev => [data as Place, ...prev]);
      return data as Place;
    } catch (err) {
      console.error('장소 추가 오류:', err);
      throw err;
    }
  };

  const updatePlace = async (id: string, updates: Partial<Place>) => {
    try {
      const { data, error } = await supabase
        .from('places_of_interest')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setPlaces(prev => 
        prev.map(place => place.id === id ? (data as Place) : place)
      );
      
      // 선택된 장소도 업데이트
      if (selectedPlace && selectedPlace.id === id) {
        setSelectedPlace(data as Place);
      }
      
      return data as Place;
    } catch (err) {
      console.error('장소 업데이트 오류:', err);
      throw err;
    }
  };

  const deletePlace = async (id: string) => {
    try {
      const { error } = await supabase
        .from('places_of_interest')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPlaces(prev => prev.filter(place => place.id !== id));
      
      // 선택된 장소가 삭제된 경우 선택 해제
      if (selectedPlace && selectedPlace.id === id) {
        setSelectedPlace(null);
      }
    } catch (err) {
      console.error('장소 삭제 오류:', err);
      throw err;
    }
  };

  const selectPlace = (place: Place | null) => {
    setSelectedPlace(place);
  };

  return {
    places,
    selectedPlace,
    loading,
    error,
    createPlace,
    updatePlace,
    deletePlace,
    selectPlace
  };
}