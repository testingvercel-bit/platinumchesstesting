"use client";
import Bg from "@/components/Bg";
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
      <div className="w-[min(90vw,700px)] space-y-6">
        <div className="text-3xl font-bold text-[#eaeaea]">Your Profile</div>
        <div className="px-6 py-6 bg-[#242424] border border-[#333333] text-[#eaeaea]">
          {profile ? (
            <div className="space-y-4">
              <Row label="Full Name" value={profile.full_name} />
              <Row label="Username" value={profile.username} />
              <Row label="Email" value={email} />
              <Row label="Phone" value={profile.phone_number} />
              <Row label="Date of Birth" value={profile.date_of_birth} />
              <div className="pt-2">
                <button className="px-4 py-2 bg-[#242424] border border-[#333333] hover:bg-[#2a2a2a]" onClick={() => router.push("/complete-profile")}>Edit Profile</button>
              </div>
            </div>
          ) : (
            <div className="text-[#bdbdbd]">Loading profile...</div>
          )}
        </div>
      </div>
    </Bg>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[#bdbdbd]">{label}</div>
      <div className="text-[#eaeaea] font-medium">{value}</div>
    </div>
  );
}
