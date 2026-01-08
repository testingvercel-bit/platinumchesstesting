'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabaseClient';
import { Tournament, Profile } from '@/types/database';
import Bg from '@/components/Bg';
import Link from 'next/link';

export default function TournamentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [lichessUsername, setLichessUsername] = useState('');
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabase();

  useEffect(() => {
    if (id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Tournament
      const { data: tData, error: tError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (tError) throw tError;
      setTournament(tData);

      // 2. Fetch User Session & Profile
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setProfile(pData);

        // 3. Check if already joined
        const { data: jData } = await supabase
          .from('tournament_participants')
          .select('id')
          .eq('tournament_id', id)
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (jData) setHasJoined(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = () => {
    if (!profile) {
      router.push('/auth/sign-in');
      return;
    }

    if (profile.verification_status !== 'verified') {
      setError('Verification required. Please verify your account in your profile to join tournaments.');
      return;
    }

    if (profile.balance_usd < 5) {
      setError('Insufficient funds. You need at least $5.00 in your account to join.');
      return;
    }

    setShowJoinModal(true);
  };

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !tournament) return;

    try {
      setJoining(true);
      setError(null);

      // Insert participant record
      const { error: joinError } = await supabase
        .from('tournament_participants')
        .insert([{
          tournament_id: tournament.id,
          user_id: profile.id,
          lichess_username: lichessUsername
        }]);

      if (joinError) {
        if (joinError.code === '23505') { // Unique violation
           setHasJoined(true);
           setShowJoinModal(false);
           // Proceed to redirect anyway
        } else {
           throw joinError;
        }
      }

      setHasJoined(true);
      setShowJoinModal(false);
      
      // Redirect to Lichess Team
      window.open(tournament.lichess_team_url, '_blank');

    } catch (err) {
      console.error(err);
      setError('Failed to join tournament. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Bg>
        <div className="flex items-center justify-center min-h-screen text-neutral-400 animate-pulse">
          Loading Tournament...
        </div>
      </Bg>
    );
  }

  if (!tournament) {
    return (
      <Bg>
        <div className="flex flex-col items-center justify-center min-h-screen text-neutral-400">
          <h1 className="text-2xl font-bold text-white mb-2">Tournament Not Found</h1>
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">Back to Home</Link>
        </div>
      </Bg>
    );
  }

  return (
    <Bg>
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
            ← Back to Home
          </Link>

          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl bg-neutral-900/60 backdrop-blur-xl border border-white/5 shadow-2xl p-8 sm:p-12 mb-8">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between gap-6 md:items-start">
                <div>
                   <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
                    {tournament.name}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-neutral-300 mb-6">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
                      Prize Fund: ${tournament.prize_fund}
                    </span>
                    <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm font-medium">
                      {new Date(tournament.start_date).toLocaleDateString()} at {new Date(tournament.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
                
                <div>
                  {hasJoined ? (
                    <button disabled className="px-8 py-4 bg-neutral-800 text-emerald-400 font-bold rounded-2xl border border-emerald-500/20 cursor-default">
                      ✓ Joined
                    </button>
                  ) : (
                    <button 
                      onClick={handleJoinClick}
                      className="w-full md:w-auto px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-neutral-200 transition-transform active:scale-95 shadow-lg shadow-white/10"
                    >
                      Join Tournament
                    </button>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Tournament Details</h2>
                <div className="prose prose-invert prose-neutral max-w-none text-neutral-300 bg-neutral-900/40 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap">
                  {tournament.details || "No additional details provided."}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-neutral-900/40 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
                <ul className="space-y-3 text-neutral-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Verified Account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Minimum $5.00 Balance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Valid Lichess Account</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161512] border border-neutral-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold text-white mb-2">Join Tournament</h3>
            <p className="text-neutral-400 mb-6">
              Please enter your Lichess username to proceed. You will be redirected to the tournament page on Lichess.
            </p>

            <form onSubmit={handleConfirmJoin} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Lichess Username</label>
                <input
                  required
                  type="text"
                  value={lichessUsername}
                  onChange={(e) => setLichessUsername(e.target.value)}
                  placeholder="e.g. MagnusCarlsen"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={joining || !lichessUsername}
                  className="w-full px-4 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                >
                  {joining ? 'Joining...' : 'Confirm & Go to Lichess'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Bg>
  );
}
