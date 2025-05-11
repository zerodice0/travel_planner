'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/shared/api/supabase';
import { User } from '@supabase/supabase-js';

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  if (loading) {
    return (
      <header className="bg-white dark:bg-gray-800 shadow py-4 transition-colors">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">이토록 P다운 플래너</Link>
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow py-4 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">이토록 P다운 플래너</Link>
          
          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex md:items-center">
            <ul className="flex items-center gap-6">
              {!loading && (
                user ? (
                  <>
                    <li>
                      <Link href="/places" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                        관심 장소
                      </Link>
                    </li>
                    <li>
                      <Link href="/trips" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                        여행 계획
                      </Link>
                    </li>
                    <li>
                      <Link href="/explore" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                        여행 탐색
                      </Link>
                    </li>
                    <li>
                      <span className="text-sm text-gray-600 dark:text-gray-400 mr-3">
                        {user.email?.split('@')[0]}
                      </span>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 text-sm transition"
                      >
                        로그아웃
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/explore" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                        여행 탐색
                      </Link>
                    </li>
                    <li>
                      <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                        로그인
                      </Link>
                    </li>
                    <li>
                      <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                        회원가입
                      </Link>
                    </li>
                  </>
                )
              )}
            </ul>
          </nav>
          
          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center gap-2">
            <button
              className="p-2 text-gray-700 dark:text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div ref={menuRef} className="md:hidden mt-4">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 transition-colors">
              {!loading && (
                <ul className="space-y-1">
                  {user ? (
                    <>
                      <li className="px-4 py-2 text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                        <span>{user.email}</span>
                      </li>
                      <li>
                        <Link 
                          href="/places" 
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          관심 장소
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href="/trips" 
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          여행 계획
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href="/explore" 
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          여행 탐색
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          로그아웃
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link 
                          href="/explore" 
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          여행 탐색
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href="/login" 
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          로그인
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href="/register" 
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          회원가입
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}