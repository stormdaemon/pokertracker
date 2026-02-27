export type GameType = "nlhe" | "plo" | "plo5" | "stud" | "razz" | "horse" | "mixed" | "other";
export type GameFormat = "cash_game" | "tournament" | "sit_and_go";
export type LocationType = "casino" | "club" | "home_game" | "online";
export type PositionType = "UTG" | "UTG1" | "UTG2" | "MP" | "MP1" | "LJ" | "HJ" | "CO" | "BTN" | "SB" | "BB";
export type BankrollTxType = "deposit" | "withdrawal" | "session_result" | "adjustment" | "bonus";
export type TournamentStructureType = "freezeout" | "rebuy" | "bounty" | "pko" | "satellite" | "hyper_turbo" | "turbo" | "deep_stack";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  default_currency: string;
  timezone: string;
  default_game_type: GameType | null;
  default_stake: string | null;
  bankroll_initial: number;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  user_id: string;
  name: string;
  type: LocationType;
  address: string | null;
  city: string | null;
  country: string | null;
  platform_url: string | null;
  notes: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  location_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  game_type: GameType;
  game_format: GameFormat;
  is_online: boolean;
  small_blind: number | null;
  big_blind: number | null;
  ante: number | null;
  straddle: boolean;
  max_buyin_bb: number | null;
  currency: string;
  buy_in_total: number;
  cash_out: number | null;
  profit: number | null;
  tip: number;
  rake_paid: number | null;
  expenses: number;
  net_profit: number | null;
  table_size: number | null;
  mood_before: number | null;
  mood_after: number | null;
  focus_level: number | null;
  notes: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  location?: Location;
}

export interface BuyIn {
  id: string;
  session_id: string;
  user_id: string;
  amount: number;
  bought_at: string;
  notes: string | null;
}

export interface Tournament {
  id: string;
  session_id: string;
  user_id: string;
  tournament_name: string | null;
  buy_in_amount: number;
  fee: number;
  rebuy_count: number;
  rebuy_cost: number;
  addon_count: number;
  addon_cost: number;
  total_entries: number | null;
  finish_position: number | null;
  prize_won: number;
  bounties_won: number;
  is_bounty: boolean;
  guaranteed_prize: number | null;
  structure_type: TournamentStructureType;
  itm: boolean;
  total_invested: number;
  roi_percent: number;
}

export interface BankrollTransaction {
  id: string;
  user_id: string;
  type: BankrollTxType;
  amount: number;
  balance_after: number;
  session_id: string | null;
  currency: string;
  description: string | null;
  created_at: string;
}

export interface HandNote {
  id: string;
  session_id: string;
  user_id: string;
  hand_number: number | null;
  hero_position: PositionType | null;
  hero_cards: string | null;
  board: string | null;
  pot_size: number | null;
  result: number | null;
  action_summary: string | null;
  villain_description: string | null;
  lesson_learned: string | null;
  tags: string[];
  created_at: string;
}
