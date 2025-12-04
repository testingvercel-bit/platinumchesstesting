"use client";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function HomePage() {
  const router = useRouter();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
      <Logo size={220} />
      <p className="text-[#bdbdbd]">Play instantly. Sign in to start.</p>
      <button onClick={() => router.push("/auth/sign-in")} className="px-6 py-3 bg-[#242424] rounded hover:bg-[#2a2a2a] text-[#eaeaea]">Start Playing</button>
    </div>
  );
}
