import { Trip, CreateTripData } from '@/entities/trip/types';
import { supabase } from '@/shared/api/supabase';

export async function createTrip(tripData: CreateTripData): Promise<Trip> {
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
    
    if (!data) {
      throw new Error('여행 생성 후 데이터를 받지 못했습니다.');
    }
    
    return data as Trip;
  } catch (err) {
    console.error('여행 생성 오류:', err);
    throw err;
  }
}