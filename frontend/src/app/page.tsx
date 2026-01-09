import type { Metadata } from "next";
import Playground from "@/components/Playground";

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Playground />
    </>
  );
}
