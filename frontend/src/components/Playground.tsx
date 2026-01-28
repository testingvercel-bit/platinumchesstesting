"use client";
import Bg from "@/components/Bg";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import TournamentBanner from "@/components/TournamentBanner";
import { io } from "socket.io-client";

export default function Playground() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [balanceZar, setBalanceZar] = useState<number>(0);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [userId, setUserId] = useState<string>("");
  const [status, setStatus] = useState<string>("Select a time control to start");
  const [stakeZar, setStakeZar] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const v = window.localStorage.getItem("platinumchess-stake-zar");
      const n = Number(v);
      if (isFinite(n) && n > 0) return n;
    }
    return 20;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const playerId = useMemo(() => {
    const key = "platinumchess-player-id";
    const existing = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (existing) return existing;
    const id = crypto.randomUUID();
    if (typeof window !== "undefined") window.localStorage.setItem(key, id);
    return id;
  }, []);
  useEffect(() => {
    const s = getSupabase();
    s.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { setUserId(""); return; }
      setUserId(uid);
      const { data: prof } = await s.from("profiles").select("full_name,username,phone_number,date_of_birth,balance_zar,is_admin,verification_status").eq("id", uid).maybeSingle();
      if (!prof) {
        // Handle case where profile doesn't exist at all - maybe redirect to sign-up or show error
        // For now, let's just not redirect to complete-profile if it's missing, or maybe we SHOULD?
        // If profile is missing, they probably DO need to complete it.
        // But the user says they have a complete profile.
        // Let's relax the check.
        router.push("/complete-profile");
      } else if (!prof.username) {
         // Only require username strictly? Or maybe just check if "username" is present.
         // The user says "even though i have a complete profile".
         // Maybe one of the fields is null or empty string but considered "complete" by the user?
         // Let's only redirect if username is missing, as that's critical for gameplay.
         router.push("/complete-profile");
      } else if (prof.is_admin) {
        router.push("/admin");
      } else {
        setUsername(prof.username);
        setBalanceZar(Number((prof as any)?.balance_zar || 0));
        setVerificationStatus((prof as any)?.verification_status || 'unverified');
      }
    });
  }, [router]);
  const presets = [
    { label: "1+0", sub: "Bullet" },
    { label: "2+1", sub: "Bullet" },
    { label: "3+0", sub: "Blitz" },
    { label: "3+2", sub: "Blitz" },
    { label: "5+0", sub: "Blitz" },
    { label: "5+3", sub: "Blitz" },
    { label: "10+0", sub: "Rapid" },
    { label: "10+5", sub: "Rapid" },
    { label: "15+10", sub: "Rapid" }
  ];

  function queue(time: string) {
    if (!userId) {
      setStatus("Please log in to play");
      setShowLoginModal(true);
      return;
    }
    if (verificationStatus !== 'verified') {
      setStatus("Verification required to play");
      setShowVerificationModal(true);
      return;
    }
    if (stakeZar > balanceZar) {
      setStatus("Insufficient balance for selected stake");
      return;
    }
    const socket = io({ transports: ["websocket", "polling"] });
    if (typeof window !== "undefined") window.localStorage.setItem("platinumchess-selected-time", time);
    setStatus(`Queued for ${time}... waiting for opponent`);
    socket.on("connect", () => {
      socket.emit("queueForTime", { time, playerId, userId, stakeZar });
    });
    socket.on("queueRejected", (p: { reason: string }) => {
      setStatus(p.reason === "Insufficient funds" ? "Insufficient balance for selected stake" : `Queue rejected: ${p.reason}`);
      socket.disconnect();
    });
    socket.on("paired", (p: { roomId: string; time: string }) => {
      setStatus(`Paired for ${p.time}. Starting...`);
      socket.disconnect();
      router.push(`/room/${p.roomId}`);
    });
  }

  const [recent, setRecent] = useState<{ opponentName: string; result: string; deltaZar: number; stakeZar: number; createdAt: string }[]>([]);
  const [recOffset, setRecOffset] = useState(0);
  async function loadRecent(offset = 0) {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000");
      const resp = await fetch(`${origin}/games/recent/${encodeURIComponent(userId)}?limit=5&offset=${offset}`);
      const json = await resp.json();
      if (resp.ok && Array.isArray(json?.games)) {
        if (offset === 0) setRecent(json.games);
        else setRecent(prev => [...prev, ...json.games]);
      }
    } catch {}
  }

  useEffect(() => { if (userId) loadRecent(0); }, [userId]);
  return (
    <Bg>
      <Header
        username={username || "Account"}
        balanceZar={balanceZar}
        onProfile={() => router.push("/profile")}
        onLogout={async () => { await getSupabase().auth.signOut(); router.push("/auth/sign-in"); }}
        onDeposit={() => router.push("/deposit")}
        withdrawHref="/withdrawal"
        isAuthenticated={!!userId}
        onLogin={() => router.push("/auth/sign-in")}
        onSignup={() => router.push("/auth/sign-up")}
      />
      <TournamentBanner />
      <div className="relative px-4 md:px-0 py-0 w-[min(90vw,70vh)] md:w-[min(70vw,60vh)] mx-auto">
        <div className="mt-4 w-full rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md shadow-lg shadow-black/30">
          <div className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm font-medium text-neutral-300">Wager</div>
            {/* Mobile layout: buttons wrapped below label, input below */}
            <div className="block md:hidden w-full">
              <div className="grid grid-cols-3 gap-2">
                {[20, 45, 70].map(a => (
                  <button
                    key={a}
                    onClick={() => { setStakeZar(a); if (typeof window !== "undefined") window.localStorage.setItem("platinumchess-stake-zar", String(a)); }}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold ${stakeZar===a ? "bg-neutral-100 text-neutral-900" : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"}`}
                  >
                    R{a}
                  </button>
                ))}
              </div>
              <div className="mt-2 w-full">
                <input
                  inputMode="decimal"
                  value={stakeZar}
                  onChange={e => { const n = Number(e.target.value); if (isFinite(n) && n > 0) { setStakeZar(n); if (typeof window !== "undefined") window.localStorage.setItem("platinumchess-stake-zar", String(n)); } }}
                  className="w-full px-2 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-100 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-neutral-700"
                />
              </div>
            </div>
            {/* Desktop layout: buttons and input inline */}
            <div className="hidden md:flex md:items-center md:gap-2">
              <div className="flex gap-2">
                {[20, 45, 70].map(a => (
                  <button
                    key={a}
                    onClick={() => { setStakeZar(a); if (typeof window !== "undefined") window.localStorage.setItem("platinumchess-stake-zar", String(a)); }}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold ${stakeZar===a ? "bg-neutral-100 text-neutral-900" : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"}`}
                  >
                    R{a}
                  </button>
                ))}
              </div>
              <div className="md:ml-2">
                <input
                  inputMode="decimal"
                  value={stakeZar}
                  onChange={e => { const n = Number(e.target.value); if (isFinite(n) && n > 0) { setStakeZar(n); if (typeof window !== "undefined") window.localStorage.setItem("platinumchess-stake-zar", String(n)); } }}
                  className="w-24 px-2 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-700"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => queue(p.label)}
              className="aspect-square w-full rounded-none bg-white/5 backdrop-blur-md shadow-lg shadow-black/30 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-100">{p.label}</div>
                <div className="text-sm text-gray-300">{p.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 text-sm text-gray-300">{status}</div>
        <div className="mt-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md shadow-lg shadow-black/30">
            <div className="px-4 py-3 text-sm font-medium text-neutral-300">Recent games</div>
            <div className="px-4 py-2">
              {recent.slice(0, 5).map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-b-0">
                  <div>
                    <div className="text-neutral-200 text-sm">{g.opponentName}</div>
                    <div className={`text-xs ${g.result!=="draw" ? (g.deltaZar>0?"text-green-400":"text-red-400") : "text-neutral-400"}`}>{g.result!=="draw" ? (g.deltaZar>0?`Won +R${g.deltaZar.toFixed(2)}`:`Lost -R${Math.abs(g.deltaZar).toFixed(2)}`) : "Draw ±R0.00"}</div>
                  </div>
                  <div className="text-xs text-neutral-400">R{g.stakeZar} stake</div>
                </div>
              ))}
              <div className="mt-3">
                <button onClick={() => { const next = recOffset + 5; setRecOffset(next); loadRecent(next); }} className="w-full px-3 py-2 rounded-md bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-sm">Show more</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showLoginModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowLoginModal(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <div className="px-5 py-4">
              <div className="text-lg font-semibold text-neutral-50">Please log in to play</div>
              <div className="mt-1 text-sm text-neutral-400">You need an account to join games.</div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 rounded-md bg-neutral-800 text-neutral-200 hover:bg-neutral-700" onClick={() => setShowLoginModal(false)}>Close</button>
                <button className="flex-1 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => router.push("/auth/sign-in")}>Log in</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowVerificationModal(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <div className="px-5 py-4">
              <div className="text-lg font-semibold text-neutral-50">Verification Required</div>
              <div className="mt-1 text-sm text-neutral-400">You need to verify your account to play games.</div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 rounded-md bg-neutral-800 text-neutral-200 hover:bg-neutral-700" onClick={() => setShowVerificationModal(false)}>Close</button>
                <button className="flex-1 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => router.push("/profile")}>Go to Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Bg>
  );
}
