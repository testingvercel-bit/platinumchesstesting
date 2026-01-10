import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { resend, getSenderEmail } from '@/lib/resend';
import { welcomeEmailHtml } from '@/lib/emailHtml';

export async function POST(req: NextRequest) {
  try {
    const { userId, username } = await req.json();

    if (!userId || !username) {
      return NextResponse.json({ error: 'Missing userId or username' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get the user's email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'User not found or email missing' }, { status: 404 });
    }

    // Send the welcome email
    const { error: emailError } = await resend.emails.send({
      from: getSenderEmail(),
      to: user.email,
      subject: 'Welcome to PlatinumChess!',
      html: welcomeEmailHtml(username),
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Welcome email error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
