import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { userId, amountChange } = body;
    if (!userId || typeof amountChange !== 'number' || !isFinite(amountChange)) {
      console.error('Update Balance Error: Invalid inputs', { userId, amountChange });
      return NextResponse.json({ error: 'userId and numeric amountChange are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Update Balance Config:', { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey,
      keyLength: supabaseServiceKey?.length 
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Update Balance Error: Missing server configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('Fetching profile for balance update:', userId);
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('balance_usd')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Update Balance Error (fetch):', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    const current = Number(profile?.balance_usd ?? 0);
    const next = Math.round((current + amountChange) * 100) / 100;

    console.log('Updating balance:', { userId, current, amountChange, next });
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance_usd: next })
      .eq('id', userId);

    if (updateError) {
      console.error('Update Balance Error (update):', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, balance_usd: next });
  } catch (err: any) {
    console.error('Update Balance Unhandled Exception:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
