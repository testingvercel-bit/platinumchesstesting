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
    
    const { userId, amountChange } = body;
    if (!userId || typeof amountChange !== 'number' || !isFinite(amountChange)) {
      console.error('Update Balance Error: Invalid inputs', { userId, amountChange });
      return Response.json({ error: 'userId and numeric amountChange are required' }, { status: 400 });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch (e: any) {
      console.error('Update Balance Error: Missing server configuration');
      return Response.json({ 
        error: 'Server configuration error: Missing Supabase keys' 
      }, { status: 500 });
    }

    console.log('Fetching profile for balance update:', userId);
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('balance_zar')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Update Balance Error (fetch):', fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }
    const current = Number(profile?.balance_zar ?? 0);
    const next = Math.round((current + amountChange) * 100) / 100;

    console.log('Updating balance:', { userId, current, amountChange, next });
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance_zar: next })
      .eq('id', userId);

    if (updateError) {
      console.error('Update Balance Error (update):', updateError);
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true, balance_zar: next });
  } catch (err: any) {
    console.error('Update Balance Unhandled Exception:', err);
    return Response.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
