import { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FounderForHomePage } from '../../../types/founder';
import { useFounderAlphabetIndex } from '../../../hooks/ui/useFounderAlphabetIndex';
import { useRandomFounder } from '../../../hooks/ui/useRandomFounder';
import { AlphabetBar } from './AlphabetBar';
import { FounderPhotoDock } from './FounderPhotoDock';
import './alphabetIndex.css';

interface AlphabetIndexProps {
  founders: FounderForHomePage[];
  onSelectFounder: (founderId: string) => void;
}

/**
 * AlphabetIndex — Composant principal responsive.
 * Desktop/Tablette: Barre horizontale A-Z avec photos inline (pas de popover).
 * Mobile: Barre verticale A-Z + panel photo separe.
 *
 * Triple niveau d'interaction:
 * 1. Lettres A-Z (effet dock magnification, tailles reelles)
 * 2. Photos fondateurs inline (effet dock magnification)
 * 3. Mini-card (photo morphe en card au hover prolonge)
 */
export function AlphabetIndex({ founders, onSelectFounder }: AlphabetIndexProps) {
  const {
    letterGroups,
    activeLetter,
    activeLetterFounders,
    handleLetterHoverStart,
    handleLetterHoverEnd,
    handleLetterClick,
    handleTouchLetter,
    close,
  } = useFounderAlphabetIndex(founders);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portal target: slot dans le Header
  const [navbarSlot, setNavbarSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setNavbarSlot(document.getElementById('navbar-alphabet-slot'));
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeLetter) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLetter, close]);

  // Close on click outside
  useEffect(() => {
    if (!activeLetter) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    // Delay to avoid closing immediately on the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeLetter, close]);

  // Desktop: close photos when mouse leaves the bar (with grace period)
  const handleBarMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleBarMouseLeave = useCallback(() => {
    if (!activeLetter) return;
    closeTimeoutRef.current = setTimeout(() => {
      close();
    }, 600);
  }, [activeLetter, close]);

  // When a founder is selected from the photo dock, close and navigate
  const handleFounderSelect = useCallback(
    (founderId: string) => {
      close();
      onSelectFounder(founderId);
    },
    [close, onSelectFounder]
  );

  // Random dice: pick a founder prioritized by user votes
  const { pickRandom } = useRandomFounder(founders);
  const handleRandomClick = useCallback(() => {
    const founderId = pickRandom();
    if (founderId) {
      close();
      onSelectFounder(founderId);
    }
  }, [pickRandom, close, onSelectFounder]);

  const desktopBar = (
    <div
      ref={containerRef}
      className="w-full overflow-visible"
      onMouseEnter={handleBarMouseEnter}
      onMouseLeave={handleBarMouseLeave}
    >
      <AlphabetBar
        letterGroups={letterGroups}
        activeLetter={activeLetter}
        activeLetterFounders={activeLetterFounders}
        orientation="horizontal"
        onHoverStart={handleLetterHoverStart}
        onHoverEnd={handleLetterHoverEnd}
        onClick={handleLetterClick}
        onSelectFounder={handleFounderSelect}
        onRandomClick={handleRandomClick}
      />
    </div>
  );

  return (
    <>
      {/* Desktop / Tablette: rendu dans le slot navbar via portal */}
      {navbarSlot && createPortal(desktopBar, navbarSlot)}

      {/* Mobile: vertical bar + separate photo panel */}
      <div className="sm:hidden">
        <AlphabetBar
          letterGroups={letterGroups}
          activeLetter={activeLetter}
          orientation="vertical"
          onHoverStart={handleLetterHoverStart}
          onHoverEnd={handleLetterHoverEnd}
          onClick={handleLetterClick}
          onTouchLetter={handleTouchLetter}
          onTouchEnd={close}
          onRandomClick={handleRandomClick}
        />
        {activeLetter && activeLetterFounders.length > 0 && (
          <div className="fixed right-10 top-1/2 -translate-y-1/2 z-50">
            <div className="alphabet-popover-content">
              <FounderPhotoDock
                founders={activeLetterFounders}
                onSelectFounder={handleFounderSelect}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
