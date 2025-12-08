/**
 * Core founder data structure used throughout the application.
 * Previously defined in FounderCard.tsx, now centralized here.
 */
export interface FounderData {
  id: string;
  name: string;
  shortBio: string;
  fullBio?: string;
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
  image?: string;
  atomId?: string; // INTUITION Atom ID (Hex) - populated after on-chain creation
  tags?: string[]; // Tags describing the founder's role/expertise
}

/**
 * Trend direction for score changes
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Winning totem data for a founder
 */
export interface WinningTotem {
  objectId: string;
  label: string;
  image?: string;
  netScore: bigint;
  totalFor: bigint;
  totalAgainst: bigint;
  claimCount: number;
  /** Trend based on FOR/AGAINST ratio: up if > 60% FOR, down if < 40% FOR, neutral otherwise */
  trend: TrendDirection;
}

/**
 * Founder data enriched with atomId and winning totem for HomePage
 */
export interface FounderForHomePage extends FounderData {
  winningTotem: WinningTotem | null;
  proposalCount: number;
  /** Number of new totems proposed in the last 24 hours */
  recentActivityCount: number;
}
