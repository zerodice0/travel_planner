import { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Media } from './types';

// 방문 기록과 연결된 미디어 파일을 가져오는 훅
export function useVisitMedia(visitId: string) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) return;
    
    async function fetchMedia() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('visit_id', visitId)
          .order('created_at');
        
        if (error) throw error;
        
        setMedia(data || []);
      } catch (err) {
        console.error('미디어 불러오기 오류:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, [visitId]);

  return { media, loading, error };
}

// 여행과 연결된 모든 미디어 파일을 가져오는 훅
export function useTripMedia(tripId: string) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    
    async function fetchMedia() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('media')
          .select(`
            *,
            visits!inner(id, visit_time, trip_id, places_of_interest(id, name))
          `)
          .eq('visits.trip_id', tripId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setMedia(data || []);
      } catch (err) {
        console.error('미디어 불러오기 오류:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, [tripId]);

  return { media, loading, error };
}

// 미디어 업로드 및 관리 기능을 제공하는 훅
export function useMedia() {
  const uploadMedia = async ({
    visit_id,
    file,
    type,
    caption
  }: {
    visit_id: string;
    file: File;
    type: 'image' | 'video' | 'audio';
    caption?: string;
  }) => {
    try {
      // 1. 스토리지에 파일 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `${visit_id}/${Date.now()}.${fileExt}`;
      const filePath = `media/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('travel-media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // 2. 파일 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('travel-media')
        .getPublicUrl(filePath);
      
      const url = urlData.publicUrl;
      
      // 3. 미디어 레코드 생성
      const { data, error } = await supabase
        .from('media')
        .insert({
          visit_id,
          url,
          type,
          caption: caption || ''
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('미디어 업로드 오류:', err);
      throw err;
    }
  };
  
  const deleteMedia = async (id: string, url: string) => {
    try {
      // 1. 미디어 레코드 삭제
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 2. 스토리지에서 파일 삭제
      const filePath = url.split('/').slice(-2).join('/');
      
      await supabase.storage
        .from('travel-media')
        .remove([filePath]);
      
      return true;
    } catch (err) {
      console.error('미디어 삭제 오류:', err);
      throw err;
    }
  };
  
  return { uploadMedia, deleteMedia };
}