import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Play",
  description: "Checkmate has never paid better. Get paid while playing chess at any skill level.",
  alternates: {
    canonical: "/playground",
  },
  openGraph: {
    title: "Play",
    description: "Checkmate has never paid better. Get paid while playing chess at any skill level.",
    url: "/playground",
  },
  twitter: {
    title: "Play",
    description: "Checkmate has never paid better. Get paid while playing chess at any skill level.",
  },
};

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return children;
}
