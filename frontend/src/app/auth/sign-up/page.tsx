"use client";
import Bg from "@/components/Bg";
import { getSupabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error: err } = await getSupabase().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/complete-profile` },
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <Bg>
      <div className="min-h-screen flex items-center justify-center">
        {sent ? (
          <div className="w-[min(90vw,560px)] space-y-5 text-center">
            <h1 className="text-3xl font-bold text-[#eaeaea]">Verify Your Email</h1>
            <div className="mx-auto w-full px-6 py-6 bg-[#242424] border border-[#333333] rounded">
              <p className="text-[#d8d8d8]">We have sent a verification email to</p>
              <p className="text-[#eaeaea] font-medium mt-1">{maskEmail(email)}</p>
              <p className="text-[#bdbdbd] mt-3">Please check your inbox and click the verification link to activate your account.</p>
              <p className="text-[#bdbdbd]">The link will take you to complete your profile.</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button type="button" className="px-4 py-2 bg-[#242424] rounded hover:bg-[#2a2a2a] text-[#eaeaea]" onClick={() => router.push("/auth/sign-in")}>Back to Sign In</button>
                <button type="button" className="px-4 py-2 bg-[#242424] rounded hover:bg-[#2a2a2a] text-[#eaeaea]" onClick={() => setSent(false)}>Change Email</button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="w-[min(90vw,480px)] space-y-4">
            <h1 className="text-2xl font-semibold text-[#eaeaea]">Create Account</h1>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            <button disabled={loading} className="w-full px-4 py-2 bg-[#242424] rounded hover:bg-[#2a2a2a] text-[#eaeaea]">{loading ? "Signing up..." : "Sign Up"}</button>
            <div className="text-sm text-[#bdbdbd]">Already have an account? <button type="button" className="underline" onClick={() => router.push("/auth/sign-in")}>Sign in</button></div>
          </form>
        )}
      </div>
    </Bg>
  );
}

function maskEmail(e: string) {
  const [user, domain] = e.split("@");
  if (!domain) return e;
  const maskedUser = user.length <= 2 ? user : `${user.slice(0, 2)}${"*".repeat(Math.max(1, user.length - 2))}`;
  return `${maskedUser}@${domain}`;
}
