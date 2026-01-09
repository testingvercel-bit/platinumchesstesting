import Link from "next/link";
import Bg from "@/components/Bg";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 60;

type TournamentRow = {
  id: string;
  name: string;
  prize_fund: number;
  start_date: string;
  details: string | null;
  lichess_team_url: string | null;
};

function formatStart(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TournamentsPage() {
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("tournaments")
    .select("id,name,prize_fund,start_date,details,lichess_team_url")
    .gte("start_date", nowIso)
    .order("start_date", { ascending: true })
    .limit(50);

  const tournaments: TournamentRow[] = Array.isArray(data) ? (data as any) : [];

  return (
    <Bg>
      <div className="px-4 md:px-0 w-[min(92vw,980px)] mx-auto py-12">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-50">
          Tournaments
        </h1>
        <p className="mt-2 text-neutral-400">
          Upcoming events and registration details.
        </p>

        {error ? (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 text-neutral-300">
            Unable to load tournaments right now.
          </div>
        ) : tournaments.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 text-neutral-300">
            No upcoming tournaments yet.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="block rounded-3xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md p-6 hover:bg-neutral-900/80 transition-colors"
              >
                <div className="text-neutral-50 font-semibold text-lg">{t.name}</div>
                <div className="mt-2 text-sm text-neutral-300">
                  Prize fund: ${Number(t.prize_fund || 0).toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-neutral-400">
                  Starts: {formatStart(t.start_date)}
                </div>
                {t.lichess_team_url ? (
                  <div className="mt-3 text-sm text-neutral-300 truncate">
                    Lichess team: {t.lichess_team_url}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Bg>
  );
}

