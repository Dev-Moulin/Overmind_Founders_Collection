/**
 * MyVotesItem - Displays a single user vote in the "My Votes" format
 *
 * Format: [Img Subject] Subject - [Img Predicate] Predicate - [Img Object] Object  +X.XXX
 *
 * Features:
 * - Inline atom images with fallback to emoji or initial
 * - Click to select the totem in the right panel
 * - Color-coded amount (green for FOR, orange for AGAINST)
 *
 * @see Phase 10 - Etape 5 in TODO_FIX_01_Discussion.md
 */

import type { UserVoteWithDetails } from '../../hooks';

interface MyVotesItemProps {
  vote: UserVoteWithDetails;
  onClick?: (objectId: string, objectLabel: string) => void;
  isSelected?: boolean;
}

/**
 * AtomImage - Renders an atom's image with fallback
 */
function AtomImage({
  image,
  emoji,
  label,
  size = 'sm',
}: {
  image?: string;
  emoji?: string;
  label: string;
  size?: 'xs' | 'sm';
}) {
  const sizeClass = size === 'xs' ? 'w-5 h-5' : 'w-6 h-6';
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';

  if (image) {
    return (
      <img
        src={image}
        alt={label}
        className={`${sizeClass} rounded object-cover shrink-0`}
        onError={(e) => {
          // Hide image on error, show fallback
          (e.target as HTMLImageElement).style.display = 'none';
          const fallback = (e.target as HTMLImageElement).nextElementSibling;
          if (fallback) fallback.classList.remove('hidden');
        }}
      />
    );
  }

  // Emoji or initial fallback
  return (
    <div
      className={`${sizeClass} rounded bg-white/10 flex items-center justify-center shrink-0`}
    >
      <span className={textSize}>
        {emoji || label.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

/**
 * MyVotesItem component
 */
export function MyVotesItem({ vote, onClick, isSelected }: MyVotesItemProps) {
  const { term, isPositive, signedAmount } = vote;
  const amountColor = isPositive ? 'text-blue-400' : 'text-orange-400';

  return (
    <button
      onClick={() => onClick?.(term.object.term_id, term.object.label)}
      className={`w-full text-left p-2.5 rounded-lg transition-all ${
        isSelected
          ? 'bg-slate-500/30 ring-1 ring-slate-500/50'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Triple: Subject - Predicate - Object */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Subject */}
          <div className="flex items-center gap-1 shrink-0">
            <AtomImage
              image={term.subject.image}
              emoji={term.subject.emoji}
              label={term.subject.label}
              size="xs"
            />
            <span className="text-xs text-white/70 truncate max-w-[60px]">
              {term.subject.label.split(' ')[0]}
            </span>
          </div>

          <span className="text-white/30 text-xs shrink-0">-</span>

          {/* Predicate */}
          <div className="flex items-center gap-1 shrink-0">
            <AtomImage
              image={term.predicate.image}
              emoji={term.predicate.emoji}
              label={term.predicate.label}
              size="xs"
            />
            <span className="text-xs text-white/50 truncate max-w-[70px]">
              {term.predicate.label}
            </span>
          </div>

          <span className="text-white/30 text-xs shrink-0">-</span>

          {/* Object (Totem) */}
          <div className="flex items-center gap-1 min-w-0">
            <AtomImage
              image={term.object.image}
              emoji={term.object.emoji}
              label={term.object.label}
              size="sm"
            />
            <span className="text-sm text-white font-medium truncate">
              {term.object.label}
            </span>
          </div>
        </div>

        {/* Amount */}
        <span className={`text-sm font-medium ${amountColor} shrink-0`}>
          {signedAmount}
        </span>
      </div>
    </button>
  );
}

/**
 * MyVotesSkeleton - Loading skeleton for My Votes list
 */
export function MyVotesSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/10 rounded" />
            <div className="h-3 bg-white/10 rounded w-12" />
            <div className="h-3 bg-white/10 rounded w-2" />
            <div className="w-5 h-5 bg-white/10 rounded" />
            <div className="h-3 bg-white/10 rounded w-16" />
            <div className="h-3 bg-white/10 rounded w-2" />
            <div className="w-6 h-6 bg-white/10 rounded" />
            <div className="h-4 bg-white/10 rounded flex-1" />
            <div className="h-4 bg-white/10 rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
