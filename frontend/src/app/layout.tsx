import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "PlatinumChess",
  description: "Real-time chess",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#111111] text-gray-100">
        <div className="max-w-[1400px] md:mx-auto md:p-4 px-0">{children}</div>
      </body>
    </html>
  );
}
