'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { Tournament, TournamentParticipant } from '@/types/database';

export default function TournamentsTab() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewParticipantsId, setViewParticipantsId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    prize_fund: '',
    start_date: '',
    details: '',
    lichess_team_url: ''
  });

  const supabase = getSupabase();

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (tournamentId: string) => {
    try {
      setParticipantsLoading(true);
      const { data: participantsRows, error: participantsError } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('joined_at', { ascending: false });

      if (participantsError) throw participantsError;

      const ids = (participantsRows || []).map((p) => p.user_id).filter(Boolean);
      let profilesById: Record<string, { username: string | null; full_name: string | null; email: string | null }> = {};

      if (ids.length > 0) {
        const { data: profilesRows, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, email')
          .in('id', ids);

        if (profilesError) throw profilesError;

        profilesById = (profilesRows || []).reduce((acc, row) => {
          acc[row.id] = { username: row.username, full_name: row.full_name, email: row.email };
          return acc;
        }, {} as Record<string, { username: string | null; full_name: string | null; email: string | null }>);
      }

      const merged = (participantsRows || []).map((p) => ({
        ...p,
        profiles: profilesById[p.user_id] ? { id: p.user_id, ...profilesById[p.user_id] } : undefined,
      })) as unknown as TournamentParticipant[];

      setParticipants(merged);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setParticipantsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewParticipantsId) {
      fetchParticipants(viewParticipantsId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewParticipantsId]);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('tournaments')
        .insert([{
          name: formData.name,
          prize_fund: parseFloat(formData.prize_fund),
          start_date: new Date(formData.start_date).toISOString(),
          details: formData.details,
          lichess_team_url: formData.lichess_team_url
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Tournament created successfully' });
      fetchTournaments();
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        prize_fund: '',
        start_date: '',
        details: '',
        lichess_team_url: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create tournament' });
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Tournaments</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
        >
          + Create Tournament
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center text-neutral-500 py-10">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div className="text-center text-neutral-500 py-10 bg-neutral-900/40 rounded-3xl border border-white/5">
            No tournaments found. Create one to get started.
          </div>
        ) : (
          tournaments.map((tournament) => (
            <div key={tournament.id} className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-white/10 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{tournament.name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Prize: <span className="text-emerald-400 font-mono">${tournament.prize_fund}</span>
                  </span>
                  <span>
                    Starts: {new Date(tournament.start_date).toLocaleDateString()} at {new Date(tournament.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <button
                  onClick={() => setViewParticipantsId(tournament.id)}
                  className="flex-1 md:flex-none px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl hover:bg-neutral-700 hover:text-white transition-colors text-sm"
                >
                  View Participants
                </button>
                <a 
                  href={tournament.lichess_team_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none px-4 py-2 bg-white/5 text-neutral-400 rounded-xl hover:bg-white/10 hover:text-white transition-colors text-sm text-center"
                >
                  Lichess Link
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Tournament Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161512] border border-neutral-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Create Tournament</h3>
            
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Tournament Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600"
                  placeholder="e.g. Sunday Super Blitz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Prize Fund ($)</label>
                  <input
                    required
                    type="number"
                    value={formData.prize_fund}
                    onChange={(e) => setFormData({...formData, prize_fund: e.target.value})}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Start Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Lichess Team URL</label>
                <input
                  required
                  type="url"
                  value={formData.lichess_team_url}
                  onChange={(e) => setFormData({...formData, lichess_team_url: e.target.value})}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600"
                  placeholder="https://lichess.org/team/..."
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Details / Rules</label>
                <textarea
                  required
                  rows={4}
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600 resize-none"
                  placeholder="Format, venue rules, time controls..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-neutral-800 text-neutral-400 rounded-xl hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Participants Modal */}
      {viewParticipantsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161512] border border-neutral-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Tournament Participants</h3>
              <button 
                onClick={() => setViewParticipantsId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {participantsLoading ? (
                <div className="text-center text-neutral-500 py-8">Loading participants...</div>
              ) : participants.length === 0 ? (
                <div className="text-center text-neutral-500 py-8">No participants yet.</div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-neutral-400 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="p-4 font-medium">Lichess Username</th>
                      <th className="p-4 font-medium">Site User</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium text-right">Joined At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {participants.map((p) => (
                      <tr key={p.id}>
                        <td className="p-4 text-white font-medium">{p.lichess_username}</td>
                        <td className="p-4 text-neutral-400">
                          {p.profiles?.username || 'Unknown'}
                        </td>
                        <td className="p-4 text-neutral-400">
                          {p.profiles?.email || '-'}
                        </td>
                        <td className="p-4 text-right text-neutral-500 text-sm">
                          {new Date(p.joined_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
