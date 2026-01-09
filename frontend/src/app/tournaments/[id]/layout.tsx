import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 60;

type Params = { id: string };

type TournamentMeta = {
  name: string;
  details: string | null;
  start_date: string;
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("tournaments")
    .select("name,details,start_date")
    .eq("id", id)
    .maybeSingle();

  const t = (data || null) as TournamentMeta | null;
  const title = t?.name ? t.name : "Tournament";
  const description =
    (t?.details && t.details.trim().slice(0, 160)) ||
    "Tournament details and registration on PlatinumChess.";

  return {
    title,
    description,
    alternates: {
      canonical: `/tournaments/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `/tournaments/${id}`,
    },
    twitter: {
      title,
      description,
    },
    other: t?.start_date
      ? {
          "event:start_date": t.start_date,
          "og:type": "event",
          "og:url": `${getBaseUrl()}/tournaments/${id}`,
        }
      : undefined,
  };
}

export default function TournamentLayout({ children }: { children: ReactNode }) {
  return children;
}
