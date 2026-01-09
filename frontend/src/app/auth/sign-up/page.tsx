"use client";
import Bg from "@/components/Bg";
import Logo from "@/components/Logo";
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

    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      
      setLoading(false);
      if (!res.ok) {
        setError(json.error || "Signup failed");
      } else {
        setSent(true);
      }
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred");
    }
  }

  return (
    <Bg>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-[min(92vw,520px)] mx-auto">
          <div className="rounded-3xl bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 backdrop-blur-xl border border-neutral-800 shadow-2xl shadow-black/40">
            <div className="p-8 md:p-12">
              <div className="flex flex-col items-center">
                <Logo size={160} />
                <div className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight text-neutral-50">Create your account</div>
                <div className="text-sm md:text-base text-neutral-400">Sign up to Platinum Chess</div>
              </div>

              {sent ? (
                <div className="mt-8 space-y-5 text-center">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-6 py-6">
                    <div className="text-lg font-semibold tracking-tight text-neutral-50">Verify Your Email</div>
                    <p className="text-neutral-300 mt-2">We sent a verification email to</p>
                    <p className="text-neutral-100 font-medium mt-1">{maskEmail(email)}</p>
                    <p className="text-neutral-400 mt-3">Click the verification link to activate your account.</p>
                    <p className="text-neutral-400">The link will take you to complete your profile.</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <button type="button" className="px-5 py-2.5 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-900 font-semibold tracking-tight" onClick={() => router.push("/auth/sign-in")}>Back to Sign In</button>
                      <button type="button" className="px-5 py-2.5 rounded-2xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-100" onClick={() => setSent(false)}>Change Email</button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-8 space-y-5">
                  {error && <div className="text-red-400 text-sm">{error}</div>}
                  <input
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                  <input
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                  <button
                    disabled={loading}
                    className="w-full px-5 py-3 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-900 font-semibold tracking-tight shadow-sm disabled:opacity-50"
                  >
                    {loading ? "Signing up..." : "Sign Up"}
                  </button>
                  <div className="text-sm text-neutral-400">
                    Already have an account? <button type="button" className="underline hover:text-neutral-300" onClick={() => router.push("/auth/sign-in")}>Sign in</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
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
