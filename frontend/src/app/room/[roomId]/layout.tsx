import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Game Room",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RoomLayout({ children }: { children: ReactNode }) {
  return children;
}

