import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const amount = Number(body?.amount);
  const method = String(body?.method || "");
  const account_details = body?.account_details || {};

  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  if (!method) return NextResponse.json({ error: "Invalid method" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: prof, error: e1 } = await supabase
    .from("profiles")
    .select("balance_zar")
    .eq("id", userId)
    .maybeSingle();

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  const bal = Number(prof?.balance_zar ?? 0);
  if (bal < amount) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

  const { error: e2 } = await supabase
    .from("profiles")
    .update({ balance_zar: +(bal - amount).toFixed(2) })
    .eq("id", userId);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const { data: inserted, error: e3 } = await supabase
    .from("withdrawals")
    .insert({
      user_id: userId,
      amount,
      method,
      account_details,
      status: "pending"
    })
    .select()
    .single();

  if (e3) {
    await supabase.from("profiles").update({ balance_zar: bal }).eq("id", userId);
    return NextResponse.json({ error: e3.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, withdrawal_id: inserted.id });
}
