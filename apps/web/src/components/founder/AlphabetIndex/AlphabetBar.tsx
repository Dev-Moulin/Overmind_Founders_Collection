import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LetterGroup } from '../../../hooks/ui/useFounderAlphabetIndex';
import type { FounderForHomePage } from '../../../types/founder';
import { FounderDockItem } from './FounderDockItem';

/* Dock magnification factors — must match alphabetIndex.css */
const LETTER_BASE_W = 26;  // px  (.dock-letter base width)
const PHOTO_BASE_W = 30;   // px  (.dock-photo-item base width)
const GAP = 2;              // px  (.alphabet-bar-horizontal gap)
const MAGNIFY: Record<number, number> = { 0: 2.5, 1: 1.7, 2: 1.3 };

/**
 * Compute translateX offset so the hovered letter stays in place.
 * Models the full DOM layout (letters + inline photos) since CSS :has()
 * applies magnification by DOM distance, not alphabet distance.
 */
function computeAnchorOffset(
  hoveredIdx: number,
  totalLetters: number,
  activeLetterIdx: number | null,
  photoCount: number,
  hasDice: boolean,
): number {
  // Build virtual list of item base widths matching the DOM order
  const items: number[] = [];
  let hoveredDomIdx = -1;

  for (let i = 0; i < totalLetters; i++) {
    if (i === hoveredIdx) hoveredDomIdx = items.length;
    items.push(LETTER_BASE_W);
    // Photos are inserted right after the active letter
    if (activeLetterIdx !== null && i === activeLetterIdx && photoCount > 0) {
      for (let p = 0; p < photoCount; p++) {
        items.push(PHOTO_BASE_W);
      }
    }
  }
  // Dice button after Z
  if (hasDice) items.push(LETTER_BASE_W);

  let totalExpansion = 0;
  let expansionBefore = 0;

  for (let i = 0; i < items.length; i++) {
    const dist = Math.abs(i - hoveredDomIdx);
    const factor = MAGNIFY[dist] ?? 1;
    const expansion = (factor - 1) * (items[i] + GAP);
    totalExpansion += expansion;
    if (i < hoveredDomIdx) expansionBefore += expansion;
    if (i === hoveredDomIdx) expansionBefore += expansion / 2;
  }

  return -(expansionBefore - totalExpansion / 2);
}

interface AlphabetBarProps {
  letterGroups: LetterGroup[];
  activeLetter: string | null;
  orientation: 'horizontal' | 'vertical';
  /** Founders for the active letter (rendered inline on horizontal) */
  activeLetterFounders?: FounderForHomePage[];
  onHoverStart: (letter: string) => void;
  onHoverEnd: () => void;
  onClick: (letter: string) => void;
  onSelectFounder?: (founderId: string) => void;
  /** Direct setter for touch scrubber (bypasses hover timing) */
  onTouchLetter?: (letter: string) => void;
  onTouchEnd?: () => void;
  /** Random dice button callback */
  onRandomClick?: () => void;
}

/* Dot positions (top%, left%) for each face value */
const FACE_DOTS: Record<number, [string, string][]> = {
  1: [['50%', '50%']],
  2: [['25%', '25%'], ['75%', '75%']],
  3: [['25%', '25%'], ['50%', '50%'], ['75%', '75%']],
  4: [['25%', '25%'], ['25%', '75%'], ['75%', '25%'], ['75%', '75%']],
  5: [['25%', '25%'], ['25%', '75%'], ['50%', '50%'], ['75%', '25%'], ['75%', '75%']],
  6: [['25%', '25%'], ['25%', '75%'], ['50%', '25%'], ['50%', '75%'], ['75%', '25%'], ['75%', '75%']],
};

