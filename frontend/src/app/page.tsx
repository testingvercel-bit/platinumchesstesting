import type { Metadata } from "next";
import Link from "next/link";
import Bg from "@/components/Bg";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Checkmate has never paid better",
  description: "Get paid while playing chess at any skill level.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Checkmate has never paid better",
    description: "Get paid while playing chess at any skill level.",
    url: "/",
  },
  twitter: {
    title: "Checkmate has never paid better",
    description: "Get paid while playing chess at any skill level.",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PlatinumChess",
    url:
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          (process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")) +
          "/tournaments/{search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Bg>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="px-4 md:px-0 w-[min(92vw,980px)] mx-auto py-16">
        <div className="flex flex-col items-center text-center">
          <Logo size={120} />
          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight text-neutral-50">
            Checkmate has never paid better
          </h1>
          <p className="mt-4 text-base md:text-lg text-neutral-300 max-w-2xl">
            Get paid while playing chess at any skill level.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/playground"
              className="px-6 py-3 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-900 font-semibold tracking-tight text-center"
            >
              Play now
            </Link>
            <Link
              href="/auth/sign-in"
              className="px-6 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold tracking-tight text-center"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md p-6">
              <div className="text-neutral-50 font-semibold">Live matchmaking</div>
              <div className="mt-2 text-neutral-400 text-sm">
                Pick a time control and get paired instantly.
              </div>
            </div>
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md p-6">
              <div className="text-neutral-50 font-semibold">Secure accounts</div>
              <div className="mt-2 text-neutral-400 text-sm">
                Sign up and manage your profile in-app.
              </div>
            </div>
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md p-6">
              <div className="text-neutral-50 font-semibold">Tournaments</div>
              <div className="mt-2 text-neutral-400 text-sm">
                Join scheduled events and compete for prizes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Bg>
  );
}
