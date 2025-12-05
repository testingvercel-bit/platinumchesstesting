"use client";
import Bg from "@/components/Bg";
import Logo from "@/components/Logo";
import { getSupabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  full_name: string;
  username: string;
  phone_number: string;
  date_of_birth: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const s = getSupabase();
    s.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) { router.push("/auth/sign-in"); return; }
      setEmail(user.email || "");
      const { data: prof } = await s.from("profiles").select("id, full_name, username, phone_number, date_of_birth").eq("id", user.id).maybeSingle();
      if (!prof) { router.push("/complete-profile"); return; }
      setProfile(prof as Profile);
    });
  }, [router]);

  return (
    <Bg>
      <div className="px-4 md:px-0 w-[min(92vw,800px)] mx-auto">
        <div className="mt-6 rounded-3xl bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 backdrop-blur-xl border border-neutral-800 shadow-2xl shadow-black/40">
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center">
              <Logo size={120} />
              <div className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight text-neutral-50">Your Profile</div>
              <div className="text-sm md:text-base text-neutral-400">Manage your account details</div>
            </div>

            {profile ? (
              <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/60">
                <div className="divide-y divide-neutral-800">
                  <Row label="Full Name" value={profile.full_name} />
                  <Row label="Username" value={profile.username} />
                  <Row label="Email" value={email} />
                  <Row label="Phone" value={profile.phone_number} />
                  <Row label="Date of Birth" value={profile.date_of_birth} />
                </div>
                <div className="p-4 md:p-6">
                  <button className="w-full px-5 py-3 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-900 font-semibold tracking-tight shadow-sm" onClick={() => router.push("/complete-profile")}>Edit Profile</button>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-neutral-400">Loading profile...</div>
            )}
          </div>
        </div>
      </div>
    </Bg>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-3">
      <div className="text-neutral-400">{label}</div>
      <div className="text-neutral-100 font-medium">{value}</div>
    </div>
  );
}
