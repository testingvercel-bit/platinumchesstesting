import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return Response.json({ error: 'Empty body' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e: any) {
      console.error('Error parsing request body:', e);
      return Response.json({ error: 'Invalid JSON', details: e.message }, { status: 400 });
    }

    const { userId } = body;
    
    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch (e: any) {
      console.error('Missing Supabase configuration');
      return Response.json({ 
        error: 'Server configuration error: Missing Supabase keys' 
      }, { status: 500 });
    }

    // Verify the user
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ verification_status: 'verified' })
      .eq('id', userId);

    if (error) {
      console.error('Error verifying user:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Server error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
