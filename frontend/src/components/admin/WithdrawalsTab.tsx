"use client";
import { getSupabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_details: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    username: string;
    email: string;
  };
};

export default function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const supabase = getSupabase();

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  async function fetchWithdrawals() {
    setLoading(true);
    let query = supabase
      .from('withdrawals')
      .select('*, profiles(username, email)')
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('status', 'pending');
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching withdrawals:', error);
    } else {
      setWithdrawals(data as any || []);
    }
    setLoading(false);
  }

  async function handleApprove(id: string) {
    if (!confirm("Are you sure you want to approve this withdrawal?")) return;
    setProcessingId(id);
    
    // For approval, we just update the status. Funds were already deducted on request.
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      alert("Error approving withdrawal: " + error.message);
    } else {
      fetchWithdrawals();
    }
    setProcessingId(null);
  }

  async function handleReject(id: string) {
    if (!confirm("Are you sure you want to reject this withdrawal? Funds will be refunded.")) return;
    setProcessingId(id);

    // Use RPC to reject and refund
    const { data, error } = await supabase.rpc('reject_withdrawal', { p_withdrawal_id: id });

    if (error || (data && data.error)) {
      alert("Error rejecting withdrawal: " + (error?.message || data?.error));
    } else {
      fetchWithdrawals();
    }
    setProcessingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Withdrawal Requests</h2>
        <div className="flex gap-2 bg-neutral-900/50 p-1 rounded-lg">
           <button 
             onClick={() => setFilter('pending')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400 hover:text-white'}`}
           >
             Pending
           </button>
           <button 
             onClick={() => setFilter('all')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400 hover:text-white'}`}
           >
             All History
           </button>
        </div>
      </div>

      {loading ? (
        <div className="text-neutral-400 animate-pulse">Loading requests...</div>
      ) : withdrawals.length === 0 ? (
        <div className="text-neutral-500 bg-neutral-900/30 p-8 rounded-xl text-center border border-neutral-800">
          No {filter} withdrawals found.
        </div>
      ) : (
        <div className="grid gap-4">
          {withdrawals.map((w) => (
            <div key={w.id} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <div className="text-lg font-semibold text-emerald-400">${w.amount}</div>
                   <div className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide
                     ${w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                       w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 
                       'bg-red-500/20 text-red-400'}`}>
                     {w.status}
                   </div>
                </div>
                <div className="text-white font-medium">{w.profiles?.username || 'Unknown User'} <span className="text-neutral-500 text-sm font-normal">({w.profiles?.email || 'No Email'})</span></div>
                <div className="text-sm text-neutral-400 mt-1">
                  Requested on {new Date(w.created_at).toLocaleString()} via {w.method}
                </div>
                
                {/* Account Details */}
                <div className="mt-4 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                   {w.account_details && Object.entries(w.account_details).map(([k, v]) => (
                     <div key={k}>
                       <span className="text-neutral-500 capitalize">{k.replace(/_/g, ' ')}:</span> <span className="text-neutral-300">{String(v)}</span>
                     </div>
                   ))}
                </div>
              </div>

              {w.status === 'pending' && (
                <div className="flex md:flex-col gap-3 min-w-[120px]">
                   <button 
                     disabled={!!processingId}
                     onClick={() => handleApprove(w.id)}
                     className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                   >
                     {processingId === w.id ? '...' : 'Approve'}
                   </button>
                   <button 
                     disabled={!!processingId}
                     onClick={() => handleReject(w.id)}
                     className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors"
                   >
                     {processingId === w.id ? '...' : 'Reject'}
                   </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
