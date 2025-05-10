// src/app/api/media/upload/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const visitId = formData.get('visit_id') as string;
    const type = formData.get('type') as string;
    const caption = formData.get('caption') as string || '';
    
    if (!file || !visitId || !type) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }
    
    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop();
    const fileName = `${visitId}/${Date.now()}.${fileExt}`;
    const filePath = `media/${fileName}`;
    
    // 파일 데이터 가져오기
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // 스토리지에 업로드
    const { error: uploadError } = await supabaseAdmin.storage
      .from('travel-media')
      .upload(filePath, buffer, {
        contentType: file.type
      });
    
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    // 파일 URL 가져오기
    const { data: urlData } = supabaseAdmin.storage
      .from('travel-media')
      .getPublicUrl(filePath);
    
    // 미디어 레코드 생성
    const { data, error } = await supabaseAdmin
      .from('media')
      .insert({
        visit_id: visitId,
        url: urlData.publicUrl,
        type,
        caption
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, media: data });
  } catch (err) {
    console.error('미디어 업로드 오류:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}