function DiceDockItem({ onClick }: { onClick: () => void }) {
  const [rolling, setRolling] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const rollingRef = useRef(false);

  useEffect(() => { rollingRef.current = rolling; }, [rolling]);

  // Jump d'attention toutes les 4.5s
  useEffect(() => {
    const interval = setInterval(() => {
      if (!rollingRef.current) {
        setJumping(true);
        setTimeout(() => setJumping(false), 750);
      }
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (rolling) return;
    setJumping(false);
    setRolling(true);
    setTimeout(() => {
      setRolling(false);
      onClick();
    }, 800);
  };

  return (
    <div
      className={`dock-item dock-dice${jumping ? ' jumping' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => { setShowTooltip(true); setJumping(false); }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="dice-scene">
        <div className="dice-cube">
          <div className={`dice-inner ${rolling ? 'rolling' : ''}`}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className={`dice-face face-${n}`}>
                {FACE_DOTS[n].map(([top, left], i) => (
                  <span key={i} className="dot" style={{ top, left }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {showTooltip && <div className="dice-tooltip">Random</div>}
    </div>
  );
}

/**
 * Niveau 1 — Barre alphabetique A-Z avec effet dock magnification CSS.
 * Horizontal (desktop/tablette) : lettres + photos inline a cote de la lettre active.
 * Vertical (mobile) : lettres uniquement (photos dans panel separe).
 *
 * Real width/height sizing (not transform:scale) — les items se poussent dans le layout.
 */
export const AlphabetBar = memo(function AlphabetBar({
  letterGroups,
  activeLetter,
  orientation,
  activeLetterFounders = [],
  onHoverStart,
  onHoverEnd,
  onClick,
  onSelectFounder,
  onTouchLetter,
  onTouchEnd,
  onRandomClick,
}: AlphabetBarProps) {
  const isTouchingRef = useRef(false);
  const lastTouchLetterRef = useRef<string | null>(null);
  const [hoveredLetterIdx, setHoveredLetterIdx] = useState<number | null>(null);

  // --- Mini-card sticky avec switch progressif ---
  const [expandedFounderId, setExpandedFounderId] = useState<string | null>(null);
  const [closingFounderId, setClosingFounderId] = useState<string | null>(null);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandedIdRef = useRef<string | null>(null);
  const switchingRef = useRef(false);

  useEffect(() => { expandedIdRef.current = expandedFounderId; }, [expandedFounderId]);

  // Reset quand la lettre active change (photos démontées/remontées)
  useEffect(() => {
    setExpandedFounderId(null);
    setClosingFounderId(null);
    switchingRef.current = false;
    if (expandTimeoutRef.current) { clearTimeout(expandTimeoutRef.current); expandTimeoutRef.current = null; }
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
  }, [activeLetter]);

  const handlePhotoMouseEnter = useCallback((founderId: string) => {
    if (expandTimeoutRef.current) { clearTimeout(expandTimeoutRef.current); expandTimeoutRef.current = null; }
    if (expandedIdRef.current !== null || switchingRef.current) {
      // Switch : hover → 100ms → nouvelle s'ouvre → 150ms → ancienne se ferme
      const oldId = expandedIdRef.current;
      switchingRef.current = true;
      expandTimeoutRef.current = setTimeout(() => {
        setExpandedFounderId(founderId);
        expandTimeoutRef.current = null;
        switchingRef.current = false;
        // L'ancienne passe en closing (garde expanded visuellement pendant 150ms)
        if (oldId) {
          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
          setClosingFounderId(oldId);
          closeTimeoutRef.current = setTimeout(() => {
            setClosingFounderId(null);
            closeTimeoutRef.current = null;
          }, 650);
        }
      }, 200);
    } else {
      // Première ouverture → délai 400ms
      expandTimeoutRef.current = setTimeout(() => {
        setExpandedFounderId(founderId);
        expandTimeoutRef.current = null;
      }, 400);
    }
  }, []);

  const handlePhotoMouseLeave = useCallback(() => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    if (switchingRef.current) switchingRef.current = false;
    // Si déjà expanded → sticky, on ne ferme PAS
  }, []);

  const className = orientation === 'horizontal'
    ? 'alphabet-bar-horizontal'
    : 'alphabet-bar-vertical';

  // Find active letter index for offset computation
  const activeLetterIdx = useMemo(() => {
    if (!activeLetter || orientation !== 'horizontal') return null;
    return letterGroups.findIndex((g) => g.letter === activeLetter);
  }, [activeLetter, letterGroups, orientation]);

  // Reactive anchor offset — recalculates when photos appear/disappear
  const anchorOffset = useMemo(() => {
    if (hoveredLetterIdx === null || orientation !== 'horizontal') return 0;
    return computeAnchorOffset(
      hoveredLetterIdx,
      letterGroups.length,
      activeLetterIdx,
      activeLetterFounders.length,
      !!onRandomClick,
    );
  }, [hoveredLetterIdx, letterGroups.length, activeLetterIdx, activeLetterFounders.length, orientation, onRandomClick]);

  const handleLetterMouseEnter = useCallback((letter: string, index: number, hasFounders: boolean) => {
    if (hasFounders) onHoverStart(letter);
    if (orientation === 'horizontal') {
      setHoveredLetterIdx(index);
    }
  }, [onHoverStart, orientation]);

  const handleLetterMouseLeave = useCallback(() => {
    onHoverEnd();
    if (orientation === 'horizontal') {
      setHoveredLetterIdx(null);
    }
  }, [onHoverEnd, orientation]);

  // Touch scrubber: detect which letter is under the finger
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!onTouchLetter) return;
    e.preventDefault();
    isTouchingRef.current = true;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.hasAttribute('data-letter')) {
      const letter = element.getAttribute('data-letter')!;
      if (letter !== lastTouchLetterRef.current) {
        lastTouchLetterRef.current = letter;
        onTouchLetter(letter);
      }
    }
  }, [onTouchLetter]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onTouchLetter) return;
    isTouchingRef.current = true;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.hasAttribute('data-letter')) {
      const letter = element.getAttribute('data-letter')!;
      lastTouchLetterRef.current = letter;
      onTouchLetter(letter);
    }
  }, [onTouchLetter]);

  const handleTouchEndLocal = useCallback(() => {
    isTouchingRef.current = false;
    lastTouchLetterRef.current = null;
    onTouchEnd?.();
  }, [onTouchEnd]);

  const barStyle = orientation === 'horizontal' && anchorOffset !== 0
    ? { transform: `translateX(${anchorOffset}px)`, transition: 'transform 150ms ease' }
    : orientation === 'horizontal'
      ? { transition: 'transform 150ms ease' }
      : undefined;

  return (
    <div
      className={className}
      style={barStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEndLocal}
    >
      {letterGroups.map(({ letter, hasFounders }, index) => (
        <Fragment key={letter}>
          <div
            data-letter={hasFounders ? letter : undefined}
            className={`dock-item dock-letter ${!hasFounders ? 'disabled' : ''} ${activeLetter === letter ? 'active' : ''}`}
            style={!hasFounders ? { '--s': 1 } as React.CSSProperties : activeLetter === letter ? { '--s': 2.2 } as React.CSSProperties : undefined}
            onMouseEnter={() => handleLetterMouseEnter(letter, index, hasFounders)}
            onMouseLeave={handleLetterMouseLeave}
            onClick={() => hasFounders && onClick(letter)}
          >
            {letter}
          </div>
          {/* Desktop horizontal: photos inline right after the active letter */}
          {orientation === 'horizontal' && activeLetter === letter && activeLetterFounders.map((founder) => (
            <FounderDockItem
              key={founder.id}
              founder={founder}
              expanded={expandedFounderId === founder.id || closingFounderId === founder.id}
              onSelect={onSelectFounder!}
              onMouseEnter={() => handlePhotoMouseEnter(founder.id)}
              onMouseLeave={handlePhotoMouseLeave}
            />
          ))}
        </Fragment>
      ))}
      {onRandomClick && <DiceDockItem onClick={onRandomClick} />}
    </div>
  );
});
