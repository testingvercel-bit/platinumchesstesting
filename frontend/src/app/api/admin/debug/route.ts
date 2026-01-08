import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (Length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'Missing',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    RENDER: process.env.RENDER,
  };

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: envVars
  });
}
