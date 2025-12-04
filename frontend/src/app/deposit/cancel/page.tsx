"use client";
import Bg from "@/components/Bg";
import { useRouter } from "next/navigation";

export default function DepositCancelPage() {
  const router = useRouter();
  return (
    <Bg>
      <div className="w-[min(92vw,700px)] mx-auto mt-12 text-center">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 px-8 py-12 shadow-2xl">
          <div className="text-2xl font-semibold tracking-tight text-neutral-50">Deposit Cancelled</div>
          <div className="mt-2 text-neutral-400">The payment was cancelled. No funds were deducted.</div>
          <div className="mt-6">
            <button onClick={() => router.push("/deposit")} className="px-6 py-3 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-900 font-semibold tracking-tight">Try Again</button>
          </div>
        </div>
      </div>
    </Bg>
  );
}

