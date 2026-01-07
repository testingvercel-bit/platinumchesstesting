-- 1. Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prize_fund NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  details TEXT, -- Can store rich text or JSON if needed
  lichess_team_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create tournament_participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lichess_username TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Tournaments
-- Everyone can view tournaments
CREATE POLICY "Public tournaments are viewable by everyone" ON tournaments
  FOR SELECT USING (true);

-- Only admins can insert/update/delete tournaments
-- Note: You'll need to create a function or use a custom claim for 'is_admin' checks in RLS securely.
-- For simplicity in this SQL, we are assuming public read, and we will handle admin checks in the application logic 
-- or you can implement a secure RLS policy checking the profiles table.

CREATE POLICY "Admins can manage tournaments" ON tournaments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 6. Policies for Tournament Participants
-- Users can view who joined (optional, or restrict to admin/self)
CREATE POLICY "Participants viewable by everyone" ON tournament_participants
  FOR SELECT USING (true);

-- Users can join (insert) if they are authenticated
CREATE POLICY "Users can join tournaments" ON tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view/manage participants
CREATE POLICY "Admins can manage participants" ON tournament_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
