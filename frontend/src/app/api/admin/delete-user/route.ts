import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'delete-user route is active' });
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      const text = await req.text();
      if (!text) {
        return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (e: any) {
      console.error('JSON Parse Error:', e);
      return NextResponse.json({ error: 'Invalid JSON body', details: e.message }, { status: 400 });
    }
    
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Delete User Error: Missing server configuration');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase keys',
        debug: { hasUrl: !!supabaseUrl, hasServiceKey: !!supabaseServiceKey }
      }, { status: 503 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('Deleting tournament participants for user:', userId);
    const { error: tpError } = await supabaseAdmin
      .from('tournament_participants')
      .delete()
      .eq('user_id', userId);
    
    if (tpError) {
      console.error('Delete User Error (participants):', tpError);
      return NextResponse.json({ error: tpError.message }, { status: 500 });
    }

    console.log('Deleting profile for user:', userId);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error('Delete User Error (profile):', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Attempt to delete the auth user (optional, requires service role)
    console.log('Deleting auth user:', userId);
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Delete User Error (auth):', authError);
        // Non-fatal: profile and participants removed; return message
        return NextResponse.json({ success: true, authDelete: false, message: authError.message });
      }
    } catch (e: any) {
      console.error('Delete User Exception (auth):', e);
      return NextResponse.json({ success: true, authDelete: false, message: e?.message || 'Auth delete failed' });
    }

    return NextResponse.json({ success: true, authDelete: true });
  } catch (err: any) {
    console.error('Delete User Unhandled Exception:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
