-- Migration to support Clerk Auth (String IDs)

-- 1. Drop Foreign Keys referencing auth.users (since Clerk IDs are not in auth.users)
-- Note: Constraint names might vary, using likely defaults or trying to find them.
-- We use "IF EXISTS" to avoid errors.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey; -- Some setups use user_id
ALTER TABLE tournament_participants DROP CONSTRAINT IF EXISTS tournament_participants_user_id_fkey;
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_user_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- Games table might link to auth.users or profiles
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_white_id_fkey;
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_black_id_fkey;
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_winner_id_fkey;
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_loser_id_fkey;

-- Drop policies that depend on the columns to be altered
DROP POLICY IF EXISTS "Admins can manage tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can join tournaments" ON tournament_participants;
DROP POLICY IF EXISTS "Admins can manage participants" ON tournament_participants;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;

-- 2. Alter columns to TEXT to support Clerk IDs (e.g. "user_2...")
-- We cast existing UUIDs to TEXT.

ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE tournament_participants ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE withdrawals ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE transactions ALTER COLUMN user_id TYPE TEXT;

-- Games table columns
ALTER TABLE games ALTER COLUMN white_id TYPE TEXT;
ALTER TABLE games ALTER COLUMN black_id TYPE TEXT;
ALTER TABLE games ALTER COLUMN winner_id TYPE TEXT;
ALTER TABLE games ALTER COLUMN loser_id TYPE TEXT;

-- 3. Recreate RLS Policies with casts
CREATE POLICY "Admins can manage tournaments" ON tournaments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()::text AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can join tournaments" ON tournament_participants
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage participants" ON tournament_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()::text AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can view all withdrawals" ON withdrawals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()::text AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update withdrawals" ON withdrawals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()::text AND profiles.is_admin = true
    )
  );

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "transactions_update_own" ON transactions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 4. Notes
-- Since we are moving away from Supabase Auth, auth.uid() will not work as expected
-- unless we integrate Clerk with Supabase JWT.
-- For now, we will relax RLS or rely on backend API (Service Role) for sensitive ops.
-- Frontend reads might need to be proxied or allowed publicly if safe.
-- For profiles, we might allow public read for some fields, but private for balance.
-- Best approach: Proxy profile fetch via API.

-- Dropping policies that rely on auth.uid() might be needed if they block even Service Role (unlikely).
-- Service Role bypasses RLS.
