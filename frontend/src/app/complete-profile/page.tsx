"use client";
import Bg from "@/components/Bg";
import { getSupabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id || null;
      if (!uid) router.push("/auth/sign-in");
      setUserId(uid);
    });
  }, [router]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (username.trim().length < 3) { setUsernameAvailable(null); return; }
      const { data } = await getSupabase().from("profiles").select("id").eq("username", username).limit(1);
      setUsernameAvailable((data?.length || 0) === 0);
    }, 250);
    return () => clearTimeout(t);
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return;
    if (!usernameAvailable) { setError("Username not available"); return; }
    setLoading(true);
    const { error: err } = await getSupabase().from("profiles").upsert({ id: userId, full_name: fullName, username, phone_number: phone, date_of_birth: dob });
    setLoading(false);
    if (err) setError(err.message);
    else {
      // Trigger welcome email (non-blocking)
      fetch('/api/emails/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username }),
      }).catch(console.error);

      router.push("/");
    }
  }

  return (
    <Bg>
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={onSubmit} className="w-[min(90vw,560px)] space-y-4">
          <h1 className="text-2xl font-semibold text-[#eaeaea]">Complete Profile</h1>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
          <div>
            <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            {username && (
              <div className="text-xs mt-1">
                {usernameAvailable === null ? "" : usernameAvailable ? "Username available" : "Username taken"}
              </div>
            )}
          </div>
          <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
          <input className="w-full px-3 py-2 bg-[#242424] border border-[#333333] rounded text-[#eaeaea]" type="date" placeholder="Date of Birth" value={dob} onChange={e => setDob(e.target.value)} required />
          <button disabled={loading} className="w-full px-4 py-2 bg-[#242424] rounded hover:bg-[#2a2a2a] text-[#eaeaea]">{loading ? "Saving..." : "Save Profile"}</button>
        </form>
      </div>
    </Bg>
  );
}
