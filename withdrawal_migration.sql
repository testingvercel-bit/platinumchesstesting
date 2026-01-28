-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  account_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Admins can update withdrawals (e.g. status)
CREATE POLICY "Admins can update withdrawals" ON withdrawals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Users can insert withdrawals (via the stored procedure usually, but RLS needed if direct insert)
-- We will use a stored procedure for safety, but allowing insert for self is okay if we didn't use the procedure.
-- However, since we want to deduct balance, we MUST use a function or rely on client to do both (unsafe).
-- Let's stick to the function approach for the request.

-- Stored Procedure to Request Withdrawal
CREATE OR REPLACE FUNCTION request_withdrawal(
  p_amount NUMERIC,
  p_method TEXT,
  p_account_details JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_withdrawal_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Check balance
  SELECT balance_zar INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE; -- Lock the row

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('error', 'Insufficient balance');
  END IF;

  -- Deduct balance
  UPDATE profiles
  SET balance_zar = balance_zar - p_amount
  WHERE id = v_user_id;

  -- Create withdrawal record
  INSERT INTO withdrawals (user_id, amount, method, account_details, status)
  VALUES (v_user_id, p_amount, p_method, p_account_details, 'pending')
  RETURNING id INTO v_withdrawal_id;

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_withdrawal_id);
END;
$$;

-- Stored Procedure to Reject Withdrawal (Admin only)
-- When rejected, funds should be returned.
CREATE OR REPLACE FUNCTION reject_withdrawal(
  p_withdrawal_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
  v_withdrawal_record RECORD;
BEGIN
  -- Check if admin
  v_admin_id := auth.uid();
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = v_admin_id;
  
  IF v_is_admin IS NOT TRUE THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Get withdrawal record
  SELECT * INTO v_withdrawal_record
  FROM withdrawals
  WHERE id = p_withdrawal_id AND status = 'pending'
  FOR UPDATE;

  IF v_withdrawal_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Withdrawal not found or not pending');
  END IF;

  -- Update status
  UPDATE withdrawals
  SET status = 'rejected'
  WHERE id = p_withdrawal_id;

  -- Refund balance
  UPDATE profiles
  SET balance_zar = balance_zar + v_withdrawal_record.amount
  WHERE id = v_withdrawal_record.user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
