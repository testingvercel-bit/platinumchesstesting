"use client";
import Bg from "@/components/Bg";
import Logo from "@/components/Logo";
import { getSupabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const s = getSupabase();
    let email = identifier;
    if (!identifier.includes("@")) {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000");
        const resp = await fetch(`${origin}/auth/email-for-username/${encodeURIComponent(identifier)}`);
        const json = await resp.json();
        if (!resp.ok || !json?.email) { setError(json?.error || "Unable to resolve username to email"); setLoading(false); return; }
        email = String(json.email);
      } catch (err: any) {
        setError("Network error resolving username");
        setLoading(false);
        return;
      }
    }
    const { error: err } = await s.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else router.push("/");
  }

  return (
    <Bg>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-[min(92vw,520px)] mx-auto">
          <div className="rounded-3xl bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 backdrop-blur-xl border border-neutral-800 shadow-2xl shadow-black/40">
            <div className="p-8 md:p-12">
              <div className="flex flex-col items-center">
                <Logo size={160} />
                <div className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight text-neutral-50">Welcome back</div>
                <div className="text-sm md:text-base text-neutral-400">Sign in to Platinum Chess</div>
              </div>

              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <input
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                  placeholder="Email or Username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                />
                <input
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  disabled={loading}
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-900 font-semibold tracking-tight shadow-sm disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
                <div className="text-sm text-neutral-400">
                  No account? <button type="button" className="underline hover:text-neutral-300" onClick={() => router.push("/auth/sign-up")}>Sign up</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Bg>
  );
}
