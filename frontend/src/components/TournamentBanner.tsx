'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabaseClient';
import { Tournament } from '@/types/database';

export default function TournamentBanner() {
  const [upcomingTournament, setUpcomingTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  const supabase = getSupabase();

  useEffect(() => {
    fetchUpcomingTournament();
  }, []);

  useEffect(() => {
    if (!upcomingTournament) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(upcomingTournament.start_date).getTime();
      const distance = start - now;

      if (distance < 0) {
        setTimeLeft('Tournament Started');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [upcomingTournament]);

  const fetchUpcomingTournament = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .gt('start_date', now)
        .order('start_date', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching tournament:', error);
      }
      
      setUpcomingTournament(data || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !upcomingTournament) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] border border-white/10 shadow-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 group">
        {/* Abstract Background Effect */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700"></div>

        <div className="relative z-10 text-center md:text-left">
          <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            Upcoming Tournament
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            {upcomingTournament.name}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-neutral-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-medium text-lg">${upcomingTournament.prize_fund}</span> Prize Fund
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
            <span className="font-mono text-neutral-300">
              Starts in: <span className="text-white font-bold">{timeLeft || '...'}</span>
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <Link 
            href={`/tournaments/${upcomingTournament.id}`}
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-neutral-200 transition-transform active:scale-95 shadow-lg shadow-white/10"
          >
            Join Now
          </Link>
        </div>
      </div>
    </div>
  );
}
