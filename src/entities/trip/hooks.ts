import { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Trip } from './types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setTrips(data || []);
      } catch (err) {
        console.error('여행 불러오기 오류:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
		// src/entities/trip/hooks.ts (계속)
    fetchTrips();
  }, []);

  const createTrip = async (tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'is_completed'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('인증된 사용자만 여행을 생성할 수 있습니다.');
      }
      
      const { data, error } = await supabase
        .from('trips')
        .insert({
          ...tripData,
          owner_id: user.id,
          is_completed: false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setTrips(prev => [data as Trip, ...prev]);
      return data as Trip;
    } catch (err) {
      console.error('여행 생성 오류:', err);
      throw err;
    }
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setTrips(prev => 
        prev.map(trip => trip.id === id ? (data as Trip) : trip)
      );
      
      return data as Trip;
    } catch (err) {
      console.error('여행 업데이트 오류:', err);
      throw err;
    }
  };

  const deleteTrip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTrips(prev => prev.filter(trip => trip.id !== id));
    } catch (err) {
      console.error('여행 삭제 오류:', err);
      throw err;
    }
  };

  const completeTrip = async (id: string) => {
    return updateTrip(id, { is_completed: true });
  };

  return {
    trips,
    loading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    completeTrip
  };
}

// 단일 여행 정보를 가져오는 훅
export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrip() {
      if (!tripId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();
        
        if (error) throw error;
        
        setTrip(data);
      } catch (err) {
        console.error('여행 정보 불러오기 오류:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId]);

  return { trip, loading, error };
}