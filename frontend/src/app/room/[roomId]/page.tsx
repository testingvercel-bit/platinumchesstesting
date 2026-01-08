"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Game from "@/components/Game";
import Header from "@/components/Header";
import { getSupabase } from "@/lib/supabaseClient";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const [username, setUsername] = useState<string>("");
  const [balanceUsd, setBalanceUsd] = useState<number>(0);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [isAuth, setIsAuth] = useState<boolean>(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    const s = getSupabase();
    s.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { setUsername("Account"); setIsAuth(false); return; }
      setIsAuth(true);
      const { data: prof } = await s.from("profiles").select("username,balance_usd,verification_status").eq("id", uid).maybeSingle();
      setUsername(((prof as any)?.username as string) || "Account");
      setBalanceUsd(Number((prof as any)?.balance_usd || 0));
      const status = (prof as any)?.verification_status || 'unverified';
      setVerificationStatus(status);
      
      if (status !== 'verified') {
        setShowVerificationModal(true);
      }
    });
  }, []);

  return (
    <div>
      <Header
        username={username || "Account"}
        balanceUsd={balanceUsd}
        onProfile={() => router.push("/profile")}
        onLogout={async () => { await getSupabase().auth.signOut(); router.push("/auth/sign-in"); }}
        onDeposit={() => router.push("/deposit")}
        onWithdraw={() => router.push("/profile")}
        isAuthenticated={isAuth}
        onLogin={() => router.push("/auth/sign-in")}
        onSignup={() => router.push("/auth/sign-up")}
        verificationStatus={verificationStatus}
      />
      <div className={`mt-4 ${showVerificationModal ? 'blur-sm pointer-events-none' : ''}`}>
        <Game roomId={roomId} />
      </div>

      {showVerificationModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <div className="px-5 py-4">
              <div className="text-lg font-semibold text-neutral-50">Verification Required</div>
              <div className="mt-1 text-sm text-neutral-400">You need to verify your account to play games.</div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 rounded-md bg-neutral-800 text-neutral-200 hover:bg-neutral-700" onClick={() => router.push("/playground")}>Leave</button>
                <button className="flex-1 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => router.push("/profile")}>Go to Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
