'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabaseClient';
import UsersTab from '@/components/admin/UsersTab';
import TournamentsTab from '@/components/admin/TournamentsTab';
import Link from 'next/link';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'tournaments'>('users');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = getSupabase();

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
  };

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/sign-in');
        return;
      }

      // Check profile for is_admin flag
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (error || !profile?.is_admin) {
        console.error('Access denied: Not an admin');
        router.push('/'); // Redirect to home if not admin
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-emerald-500 animate-pulse font-medium">Verifying Admin Access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-[#111111]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-neutral-400 hover:text-white transition-colors">
              <span className="hidden sm:inline">← Back to App</span>
              <span className="sm:hidden">←</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Admin</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex bg-neutral-900/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'users' 
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('tournaments')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'tournaments' 
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Tournaments
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-red-400 transition-colors bg-neutral-900/50 rounded-xl hover:bg-neutral-800"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'users' ? <UsersTab /> : <TournamentsTab />}
      </main>
    </div>
  );
}
