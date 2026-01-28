export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url?: string;
  balance_zar: number;
  is_admin?: boolean;
  verification_status?: 'unverified' | 'pending' | 'verified';
}

export interface Tournament {
  id: string;
  name: string;
  prize_fund: number;
  start_date: string;
  details: string;
  lichess_team_url: string;
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  lichess_username: string;
  joined_at: string;
  // Optional join to profile for display
  profiles?: Profile;
}
