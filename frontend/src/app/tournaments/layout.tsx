import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Tournament information and registration.",
  alternates: {
    canonical: "/tournaments",
  },
  openGraph: {
    title: "Tournaments",
    description: "Tournament information and registration.",
    url: "/tournaments",
  },
  twitter: {
    title: "Tournaments",
    description: "Tournament information and registration.",
  },
};

export default function TournamentsLayout({ children }: { children: ReactNode }) {
  return children;
}

