/**
 * Utility function to get founder image URL
 * Extracted from FounderCard.tsx for reuse across the app
 */

/**
 * Get the best available image URL for a founder
 * Priority: manual image > Twitter avatar > GitHub avatar > DiceBear fallback
 */
export function getFounderImageUrl(founder: {
  name: string;
  image?: string;
  twitter?: string | null;
  github?: string | null;
}): string {
  // 1. Manual image if provided
  if (founder.image) {
    return founder.image;
  }

  // 2. Twitter avatar via unavatar.io
  if (founder.twitter) {
    return `https://unavatar.io/twitter/${founder.twitter.replace('@', '')}`;
  }

  // 3. GitHub avatar
  if (founder.github) {
    return `https://github.com/${founder.github}.png`;
  }

  // 4. DiceBear fallback - generates unique avatar based on name
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
}
