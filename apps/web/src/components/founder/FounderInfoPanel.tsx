/**
 * FounderInfoPanel - Left panel showing founder information
 *
 * Displays:
 * - Photo + name
 * - Short bio
 * - Tags (if any)
 * - Social links (Twitter, GitHub, LinkedIn)
 * - Vote Market stats (collapsible)
 *
 * @see Phase 9 in TODO_Implementation.md
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FounderForHomePage } from '../../hooks';
import { getFounderImageUrl } from '../../utils/founderImage';
import { truncateAmount } from '../../utils/formatters';
import { VoteMarketCompact } from '../vote/VoteMarket';
import { TopTotemsRadar } from '../graph/TopTotemsRadar';
import { RelationsRadar } from '../graph/RelationsRadar';
import { useTopTotems } from '../../hooks';
import { useFounderPanelStats } from '../../hooks';
import { useFounderTags } from '../../hooks';
import { useTopTotemsByCurve, type CurveWinner, type TotemWithCurves, type CurveStats } from '../../hooks/data/useTopTotemsByCurve';
import { SUPPORT_COLORS, OPPOSE_COLORS, CURVE_COLORS } from '../../config/colors';
import { GooeySwitch } from '../common';

/**
 * Trophy icon for winners - Laurel wreath
 */
function TrophyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="m9.654,8.86c-.199-.19-.206-.508-.015-.707l1.742-1.814c.278-.277.682-.36,1.037-.211.354.146.583.489.583.872v8.5c0,.276-.224.5-.5.5s-.5-.224-.5-.5V7.139l-1.639,1.708c-.191.198-.509.206-.707.014Zm-6.257,3.641c.005,0,.01,0,.015,0-.01-.008-.044-.024-.015,0Zm1.721-1.879v-.009c-.014-.021-.005,0,0,.009Zm15.659,1.878s.005,0,.008,0c.02-.011,0-.004-.008,0Zm3.206,1.062c.191.394.194.846.006,1.24-.475,1-1.32,2.297-2.745,3.189.133.101.257.201.372.299.358.304.551.746.528,1.212-.023.459-.253.872-.632,1.134-.788.544-1.977,1.181-3.376,1.331.02.046.039.092.057.136.156.381.128.807-.076,1.166s-.555.602-.962.664c-.49.074-.939.108-1.351.108-1.913,0-3.026-.734-3.675-1.582-.648.849-1.762,1.582-3.674,1.582-.412,0-.861-.034-1.351-.108-.408-.062-.759-.305-.963-.665-.204-.359-.231-.784-.076-1.166.018-.044.037-.089.057-.135-1.4-.15-2.588-.787-3.376-1.331-.379-.262-.609-.675-.632-1.134-.023-.466.169-.908.528-1.212.098-.084.204-.169.315-.255-1.468-.893-2.333-2.217-2.816-3.233-.188-.395-.185-.847.006-1.24.204-.419.589-.72,1.057-.825.126-.029.259-.056.397-.082-.455-.348-.851-.795-1.06-1.334-.608-1.569-.432-3.521-.178-4.881.08-.423.36-.778.751-.951.359-.16.769-.146,1.118.029-.168-.632-.15-1.293.188-1.935C3.202,2.096,4.726.927,5.867.208c.379-.239.831-.272,1.239-.099.427.184.738.576.833,1.049.539,2.705-.04,5.217-1.674,7.314-.932,7.465,2.922,11.545,5.879,11.99,2.947-.444,6.787-4.526,5.849-12.001-2.228-2.915-1.926-6.036-1.673-7.303.094-.473.406-.865.833-1.049.409-.175.859-.14,1.238.099,1.141.719,2.666,1.888,3.449,3.374.338.642.355,1.303.188,1.935.349-.175.759-.188,1.118-.03.391.174.672.529.751.951.255,1.361.431,3.312-.177,4.882-.214.551-.62,1.004-1.085,1.354.101.02.2.041.294.062.467.105.852.406,1.056.825ZM5.299,8.076c1.606-1.925,2.164-4.185,1.658-6.723-.03-.15-.123-.271-.247-.325-.036-.016-.081-.028-.132-.028-.054,0-.115.014-.179.054-.849.535-2.38,1.636-3.096,2.995-.756,1.437,1.17,3.314,1.996,4.027Zm-1.903,4.425c.592.014,1.228.096,1.844.287-.086-.682-.129-1.404-.123-2.166.003.006.005.007,0-.009-.759-2.181-2.246-3.534-3.311-4.189-.128-.079-.245-.042-.289-.021-.054.023-.147.084-.173.222-.189,1.009-.424,2.914.127,4.335.279.719,1.282,1.319,1.925,1.542Zm.491,4.907c.676-.389,1.484-.718,2.402-.849-.362-.786-.656-1.665-.859-2.638,0,0,0,0,0,0-1.407-.606-2.955-.45-4.006-.21-.17.039-.308.144-.378.288-.042.085-.076.22-.002.373.465.979,1.332,2.284,2.845,3.036Zm2.71,3.59c.331-.588.775-1.24,1.366-1.878-.425-.467-.822-1.003-1.177-1.608-1.513.105-2.731.887-3.499,1.539-.12.102-.184.248-.176.4.004.086.036.247.202.361.759.524,1.935,1.146,3.285,1.185Zm5.029.385c-.978-.22-2.006-.741-2.949-1.563-.887.965-1.404,1.962-1.689,2.661-.054.132-.011.241.02.295.052.092.141.154.244.17,2.203.336,3.672-.192,4.374-1.563Zm7.512-10.718s0,.002,0,0c.004.731-.037,1.426-.117,2.083.593-.168,1.188-.239,1.754-.248-.005.002-.006.004.008,0,.743-.224,1.72-.817,2.001-1.541.551-1.421.316-3.326.127-4.336-.026-.137-.12-.197-.173-.221-.044-.02-.16-.057-.29.021-1.096.675-2.567,1.975-3.309,4.241Zm-.18-2.59c.828-.715,2.749-2.591,1.994-4.025-.716-1.359-2.248-2.46-3.097-2.995-.063-.04-.124-.054-.178-.054-.051,0-.097.013-.132.028-.125.054-.217.175-.247.325-.231,1.16-.509,4.064,1.661,6.721Zm-1.693,14.406c-.285-.698-.8-1.691-1.681-2.652-.945.824-1.975,1.344-2.954,1.56.703,1.366,2.172,1.887,4.372,1.557.141-.021.213-.115.243-.169.031-.054.074-.164.021-.296Zm3.878-3.028c.008-.152-.057-.299-.176-.4-.247-.21-1.469-1.321-3.489-1.539-.356.608-.754,1.147-1.18,1.616.586.635,1.028,1.284,1.358,1.87,1.35-.039,2.527-.661,3.286-1.185.166-.114.197-.275.202-.361Zm1.938-5.453c-.07-.145-.208-.249-.377-.288-1.016-.229-2.495-.385-3.864.151-.203.998-.5,1.897-.868,2.7.887.127,1.673.441,2.333.813,1.471-.756,2.32-2.036,2.778-3.002.073-.153.039-.288-.002-.373Zm-3.943-3.334h0s.001-.004,0,0Z"/>
    </svg>
  );
}

