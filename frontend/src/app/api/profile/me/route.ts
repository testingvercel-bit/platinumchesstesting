import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    // Create profile if missing
    const email = user.emailAddresses[0]?.emailAddress;
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: email,
        username: user.username || user.firstName || `user_${userId.substring(5, 10)}`, // Fallback
        balance_zar: 0,
        verification_status: "unverified"
      })
      .select()
      .single();
    
    if (createError) {
        console.error("Error creating profile:", createError);
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }
    profile = newProfile;
  }

  return NextResponse.json(profile);
}
