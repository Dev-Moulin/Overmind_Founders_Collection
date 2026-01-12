/**
 * Time and amount formatting utilities
 */

/**
 * Truncate a number to N decimal places (no rounding)
 * Like INTUITION does - shows exact value without rounding up
 *
 * @param value - Number or string to truncate
 * @param decimals - Number of decimal places (default: 5)
 * @returns Truncated string without trailing zeros
 *
 * @example
 * truncateAmount(0.0029799, 5) → "0.00297"
 * truncateAmount("0.002969999998", 5) → "0.00296"
 * truncateAmount(0.1, 5) → "0.1"
 */
export function truncateAmount(value: number | string, decimals: number = 5): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  // Truncate by using floor with multiplier (no rounding)
  const multiplier = Math.pow(10, decimals);
  const truncated = Math.floor(num * multiplier) / multiplier;

  // Convert to string and remove trailing zeros
  let result = truncated.toFixed(decimals);
  // Remove trailing zeros but keep at least one decimal
  result = result.replace(/\.?0+$/, '');
  // If we removed all decimals, add back the integer
  if (!result.includes('.') && truncated !== Math.floor(truncated)) {
    result = truncated.toFixed(decimals).replace(/0+$/, '');
  }

  return result || '0';
}

/**
 * Format amount with sign prefix (+ or -)
 * Uses truncation (not rounding) for INTUITION-like display
 *
 * @param value - Amount value
 * @param isPositive - true for +, false for -
 * @param decimals - Number of decimal places (default: 5)
 * @returns Signed truncated amount (e.g., "+0.00297" or "-0.00297")
 */
export function formatSignedAmount(value: number | string, isPositive: boolean, decimals: number = 5): string {
  const truncated = truncateAmount(value, decimals);
  return `${isPositive ? '+' : '-'}${truncated}`;
}

/**
 * Format seconds since update for display (French)
 * Used by RefreshIndicator for subscription status
 *
 * @param seconds - Number of seconds since last update
 * @returns Formatted string (e.g., "à l'instant", "il y a 5s", "il y a 2min")
 */
export function formatTimeSinceUpdate(seconds: number): string {
  if (seconds < 5) return 'à l\'instant';
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `il y a ${hours}h`;
}

/**
 * Format timestamp to relative time string (compact French)
 * Used by VotePanel for recent activity display
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted string (e.g., "à l'instant", "2m", "1h", "2j")
 */
export function getTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'à l\'instant';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}j`;
  return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
