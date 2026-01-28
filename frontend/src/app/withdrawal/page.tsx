"use client";
import Bg from "@/components/Bg";
import Header from "@/components/Header";
import { getSupabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  account_details: any;
};

export default function WithdrawalPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [balanceZar, setBalanceZar] = useState<number>(0);
  
  // Form State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("Bank Transfer");
  
  // Bank Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("Savings");
  const [accountHolder, setAccountHolder] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // History
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const supabase = getSupabase();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { router.push("/auth/sign-in"); return; }
      setUserId(uid);
      fetchProfile(uid);
      fetchWithdrawals(uid);
    });
  }, [router]);

  async function fetchProfile(uid: string) {
    const { data: prof } = await supabase.from("profiles").select("username,balance_zar").eq("id", uid).maybeSingle();
    if (prof) {
      setUsername(prof.username || "Account");
      setBalanceZar(Number(prof.balance_zar || 0));
    }
  }

  async function fetchWithdrawals(uid: string) {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    
    if (data) setWithdrawals(data);
  }

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      const val = Number(amount);
      if (!val || isNaN(val) || val <= 0) { setError("Please enter a valid amount"); return; }
      if (val > balanceZar) { setError("Insufficient balance"); return; }
      if (val < 10) { setError("Minimum withdrawal is R10"); return; } // Assuming R10 min
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const details = {
      bank_name: bankName,
      account_number: accountNumber,
      account_type: accountType,
      account_holder: accountHolder
    };

    try {
      // Call the RPC function we defined in migration
      const { data, error: rpcError } = await supabase.rpc("request_withdrawal", {
        p_amount: Number(amount),
        p_method: method,
        p_account_details: details
      });

      if (rpcError) throw rpcError;
      if (data?.error) throw new Error(data.error);

      setSuccessMsg("Withdrawal requested successfully!");
      setStep(1);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      
      // Refresh data
      fetchProfile(userId);
      fetchWithdrawals(userId);
      
    } catch (err: any) {
      setError(err.message || "Failed to request withdrawal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Bg>
      <Header
        username={username}
        balanceZar={balanceZar}
        onProfile={() => router.push("/profile")}
        onLogout={async () => { await supabase.auth.signOut(); router.push("/auth/sign-in"); }}
        onDeposit={() => router.push("/deposit")}
        isAuthenticated={!!userId}
      />

      <div className="px-4 md:px-0 w-[min(92vw,800px)] mx-auto pb-20">
        {/* Withdrawal Form Card */}
        <div className="mt-6 rounded-3xl bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 backdrop-blur-xl border border-neutral-800 shadow-2xl shadow-black/40">
          <div className="p-8 md:p-12">
            <h1 className="text-2xl md:text-3xl font-semibold text-neutral-50 mb-6">Request Withdrawal</h1>
            
            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {successMsg}
                <button onClick={() => setSuccessMsg(null)} className="ml-4 text-sm underline opacity-70 hover:opacity-100">Dismiss</button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                 <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Amount (ZAR)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-neutral-500">Available Balance: R{balanceZar.toFixed(2)}</p>
                </div>
                <button
                  onClick={handleNextStep}
                  className="w-full py-3 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-900 font-semibold"
                >
                  Next
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Select Method</label>
                  <div 
                    onClick={() => setMethod("Bank Transfer")}
                    className={`cursor-pointer p-4 rounded-2xl border ${method === "Bank Transfer" ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-800 bg-neutral-900"} transition-all`}
                  >
                    <div className="font-semibold text-neutral-200">Bank Transfer</div>
                    <div className="text-sm text-neutral-400">3 to 7 business days</div>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-semibold">Back</button>
                   <button onClick={handleNextStep} className="flex-1 py-3 rounded-2xl bg-neutral-100 text-neutral-900 hover:bg-white font-semibold">Next</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm text-neutral-400 mb-1">Bank Name</label>
                      <input className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100" 
                        value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. FNB" />
                   </div>
                   <div>
                      <label className="block text-sm text-neutral-400 mb-1">Account Type</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100"
                        value={accountType} onChange={e => setAccountType(e.target.value)}>
                        <option>Savings</option>
                        <option>Cheque/Current</option>
                        <option>Transmission</option>
                      </select>
                   </div>
                </div>
                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Account Number</label>
                    <input className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100" 
                      value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Enter account number" />
                </div>
                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Account Holder Name</label>
                    <input className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100" 
                      value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="e.g. J Doe" />
                </div>

                {error && <div className="text-red-400 text-sm">{error}</div>}

                <div className="flex gap-3 mt-4">
                   <button onClick={() => setStep(2)} disabled={loading} className="flex-1 py-3 rounded-2xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-semibold">Back</button>
                   <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold">
                      {loading ? "Processing..." : "Request Payout"}
                   </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Withdrawals History */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-200 mb-4">Withdrawal History</h2>
          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <div className="text-neutral-500 text-sm">No withdrawal requests found.</div>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex justify-between items-center">
                  <div>
                    <div className="text-neutral-200 font-medium">R{w.amount} via {w.method}</div>
                    <div className="text-xs text-neutral-500">{new Date(w.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 
                        w.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                        'bg-yellow-500/20 text-yellow-400'}`}>
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </Bg>
  );
}
