/**
 * TripleHeader - Display tags for Founder, Predicate, and Totem
 *
 * Shows the current vote "triple" as visual tags/pills:
 * - Founder tag (always visible)
 * - Predicate tag (blurred if not selected, animated when selected)
 * - Totem tag (blurred if not selected, animated when selected)
 */

import type { FounderForHomePage } from '../../../hooks';
import type { Predicate } from '../../../types/predicate';
import type { NewTotemData } from '../TotemCreationForm';
import { getFounderImageUrl } from '../../../utils/founderImage';

/** Totem display info */
interface TotemInfo {
  image?: string;
  emoji?: string;
}

interface TripleHeaderProps {
  /** Founder data */
  founder: FounderForHomePage;
  /** Selected predicate */
  selectedPredicate: Predicate | undefined;
  /** Whether a predicate is selected */
  selectedPredicateId: string;
  /** Selected totem ID */
  selectedTotemId: string | undefined;
  /** Selected totem label */
  selectedTotemLabel: string | undefined;
  /** New totem data (if creating) */
  newTotemData: NewTotemData | null | undefined;
  /** Totem display info (image/emoji) */
  selectedTotemInfo: TotemInfo | null;
}

export function TripleHeader({
  founder,
  selectedPredicate,
  selectedPredicateId,
  selectedTotemId,
  selectedTotemLabel,
  newTotemData,
  selectedTotemInfo,
}: TripleHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-[15px]">
      {/* Founder Tag */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-full">
        <img
          src={getFounderImageUrl(founder)}
          alt={founder.name}
          className="w-5 h-5 rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="text-xs font-medium text-white">{founder.name}</span>
      </div>

      {/* Predicate Tag */}
      <div
        key={selectedPredicateId || 'no-predicate'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${
          selectedPredicateId
            ? 'bg-slate-500/30 animate-blur-to-focus animate-ring-pulse'
            : 'bg-white/5 ring-1 ring-slate-500/30 blur-xs'
        }`}
      >
        <span className={`text-xs font-medium ${selectedPredicateId ? 'text-slate-200' : 'text-white/40'}`}>
          {selectedPredicate?.label || '???'}
        </span>
      </div>

      {/* Totem Tag */}
      <div
        key={selectedTotemId || 'no-totem'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${
          selectedTotemLabel || newTotemData
            ? 'bg-slate-500/30 animate-blur-to-focus animate-ring-pulse'
            : 'bg-white/5 ring-1 ring-slate-500/30 blur-xs'
        }`}
      >
        {/* Totem image/emoji/initial */}
        {(selectedTotemLabel || newTotemData) && (
          selectedTotemInfo?.image ? (
            <img
              src={selectedTotemInfo.image}
              alt={selectedTotemLabel || newTotemData?.name || ''}
              className="w-5 h-5 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              {selectedTotemInfo?.emoji || (selectedTotemLabel || newTotemData?.name || '?').charAt(0).toUpperCase()}
            </div>
          )
        )}
        <span className={`text-xs font-medium ${selectedTotemLabel || newTotemData ? 'text-white' : 'text-white/40'}`}>
          {newTotemData ? (
            <>
              {newTotemData.name}
              <span className="text-orange-400/70 ml-1">✨</span>
            </>
          ) : selectedTotemLabel || '???'}
        </span>
      </div>
    </div>
  );
}
