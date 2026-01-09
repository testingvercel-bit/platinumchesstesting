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
  verification_status: string;
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
      const { data: prof } = await s.from("profiles").select("id, full_name, username, phone_number, date_of_birth, verification_status").eq("id", user.id).maybeSingle();
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
              <div className="mt-8">
                {profile.verification_status !== 'verified' && (
                  <div className={`mb-6 p-4 rounded-xl border ${
                    profile.verification_status === 'pending' 
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' 
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="text-xl">ℹ️</div>
                      <div>
                        <h4 className="font-semibold mb-1">
                          {profile.verification_status === 'pending' ? 'Verification Pending' : 'Account Unverified'}
                        </h4>
                        <p className="text-sm opacity-90">
                          {profile.verification_status === 'pending' 
                            ? 'Your account is currently under review. You cannot play games until an admin verifies your account.'
                            : 'To verify your account, please make a deposit of at least $5. You cannot play games until verification is complete.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60">
                  <div className="divide-y divide-neutral-800">
                    <Row label="Full Name" value={profile.full_name} />
                    <Row label="Username" value={profile.username} />
                    <Row label="Email" value={email} />
                    <Row label="Phone" value={profile.phone_number} />
                    <Row label="Date of Birth" value={profile.date_of_birth} />
                    <Row 
                      label="Verification" 
                      value={profile.verification_status === 'verified' ? 'Verified' : profile.verification_status === 'pending' ? 'Pending' : 'Unverified'} 
                      valueClass={
                        profile.verification_status === 'verified' ? 'text-emerald-400' : 
                        profile.verification_status === 'pending' ? 'text-yellow-400' : 'text-neutral-500'
                      }
                    />
                  </div>
                  <div className="p-4 md:p-6">
                    <button disabled className="w-full px-5 py-3 rounded-2xl bg-neutral-800 text-neutral-500 font-semibold tracking-tight shadow-sm cursor-not-allowed opacity-50">Edit Profile</button>
                  </div>
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

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-3">
      <div className="text-neutral-400">{label}</div>
      <div className={`font-medium ${valueClass || 'text-neutral-100'}`}>{value}</div>
    </div>
  );
}
