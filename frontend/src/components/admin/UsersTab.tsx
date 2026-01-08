'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { Profile } from '@/types/database';

export default function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = getSupabase();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*, verification_status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'verified' })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'User verified successfully' });
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to verify user' });
      console.error(error);
    }
  };

  const handleUpdateBalance = async (userId: string, currentBalance: number, amountChange: number) => {
    try {
      const newBalance = currentBalance + amountChange;
      const { error } = await supabase
        .from('profiles')
        .update({ balance_usd: newBalance })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Balance updated successfully' });
      fetchUsers();
      setIsBalanceModalOpen(false);
      setBalanceAmount('');
      setSelectedUser(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update balance' });
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      // Delete from auth.users needs admin API or backend function usually. 
      // For now, we will try to delete from profiles if RLS allows, 
      // but typically deleting the user requires calling an admin endpoint.
      // Assuming for this prototype we just delete the profile or "ban" by setting a flag if we had one.
      // Since we don't have a backend admin API set up in this context, we'll delete the profile row.
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'User profile deleted' });
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">User Management</h2>
        <button 
          onClick={fetchUsers}
          className="w-full sm:w-auto px-4 py-2 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-neutral-400">
              <tr>
                <th className="p-6 font-medium">User</th>
                <th className="p-6 font-medium">Balance</th>
                <th className="p-6 font-medium">Status</th>
                <th className="p-6 font-medium">Role</th>
                <th className="p-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-500">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-lg font-bold text-neutral-400">
                          {user.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.username || 'No Username'}</div>
                          <div className="text-sm text-neutral-500">{user.full_name || 'No Name'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-emerald-400 font-mono font-medium">
                        ${user.balance_usd?.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-6">
                      {user.verification_status === 'verified' ? (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                          Verified
                        </span>
                      ) : user.verification_status === 'pending' ? (
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/20">
                          Pending
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-full text-xs font-medium">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      {user.is_admin ? (
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-medium border border-purple-500/20">
                          Admin
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-full text-xs font-medium">
                          User
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        {user.verification_status !== 'verified' && (
                          <button
                            onClick={() => handleVerifyUser(user.id)}
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm transition-colors"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsBalanceModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm transition-colors"
                        >
                          Adjust Funds
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Adjustment Modal */}
      {isBalanceModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161512] border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Adjust Balance</h3>
            <p className="text-neutral-400 mb-6">
              Adjusting funds for <span className="text-white font-medium">{selectedUser.username}</span>.
              <br />
              Current Balance: <span className="text-emerald-400">${selectedUser.balance_usd?.toFixed(2)}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 10 or -5)"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600"
                />
                <p className="text-xs text-neutral-500 mt-2">Use negative values to deduct funds.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-neutral-800 text-neutral-400 rounded-xl hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateBalance(selectedUser.id, selectedUser.balance_usd || 0, parseFloat(balanceAmount))}
                  disabled={!balanceAmount}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
