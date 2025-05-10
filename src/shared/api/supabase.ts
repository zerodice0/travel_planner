import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 기본 Supabase 클라이언트 (공개 작업용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서비스 역할 클라이언트 (보안이 필요한 서버 측 작업용)
// 이 클라이언트는 API 라우트와 같은 서버 측 코드에서만 사용해야 함
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;