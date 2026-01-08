import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    let body: { userId?: string };
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: tpError } = await supabaseAdmin
      .from('tournament_participants')
      .delete()
      .eq('user_id', userId);
    if (tpError) {
      return NextResponse.json({ error: tpError.message }, { status: 500 });
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Attempt to delete the auth user (optional, requires service role)
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        // Non-fatal: profile and participants removed; return message
        return NextResponse.json({ success: true, authDelete: false, message: authError.message });
      }
    } catch (e: any) {
      return NextResponse.json({ success: true, authDelete: false, message: e?.message || 'Auth delete failed' });
    }

    return NextResponse.json({ success: true, authDelete: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
