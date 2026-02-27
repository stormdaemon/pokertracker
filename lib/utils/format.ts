/**
 * Format a monetary amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR",
  locale: string = "fr-FR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, "0")}` : `${hours}h`;
}

/**
 * Format a profit amount with sign and color class
 */
export function formatProfit(amount: number, currency: string = "EUR", locale: string = "fr-FR") {
  const formatted = formatCurrency(Math.abs(amount), currency, locale);
  return {
    text: amount >= 0 ? `+${formatted}` : `-${formatted}`,
    isPositive: amount >= 0,
    className: amount >= 0 ? "text-profit" : "text-loss",
  };
}

/**
 * Format stakes as "SB/BB"
 */
export function formatStakes(smallBlind: number, bigBlind: number): string {
  return `${smallBlind}/${bigBlind}`;
}

/**
 * Format a percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate hourly rate from profit and duration in minutes
 */
export function calculateHourlyRate(profit: number, durationMinutes: number): number {
  if (durationMinutes <= 0) return 0;
  return profit / (durationMinutes / 60);
}
