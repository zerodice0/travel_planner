import { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Place } from './types';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
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
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, []);

  const createPlace = async (placeData: Omit<Place, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('인증된 사용자만 장소를 추가할 수 있습니다.');
      }
      
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
    } catch (err) {
      console.error('장소 삭제 오류:', err);
      throw err;
    }
  };

  return {
    places,
    loading,
    error,
    createPlace,
    updatePlace,
    deletePlace
  };
}