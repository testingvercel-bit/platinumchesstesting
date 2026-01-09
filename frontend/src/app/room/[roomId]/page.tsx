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
          <div className="bg-[#262421] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-[#3d3d37]">
            <h3 className="text-xl font-bold text-gray-100 mb-4">Verification Required</h3>
            <p className="text-gray-300 mb-6">You need to verify your account to join games.</p>
            <div className="flex gap-3">
              <button onClick={() => router.push("/")} className="flex-1 px-4 py-2 bg-[#3d3d37] hover:bg-[#4d4d45] text-gray-200 rounded font-medium transition-colors">Leave</button>
              <button onClick={() => router.push("/profile")} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors">Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
