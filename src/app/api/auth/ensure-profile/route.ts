import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { userId, username } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }
    
    // 1. 사용자 존재 확인
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 2. 프로필 존재 확인
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    // 3. 프로필이 이미 존재하면 성공 반환
    if (profileData) {
      return NextResponse.json({ success: true, message: '프로필이 이미 존재합니다.' });
    }
    
    // 4. 프로필이 없으면 새로 생성
    const displayUsername = username || userData.user.email?.split('@')[0] || 'user';
    
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        username: displayUsername,
        full_name: '',
        avatar_url: null
      });
    
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '프로필이 생성되었습니다.'
    });
  } catch (err) {
    console.error('API 오류:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}