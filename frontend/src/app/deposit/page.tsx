"use client";
import Bg from "@/components/Bg";
import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

export default function DepositPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [balanceZar, setBalanceZar] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isSignedIn || !user) { router.push("/auth/sign-in"); return; }
    let aborted = false;
    (async () => {
      const resp = await fetch("/api/profile/me");
      const prof = await resp.json();
      if (!aborted) {
        setUsername(prof?.username || "Account");
        setBalanceZar(Number(prof?.balance_zar || 0));
      }
    })();
    return () => { aborted = true; };
  }, [router, isSignedIn, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || isNaN(amt)) { setError("Enter a valid amount"); return; }
    if (amt < 5) { setError("Minimum deposit is R5"); return; }
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000");
      const resp = await fetch(`${origin}/payments/deposit/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, userId: user?.id, username })
      });
      const json = await resp.json();
      setLoading(false);
      if (!resp.ok) { setError(json?.error || "Failed to create deposit"); return; }
      const processUrl = String(json.processUrl);
      const fields = json.fields as Record<string, string>;
      const form = document.createElement("form");
      form.action = processUrl;
      form.method = "POST";
      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch {
      setLoading(false);
      setError("Network error creating deposit");
    }
  }

  return (
    <Bg>
      <Header
        username={username || "Account"}
        balanceZar={balanceZar}
        onProfile={() => router.push("/profile")}
        onLogout={async () => { await signOut(); router.push("/auth/sign-in"); }}
        onDeposit={() => {}}
        withdrawHref="/withdrawal"
        isAuthenticated={!!user}
      />

      <div className="px-4 md:px-0 w-[min(92vw,800px)] mx-auto">
        <div className="mt-6 rounded-3xl bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 backdrop-blur-xl border border-neutral-800 shadow-2xl shadow-black/40">
          <div className="p-8 md:p-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-50">Deposit Funds</div>
                <div className="text-sm md:text-base text-neutral-400">Secure checkout via PayFast</div>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-right">
                <div className="text-xs text-neutral-400">Current Balance</div>
                <div className="text-lg font-semibold tracking-tight text-emerald-400">R{balanceZar.toFixed(2)}</div>
              </div>
            </div>

              <form onSubmit={onSubmit} className="mt-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Amount (ZAR)</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <input
                      inputMode="decimal"
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                      placeholder="Enter amount (min R5)"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>
                  <button
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-900 font-semibold tracking-tight shadow-sm disabled:opacity-50"
                  >
                    {loading ? "Redirecting..." : "Proceed"}
                  </button>
                </div>
                {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    label: "PayFast verified",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20" />
                        <path d="M8 12l2.5 2.5L16 9" />
                      </svg>
                    )
                  },
                  {
                    label: "Secure SSL",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 10V8a6 6 0 0 1 12 0v2" />
                        <path d="M6 10h12v10H6z" />
                        <path d="M12 15v3" />
                      </svg>
                    )
                  },
                  {
                    label: "No hidden fees",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3h8a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z" />
                        <path d="M9 8h6" />
                        <path d="M9 12h6" />
                      </svg>
                    )
                  }
                ].map((b, i) => (
                  <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm text-neutral-300">
                    <div className="flex items-center gap-2">
                      {b.icon}
                      <span>{b.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 text-xs text-neutral-500">Minimum deposit is R5. Payments are processed in ZAR via PayFast. Your balance updates after payment completes.</div>
            </form>
          </div>
        </div>
      </div>
    </Bg>
  );
}
