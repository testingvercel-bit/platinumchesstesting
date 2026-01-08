import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Read body as text first to avoid any stream locking ambiguity
    const text = await req.text();
    if (!text) {
      return Response.json({ error: 'Empty body' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e: any) {
      console.error('JSON Parse Error:', e);
      return Response.json({ error: 'Invalid JSON body', details: e.message }, { status: 400 });
    }
    
    const { userId } = body;
    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch (e: any) {
      console.error('Delete User Error: Missing server configuration');
      return Response.json({ 
        error: 'Server configuration error: Missing Supabase keys' 
      }, { status: 503 });
    }

    console.log('Deleting tournament participants for user:', userId);
    const { error: tpError } = await supabaseAdmin
      .from('tournament_participants')
      .delete()
      .eq('user_id', userId);
    
    if (tpError) {
      console.error('Delete User Error (participants):', tpError);
      return Response.json({ error: tpError.message }, { status: 500 });
    }

    console.log('Deleting profile for user:', userId);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error('Delete User Error (profile):', profileError);
      return Response.json({ error: profileError.message }, { status: 500 });
    }

    // Attempt to delete the auth user
    console.log('Deleting auth user:', userId);
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Delete User Error (auth):', authError);
        return Response.json({ success: true, authDelete: false, message: authError.message });
      }
    } catch (e: any) {
      console.error('Delete User Exception (auth):', e);
      return Response.json({ success: true, authDelete: false, message: e?.message || 'Auth delete failed' });
    }

    return Response.json({ success: true, authDelete: true });
  } catch (err: any) {
    console.error('Delete User Unhandled Exception:', err);
    return Response.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
