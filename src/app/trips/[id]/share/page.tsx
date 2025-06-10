'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTrip } from '@/entities/trip/hooks';
import { AlertDialog, useAlertDialog } from '@/shared/ui/AlertDialog';
import { supabase } from '@/shared/api/supabase';

export default function TripSharePage() {
  // AlertDialog 훅 사용
  const { dialog: alertDialog, showAlert, hideAlert } = useAlertDialog();
  
  const { id } = useParams();
  const { trip, loading: tripLoading } = useTrip(id as string);
  
  const [isPublic, setIsPublic] = useState<boolean>(trip?.is_public || false);
  const [shareLink, setShareLink] = useState<string>('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 여행 공개 상태 토글
  const handleTogglePublic = async () => {
    if (!trip) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('trips')
        .update({ is_public: !isPublic })
        .eq('id', trip.id);
      
      if (error) throw error;
      
      setIsPublic(!isPublic);
      
      if (!isPublic) {
        // 공개 링크 생성
        const link = `${window.location.origin}/explore/trips/${trip.id}`;
        setShareLink(link);
      } else {
        setShareLink('');
      }
    } catch (err) {
      console.error('공개 상태 변경 오류:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  // 공동 편집자 추가
  const handleAddCollaborator = async () => {
    if (!trip || !email) return;
    
    try {
      setLoading(true);
      
      // 1. 사용자 이메일로 프로필 검색
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (!profiles) {
        throw new Error('해당 이메일을 가진 사용자를 찾을 수 없습니다.');
      }
      
      // 2. 공동 편집자 추가
      const { error } = await supabase
        .from('trip_collaborators')
        .insert({
          trip_id: trip.id,
          user_id: profiles.id,
          permission: 'edit'
        });
      
      if (error) throw error;
      
      // 3. 상태 업데이트
      setCollaborators([...collaborators, email]);
      setEmail('');
    } catch (err) {
      console.error('공동 편집자 추가 오류:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  // 공유 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showAlert('복사 완료', '링크가 클립보드에 복사되었습니다.', '📋');
  };
  
  if (tripLoading) {
    return <div className="p-6">로딩 중...</div>;
  }
  
  if (!trip) {
    return <div className="p-6">여행 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{trip.title} 공유하기</h1>
      <p className="text-gray-600 mb-8">
        이 여행 기록을 다른 사람들과 공유하고 함께 편집할 수 있습니다.
      </p>
      
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">공개 설정</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">여행 기록 공개</p>
            <p className="text-sm text-gray-600">
              공개 설정 시 링크가 있는 모든 사람이 여행 기록을 볼 수 있습니다.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={handleTogglePublic}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {shareLink && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">공유 링크</label>
            <div className="flex">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="w-full px-3 py-2 border rounded-l-md bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md"
              >
                복사
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">공동 편집자 관리</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">이메일로 사용자 초대</label>
          <div className="flex">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소 입력"
              className="w-full px-3 py-2 border rounded-l-md"
            />
            <button
              onClick={handleAddCollaborator}
              disabled={loading || !email}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md disabled:bg-blue-300"
            >
              초대
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">공동 편집자 목록</h3>
          {collaborators.length === 0 ? (
            <p className="text-sm text-gray-500">아직 공동 편집자가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {collaborators.map((collab, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{collab}</span>
                  <button className="text-red-500 text-sm">삭제</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          완료
        </button>
      </div>
      
      {/* AlertDialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        icon={alertDialog.icon}
        buttonText={alertDialog.buttonText}
        onClose={hideAlert}
      />
    </div>
  );
}