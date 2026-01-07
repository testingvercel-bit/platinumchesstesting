"use client";

import { useState } from "react";
import Logo from "@/components/Logo";

interface HeaderProps {
  username: string;
  balanceUsd?: number;
  onProfile: () => void;
  onLogout: () => Promise<void> | void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onSignup?: () => void;
}

export default function Header({
  username,
  balanceUsd,
  onProfile,
  onLogout,
  onDeposit,
  onWithdraw,
  isAuthenticated,
  onLogin,
  onSignup,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const initial = username?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="border-b border-neutral-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-20">
          <Logo size={80} />
          <div className="flex flex-col justify-center h-20">
            <span className="text-lg font-semibold tracking-tight text-neutral-50">Platinum Chess</span>
            <span className="text-xs font-medium tracking-tight text-neutral-400">Checkmate has never paid better.</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1.5">
                <span className="text-xs font-medium text-neutral-400">Balance</span>
                <span className="text-sm font-semibold tracking-tight text-emerald-400">${typeof balanceUsd === "number" ? balanceUsd.toFixed(2) : "--"}</span>
              </div>

              {onDeposit && (
                <button className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-500/90 hover:bg-emerald-400 transition-colors px-3.5 py-1.5 text-sm font-medium tracking-tight text-neutral-950 shadow-sm" onClick={onDeposit}>
                  <span>Deposit</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="m19 12-7 7-7-7" />
                  </svg>
                </button>
              )}

              {onWithdraw && (
                <button className="hidden sm:inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 transition-colors px-3.5 py-1.5 text-sm font-medium tracking-tight text-neutral-100" onClick={onWithdraw}>
                  <span>Withdraw</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5" />
                    <path d="m5 12 7-7 7 7" />
                  </svg>
                </button>
              )}

              <div className="relative hidden sm:block">
                <button className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-sm font-medium tracking-tight text-neutral-100" onClick={() => setIsMenuOpen((prev) => !prev)}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold tracking-tight">{initial}</span>
                  <span className="hidden sm:inline">{username || "Account"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#1a1a1a] border border-[#2f2f2f] shadow-xl overflow-hidden z-50">
                    <button className="w-full text-left px-4 py-3 text-gray-200 hover:bg-[#242424] transition-colors duration-150" onClick={() => { setIsMenuOpen(false); onProfile(); }}>Profile</button>
                    <button className="w-full text-left px-4 py-3 text-gray-200 hover:bg-[#242424] transition-colors duration-150 border-t border-[#2f2f2f]" onClick={async () => { setIsMenuOpen(false); await onLogout(); }}>Logout</button>
                  </div>
                )}
              </div>

              <button
                aria-label="Open menu"
                className="sm:hidden inline-flex items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 p-2 text-neutral-100"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </svg>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-4 py-2 text-sm font-medium tracking-tight text-neutral-100" onClick={() => onLogin && onLogin()}>Log in</button>
              <button className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium tracking-tight text-white" onClick={() => onSignup && onSignup()}>Sign up</button>
            </div>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-neutral-950 border-r border-neutral-800 p-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold tracking-tight text-neutral-100">{initial}</span>
              <span className="text-sm font-medium tracking-tight text-neutral-200">{username || "Account"}</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1.5 mb-3">
              <span className="text-xs font-medium text-neutral-400">Balance</span>
              <span className="text-sm font-semibold tracking-tight text-emerald-400">${typeof balanceUsd === "number" ? balanceUsd.toFixed(2) : "--"}</span>
            </div>
            {onDeposit && (
              <button className="w-full inline-flex items-center justify-between rounded-md bg-emerald-500/90 hover:bg-emerald-400 transition-colors px-3.5 py-2 text-sm font-medium tracking-tight text-neutral-950 shadow-sm mb-2" onClick={() => { setIsMobileMenuOpen(false); onDeposit(); }}>
                <span>Deposit</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </button>
            )}
            {onWithdraw && (
              <button className="w-full inline-flex items-center justify-between rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 transition-colors px-3.5 py-2 text-sm font-medium tracking-tight text-neutral-100 mb-2" onClick={() => { setIsMobileMenuOpen(false); onWithdraw(); }}>
                <span>Withdraw</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
              </button>
            )}
            <button className="w-full inline-flex items-center justify-between rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 transition-colors px-3.5 py-2 text-sm font-medium tracking-tight text-neutral-100 mb-2" onClick={() => { setIsMobileMenuOpen(false); onProfile(); }}>
              <span>Profile</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                <path d="M12 7a4 4 0 0 1 0 8" />
              </svg>
            </button>
            <button className="w-full inline-flex items-center justify-between rounded-md bg-[#b91c1c] hover:bg-[#dc2626] transition-colors px-3.5 py-2 text-sm font-medium tracking-tight text-neutral-50" onClick={async () => { setIsMobileMenuOpen(false); await onLogout(); }}>
              <span>Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
