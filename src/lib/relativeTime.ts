/**
 * Converts an ISO string, Date object, or timestamp into a compact relative time string.
 * Output format: "just now", "5m ago", "2h ago", "3d ago", "1mo ago", "2y ago".
 */
export function relativeTime(
  timestamp: string | Date | number | null | undefined,
): string {
  if (!timestamp) return "";

  const now = Date.now();
  const past = new Date(timestamp).getTime();

  if (isNaN(past)) return "";

  const diffInSeconds = Math.floor((now - past) / 1000);

  // Handle minor clock skew or future timestamps
  if (diffInSeconds < 30) return "just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}