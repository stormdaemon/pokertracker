-- ============================================
-- Poker Tracker Pro - Initial Schema
-- ============================================

-- Enums
CREATE TYPE game_type_enum AS ENUM ('nlhe', 'plo', 'plo5', 'stud', 'razz', 'horse', 'mixed', 'other');
CREATE TYPE game_format_enum AS ENUM ('cash_game', 'tournament', 'sit_and_go');
CREATE TYPE location_type_enum AS ENUM ('casino', 'club', 'home_game', 'online');
CREATE TYPE position_enum AS ENUM ('UTG', 'UTG1', 'UTG2', 'MP', 'MP1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB');
CREATE TYPE bankroll_tx_type_enum AS ENUM ('deposit', 'withdrawal', 'session_result', 'adjustment', 'bonus');
CREATE TYPE tournament_structure_enum AS ENUM ('freezeout', 'rebuy', 'bounty', 'pko', 'satellite', 'hyper_turbo', 'turbo', 'deep_stack');

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  default_currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  default_game_type game_type_enum,
  default_stake TEXT,
  bankroll_initial NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, default_currency, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Joueur'),
    'EUR',
    'Europe/Paris'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- LOCATIONS
-- ============================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type location_type_enum NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  platform_url TEXT,
  notes TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY locations_select ON locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY locations_insert ON locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY locations_update ON locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY locations_delete ON locations FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SESSIONS
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL AND started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER / 60
      ELSE NULL
    END
  ) STORED,

  game_type game_type_enum NOT NULL,
  game_format game_format_enum NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,

  small_blind NUMERIC(10,2),
  big_blind NUMERIC(10,2),
  ante NUMERIC(10,2),
  straddle BOOLEAN NOT NULL DEFAULT false,
  max_buyin_bb INTEGER,

  currency TEXT NOT NULL DEFAULT 'EUR',
  buy_in_total NUMERIC(12,2) NOT NULL,
  cash_out NUMERIC(12,2),
  profit NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN cash_out IS NOT NULL THEN cash_out - buy_in_total ELSE NULL END
  ) STORED,
  tip NUMERIC(10,2) NOT NULL DEFAULT 0,
  rake_paid NUMERIC(10,2),
  expenses NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN cash_out IS NOT NULL THEN cash_out - buy_in_total - COALESCE(tip, 0) - COALESCE(expenses, 0) ELSE NULL END
  ) STORED,

  table_size INTEGER CHECK (table_size IS NULL OR (table_size BETWEEN 2 AND 10)),
  mood_before SMALLINT CHECK (mood_before IS NULL OR (mood_before BETWEEN 1 AND 5)),
  mood_after SMALLINT CHECK (mood_after IS NULL OR (mood_after BETWEEN 1 AND 5)),
  focus_level SMALLINT CHECK (focus_level IS NULL OR (focus_level BETWEEN 1 AND 5)),
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_dates CHECK (ended_at IS NULL OR ended_at > started_at),
  CONSTRAINT valid_buyin CHECK (buy_in_total >= 0),
  CONSTRAINT valid_cashout CHECK (cash_out IS NULL OR cash_out >= 0)
);

CREATE INDEX idx_sessions_user_date ON sessions (user_id, started_at DESC);
CREATE INDEX idx_sessions_user_game ON sessions (user_id, game_type);
CREATE INDEX idx_sessions_user_location ON sessions (user_id, location_id);
CREATE INDEX idx_sessions_active ON sessions (user_id, is_active) WHERE is_active = true;

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_select ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sessions_insert ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sessions_update ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY sessions_delete ON sessions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BUY_INS
-- ============================================
CREATE TABLE buy_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  bought_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE buy_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY buy_ins_select ON buy_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY buy_ins_insert ON buy_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY buy_ins_update ON buy_ins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY buy_ins_delete ON buy_ins FOR DELETE USING (auth.uid() = user_id);

-- Trigger: sync buy_in_total on sessions
CREATE OR REPLACE FUNCTION sync_buyin_total()
RETURNS TRIGGER AS $$
DECLARE
  v_session_id UUID;
BEGIN
  v_session_id := COALESCE(NEW.session_id, OLD.session_id);
  UPDATE sessions
  SET buy_in_total = COALESCE((SELECT SUM(amount) FROM buy_ins WHERE session_id = v_session_id), 0)
  WHERE id = v_session_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_buyin_change
  AFTER INSERT OR UPDATE OR DELETE ON buy_ins
  FOR EACH ROW EXECUTE FUNCTION sync_buyin_total();

-- ============================================
-- TOURNAMENTS
-- ============================================
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_name TEXT,
  buy_in_amount NUMERIC(10,2) NOT NULL,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  rebuy_count INTEGER NOT NULL DEFAULT 0,
  rebuy_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  addon_count INTEGER NOT NULL DEFAULT 0,
  addon_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_entries INTEGER,
  finish_position INTEGER CHECK (finish_position IS NULL OR finish_position >= 1),
  prize_won NUMERIC(12,2) NOT NULL DEFAULT 0,
  bounties_won NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_bounty BOOLEAN NOT NULL DEFAULT false,
  guaranteed_prize NUMERIC(12,2),
  structure_type tournament_structure_enum NOT NULL,
  total_invested NUMERIC(12,2) GENERATED ALWAYS AS (
    buy_in_amount + fee + (rebuy_count * rebuy_cost) + (addon_count * addon_cost)
  ) STORED,
  roi_percent NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN (buy_in_amount + fee + (rebuy_count * rebuy_cost) + (addon_count * addon_cost)) > 0
      THEN ((prize_won + bounties_won - buy_in_amount - fee - (rebuy_count * rebuy_cost) - (addon_count * addon_cost))
            / (buy_in_amount + fee + (rebuy_count * rebuy_cost) + (addon_count * addon_cost))) * 100
      ELSE 0
    END
  ) STORED,
  itm BOOLEAN GENERATED ALWAYS AS (prize_won > 0) STORED
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tournaments_select ON tournaments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tournaments_insert ON tournaments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tournaments_update ON tournaments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY tournaments_delete ON tournaments FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BANKROLL_TRANSACTIONS
-- ============================================
CREATE TABLE bankroll_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type bankroll_tx_type_enum NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bankroll_user_date ON bankroll_transactions (user_id, created_at DESC);

ALTER TABLE bankroll_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY bankroll_tx_select ON bankroll_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bankroll_tx_insert ON bankroll_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bankroll_tx_update ON bankroll_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY bankroll_tx_delete ON bankroll_transactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- HAND_NOTES
-- ============================================
CREATE TABLE hand_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hand_number INTEGER,
  hero_position position_enum,
  hero_cards TEXT,
  board TEXT,
  pot_size NUMERIC(10,2),
  result NUMERIC(10,2),
  action_summary TEXT,
  villain_description TEXT,
  lesson_learned TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hand_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY hand_notes_select ON hand_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY hand_notes_insert ON hand_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY hand_notes_update ON hand_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY hand_notes_delete ON hand_notes FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION get_bankroll_balance(p_user_id UUID)
RETURNS NUMERIC(12,2) AS $$
  SELECT COALESCE(
    (SELECT balance_after FROM bankroll_transactions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1),
    (SELECT bankroll_initial FROM profiles WHERE id = p_user_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
