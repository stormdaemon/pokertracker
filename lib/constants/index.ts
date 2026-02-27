export const GAME_TYPES = [
  { value: "nlhe", label: "No-Limit Hold'em" },
  { value: "plo", label: "Pot-Limit Omaha" },
  { value: "plo5", label: "PLO-5" },
  { value: "stud", label: "Stud" },
  { value: "razz", label: "Razz" },
  { value: "horse", label: "H.O.R.S.E." },
  { value: "mixed", label: "Mixed" },
  { value: "other", label: "Autre" },
] as const;

export const GAME_FORMATS = [
  { value: "cash_game", label: "Cash Game" },
  { value: "tournament", label: "Tournoi" },
  { value: "sit_and_go", label: "Sit & Go" },
] as const;

export const LOCATION_TYPES = [
  { value: "casino", label: "Casino" },
  { value: "club", label: "Club" },
  { value: "home_game", label: "Home Game" },
  { value: "online", label: "Online" },
] as const;

export const POSITIONS = [
  "UTG", "UTG1", "UTG2", "MP", "MP1", "LJ", "HJ", "CO", "BTN", "SB", "BB",
] as const;

export const TOURNAMENT_STRUCTURES = [
  { value: "freezeout", label: "Freezeout" },
  { value: "rebuy", label: "Rebuy" },
  { value: "bounty", label: "Bounty" },
  { value: "pko", label: "PKO" },
  { value: "satellite", label: "Satellite" },
  { value: "hyper_turbo", label: "Hyper Turbo" },
  { value: "turbo", label: "Turbo" },
  { value: "deep_stack", label: "Deep Stack" },
] as const;

export const CURRENCIES = [
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "USD", label: "Dollar ($)", symbol: "$" },
  { value: "GBP", label: "Livre (£)", symbol: "£" },
  { value: "CAD", label: "Dollar CA (C$)", symbol: "C$" },
  { value: "AUD", label: "Dollar AU (A$)", symbol: "A$" },
  { value: "CHF", label: "Franc suisse (CHF)", symbol: "CHF" },
] as const;

export const MOODS = [
  { value: 1, label: "Terrible", emoji: "😫" },
  { value: 2, label: "Mauvais", emoji: "😟" },
  { value: 3, label: "Neutre", emoji: "😐" },
  { value: 4, label: "Bon", emoji: "🙂" },
  { value: 5, label: "Excellent", emoji: "😄" },
] as const;

export const BANKROLL_THRESHOLDS = {
  cash_game: { safe: 20, warning: 15, danger: 10 },
  tournament: { safe: 50, warning: 30, danger: 20 },
} as const;

export type GameType = (typeof GAME_TYPES)[number]["value"];
export type GameFormat = (typeof GAME_FORMATS)[number]["value"];
export type LocationType = (typeof LOCATION_TYPES)[number]["value"];
export type Position = (typeof POSITIONS)[number];
export type TournamentStructure = (typeof TOURNAMENT_STRUCTURES)[number]["value"];
export type Currency = (typeof CURRENCIES)[number]["value"];
