"use client";
import Bg from "@/components/Bg";
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
    else router.push("/playground");
  }

  return (
    <Bg>
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={onSubmit} className="w-[min(90vw,480px)] space-y-4">
          <h1 className="text-2xl font-semibold text-[#eaeaea]">Sign In</h1>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" placeholder="Email or Username" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
          <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button disabled={loading} className="w-full px-4 py-2 bg-[#242424] rounded hover:bg-[#2a2a2a] text-[#eaeaea]">{loading ? "Signing in..." : "Sign In"}</button>
          <div className="text-sm text-[#bdbdbd]">No account? <button type="button" className="underline" onClick={() => router.push("/auth/sign-up")}>Sign up</button></div>
        </form>
      </div>
    </Bg>
  );
}