/**
 * Format TRUST value for display (using truncation like INTUITION)
 */
function formatTrust(value: number): string {
  if (value >= 1000) {
    return `${truncateAmount(value / 1000, 1)}k`;
  }
  if (value >= 1) {
    return truncateAmount(value, 2);
  }
  if (value >= 0.001) {
    return truncateAmount(value, 5);
  }
  return '0';
}

/**
 * CurveStatsCard - displays stats for a single curve with visual FOR/AGAINST bar
 */
function CurveStatsCard({
  curve,
  stats,
  totemLabel,
  isWinner,
}: {
  curve: 'linear' | 'progressive';
  stats: CurveStats;
  totemLabel: string;
  isWinner: boolean;
}) {
  // Subtle curve colors from centralized config
  const curveColors = curve === 'linear' ? CURVE_COLORS.linear : CURVE_COLORS.progressive;
  const curveLabel = curve === 'linear' ? 'Linear' : 'Progressive';

  // Calculate FOR percentage for the bar
  const totalTrust = stats.trustFor + stats.trustAgainst;
  const forPercentage = totalTrust > 0 ? (stats.trustFor / totalTrust) * 100 : 50;
  const totalVoters = stats.walletsFor + stats.walletsAgainst;

  // No activity on this curve
  if (totalTrust === 0 && totalVoters === 0) {
    return (
      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: curveColors.base }} />
            <span className="text-[10px] font-medium" style={{ color: curveColors.text }}>{curveLabel}</span>
          </div>
          <span className="text-xs text-white font-medium truncate max-w-[100px]">
            {totemLabel}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-white/40 italic">
          Pas de votes sur cette courbe
        </div>
      </div>
    );
  }

  // Determine direction (Support or Oppose) based on netScore
  const isSupport = stats.netScore >= 0;
  const directionLabel = isSupport ? 'Support' : 'Oppose';
  const directionColors = isSupport ? SUPPORT_COLORS : OPPOSE_COLORS;

  return (
    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
      {/* Header: Trophy icon + Totem name */}
      <div className="flex items-center gap-1.5 mb-1">
        {isWinner && <TrophyIcon className="w-4 h-4 text-yellow-400" />}
        <span className="text-sm text-white font-medium truncate flex-1">
          {totemLabel}
        </span>
      </div>
      {/* Direction + Curve label */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs font-medium" style={{ color: directionColors.base }}>
          {directionLabel}
        </span>
        <span className="text-xs font-medium" style={{ color: curveColors.text }}>
          {curveLabel}
        </span>
      </div>

      {/* Visual bar FOR/AGAINST - Intuition colors */}
      <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden flex">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${forPercentage}%`, backgroundColor: SUPPORT_COLORS.base }}
        />
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${100 - forPercentage}%`, backgroundColor: OPPOSE_COLORS.base }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 text-xs">
        <span style={{ color: SUPPORT_COLORS.base }}>{Math.round(forPercentage)}% FOR</span>
      </div>

      {/* FOR / AGAINST values */}
      <div className="flex items-center justify-between mt-1.5 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUPPORT_COLORS.base }} />
          <span style={{ color: SUPPORT_COLORS.base }}>{formatTrust(stats.trustFor)}</span>
        </span>
        <span className="text-white/30">·</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OPPOSE_COLORS.base }} />
          <span style={{ color: OPPOSE_COLORS.base }}>{formatTrust(stats.trustAgainst)}</span>
        </span>
      </div>

      {/* Balance + Voters */}
      <div className="flex items-center justify-between mt-1 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-white/40">Balance:</span>
          <span className={stats.netScore >= 0 ? 'text-green-400' : 'text-red-400'}>
            {stats.netScore >= 0 ? '+' : ''}{formatTrust(stats.netScore)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white/30">·</span>
          <span className="text-white/50">{totalVoters} votants</span>
        </div>
      </div>
    </div>
  );
}

/**
 * TotemStatsPanel - displays stats for selected totem or winners
 *
 * - If a totem is selected: shows its Linear + Progressive stats
 * - If no totem selected: shows the winners (Linear winner + Progressive winner)
 */
function TotemStatsPanel({
  selectedTotemId,
  totems,
  linearWinner,
  progressiveWinner,
}: {
  selectedTotemId?: string;
  totems: TotemWithCurves[];
  linearWinner: CurveWinner | null;
  progressiveWinner: CurveWinner | null;
}) {
  // If a totem is selected, find it and display its stats
  if (selectedTotemId) {
    const selectedTotem = totems.find((t) => t.id === selectedTotemId);
    if (selectedTotem) {
      // Check if this totem is a winner
      const isLinearWinner = linearWinner?.totemId === selectedTotemId;
      const isProgressiveWinner = progressiveWinner?.totemId === selectedTotemId;

      return (
        <div className="mt-3 space-y-1.5">
          <CurveStatsCard
            curve="linear"
            stats={selectedTotem.linear}
            totemLabel={selectedTotem.label}
            isWinner={isLinearWinner}
          />
          <CurveStatsCard
            curve="progressive"
            stats={selectedTotem.progressive}
            totemLabel={selectedTotem.label}
            isWinner={isProgressiveWinner}
          />
        </div>
      );
    }
  }

  // No totem selected - show winners (sorted by netScore)
  const winners: Array<{ winner: CurveWinner; curve: 'linear' | 'progressive'; stats: CurveStats }> = [];

  if (linearWinner) {
    const totem = totems.find((t) => t.id === linearWinner.totemId);
    if (totem) {
      winners.push({ winner: linearWinner, curve: 'linear', stats: totem.linear });
    }
  }
  if (progressiveWinner) {
    const totem = totems.find((t) => t.id === progressiveWinner.totemId);
    if (totem) {
      winners.push({ winner: progressiveWinner, curve: 'progressive', stats: totem.progressive });
    }
  }

  // Sort by absolute netScore descending
  winners.sort((a, b) => Math.abs(b.winner.netScore) - Math.abs(a.winner.netScore));

  if (winners.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      {winners.map(({ winner, curve, stats }) => (
        <CurveStatsCard
          key={curve}
          curve={curve}
          stats={stats}
          totemLabel={winner.totemLabel}
          isWinner={true}
        />
      ))}
    </div>
  );
}

type GraphTab = 'topTotems' | 'voteGraph';

interface FounderInfoPanelProps {
  founder: FounderForHomePage;
  onClose: () => void;
  hasNewData?: boolean;
  /** Callback when a totem is clicked in the graph */
  onSelectTotem?: (totemId: string, totemLabel: string) => void;
  /** Currently selected totem ID (to show its stats instead of winners) */
  selectedTotemId?: string;
}

export function FounderInfoPanel({
  founder,
  onClose,
  hasNewData = false,
  onSelectTotem,
  selectedTotemId,
}: FounderInfoPanelProps) {
  const { t } = useTranslation();
  const imageUrl = getFounderImageUrl(founder);

  // Graph tab state
  const [graphTab, setGraphTab] = useState<GraphTab>('topTotems');

  // Fetch top 5 totems for radar chart
  const { topTotems, loading: totemsLoading } = useTopTotems(founder.name, 5);

  // Fetch ALL totems for relations graph (no limit)
  const { topTotems: allTotems, loading: allTotemsLoading } = useTopTotems(founder.name, 100);

  // Fetch panel stats (Market Cap, Holders, Claims)
  const { stats, loading: statsLoading } = useFounderPanelStats(founder.name);

  // Fetch founder tags from blockchain
  const { tags, loading: tagsLoading } = useFounderTags(founder.name);

  // Fetch curve winners (Linear/Progressive) and all totems with curve breakdown
  const { totems: totemsByCurve, linearWinner, progressiveWinner, loading: curveLoading } = useTopTotemsByCurve(founder.name);

  // Extract social links from founder data
  const socialLinks = {
    twitter: founder.twitter,
    github: founder.github,
    linkedin: founder.linkedin,
  };

  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  return (
    <div className="glass-card p-4 h-full flex flex-col relative overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ overscrollBehavior: 'contain' }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors z-10"
        aria-label={t('common.close')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header: Avatar + Name + Bio */}
      <div className="flex gap-3 mb-4 items-start">
        {/* Avatar on left - aligned to top */}
        <div className="shrink-0">
          <img
            src={imageUrl}
            alt={founder.name}
            className="w-28 h-28 rounded-full object-cover border border-slate-500/50 shadow-lg shadow-slate-500/20"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
            }}
          />
        </div>
        {/* Name + Bio on right */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white mb-1 truncate">
            {founder.name}
          </h2>
          {/* Full Bio - complete text */}
          {(founder.fullBio || founder.shortBio) && (
            <p className="text-sm text-white/70 leading-relaxed">
              {founder.fullBio || founder.shortBio}
            </p>
          )}
        </div>
      </div>

      {/* Tags from blockchain */}
      {!tagsLoading && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 5).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30"
            >
              {tag.label}
            </span>
          ))}
          {tags.length > 5 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/50">
              +{tags.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Social Links */}
      {hasSocialLinks && (
        <div className="flex gap-2 mb-4">
          {socialLinks.twitter && (
            <a
              href={`https://twitter.com/${socialLinks.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-blue-500/20 text-white/60 hover:text-blue-400 transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
          {socialLinks.github && (
            <a
              href={`https://github.com/${socialLinks.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-gray-500/20 text-white/60 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          )}
          {socialLinks.linkedin && (
            <a
              href={socialLinks.linkedin.startsWith('http') ? socialLinks.linkedin : `https://linkedin.com/in/${socialLinks.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-blue-600/20 text-white/60 hover:text-blue-500 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/10 my-3" />

      {/* Stats: Market Cap, Holders, Claims */}
      <div
        className={`space-y-2 rounded-lg p-2 -mx-2 transition-all duration-300 ${
          hasNewData ? 'bg-slate-500/20 ring-1 ring-slate-500/50' : ''
        }`}
      >
        <div className="flex justify-between text-xs">
          <span className="text-white/50">Total Market Cap</span>
          <span className={`text-white font-medium transition-all duration-300 ${
            hasNewData ? 'scale-110' : ''
          }`}>
            {statsLoading ? '...' : `${stats.formattedMarketCap} TRUST`}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-white/50">Total Holders</span>
          <span className="text-white font-medium">
            {statsLoading ? '...' : `${stats.totalHolders} voters`}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-white/50">Claims</span>
          <span className="text-white font-medium">
            {statsLoading ? '...' : stats.claims}
          </span>
        </div>
      </div>

      {/* Totem Stats - selected totem or winners with FOR/AGAINST bar */}
      {!curveLoading && (linearWinner || progressiveWinner || selectedTotemId) && (
        <TotemStatsPanel
          selectedTotemId={selectedTotemId}
          totems={totemsByCurve}
          linearWinner={linearWinner}
          progressiveWinner={progressiveWinner}
        />
      )}

      {/* Graph Tabs */}
      <div className="mt-4 shrink-0">
        {/* Tab buttons - GooeySwitch */}
        <GooeySwitch
          options={[
            { id: 'topTotems', label: 'Top Totems' },
            { id: 'voteGraph', label: 'Vote Graph' },
          ]}
          value={graphTab}
          onChange={(id) => setGraphTab(id as GraphTab)}
          columns={2}
          className="mb-2"
          renderOption={(option, isSelected) => (
            <div className="flex items-center justify-center px-0 py-0">
              <span className={`text-sm font-medium leading-none ${isSelected ? 'text-white' : 'text-white/60'}`}>
                {option.label}
              </span>
            </div>
          )}
        />

        {/* Graph content */}
        {graphTab === 'topTotems' ? (
          <TopTotemsRadar
            totems={topTotems}
            loading={totemsLoading}
            height={340}
            onTotemClick={onSelectTotem}
          />
        ) : (
          <RelationsRadar
            founderName={founder.name}
            founderImage={imageUrl}
            totems={allTotems}
            loading={allTotemsLoading}
            height={360}
            onTotemClick={onSelectTotem}
          />
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      {/* Vote Market Stats (compact) */}
      <div className="mt-4">
        <VoteMarketCompact founderName={founder.name} />
      </div>

      {/* Atom ID (footer) */}
      {founder.atomId && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Atom ID</span>
            <span className="text-white/50 font-mono">
              {founder.atomId.slice(0, 8)}...{founder.atomId.slice(-4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
