import "../styles/globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PlatinumChess",
    template: "%s | PlatinumChess",
  },
  description: "Checkmate has never paid better. Get paid while playing chess at any skill level.",
  applicationName: "PlatinumChess",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "PlatinumChess",
    title: "PlatinumChess — Checkmate has never paid better",
    description: "Get paid while playing chess at any skill level.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "PlatinumChess",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "PlatinumChess — Checkmate has never paid better",
    description: "Get paid while playing chess at any skill level.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [{ url: "/logo.ico", type: "image/x-icon" }],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/logo.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-[#111111] text-gray-100">
          <div className="max-w-[1400px] md:mx-auto md:p-4 px-0">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
