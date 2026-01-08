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

  useEffect(() => {
    const s = getSupabase();
    s.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { setUsername("Account"); setIsAuth(false); return; }
      setIsAuth(true);
      const { data: prof } = await s.from("profiles").select("username,balance_usd,verification_status").eq("id", uid).maybeSingle();
      setUsername(((prof as any)?.username as string) || "Account");
      setBalanceUsd(Number((prof as any)?.balance_usd || 0));
      setVerificationStatus((prof as any)?.verification_status || 'unverified');
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
      <div className="mt-4">
        <Game roomId={roomId} />
      </div>
    </div>
  );
}
