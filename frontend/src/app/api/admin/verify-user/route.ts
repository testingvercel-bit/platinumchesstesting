import { createClient } from '@supabase/supabase-js';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return Response.json({ 
        error: 'Server configuration error: Missing Supabase keys' 
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
    });

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
