import { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Visit } from './types';

// 특정 여행의 방문 기록을 모두 가져오는 훅
export function useVisits(tripId: string) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    
    async function fetchVisits() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('visits')
          .select(`
            *,
            places_of_interest(id, name, category, latitude, longitude)
          `)
          .eq('trip_id', tripId)
          .order('visit_time', { ascending: true });
        
        if (error) throw error;
        
        setVisits(data || []);
      } catch (err) {
        console.error('방문 기록 불러오기 오류:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchVisits();
  }, [tripId]);

  const createVisit = async (visitData: Omit<Visit, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .insert(visitData)
        .select(`
          *,
          places_of_interest(id, name, category, latitude, longitude)
        `)
        .single();
      
      if (error) throw error;
      
      setVisits(prev => [...prev, data as Visit]);
      return data as Visit;
    } catch (err) {
      console.error('방문 기록 생성 오류:', err);
      throw err;
    }
  };

  const updateVisit = async (id: string, updates: Partial<Visit>) => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          places_of_interest(id, name, category, latitude, longitude)
        `)
        .single();
      
      if (error) throw error;
      
      setVisits(prev => 
        prev.map(visit => visit.id === id ? (data as Visit) : visit)
      );
      
      return data as Visit;
    } catch (err) {
      console.error('방문 기록 업데이트 오류:', err);
      throw err;
    }
  };

  const deleteVisit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setVisits(prev => prev.filter(visit => visit.id !== id));
    } catch (err) {
      console.error('방문 기록 삭제 오류:', err);
      throw err;
    }
  };

  return {
    visits,
    loading,
    error,
    createVisit,
    updateVisit,
    deleteVisit
  };
}