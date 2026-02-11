import { useMemo, useState, useCallback, useRef } from 'react';
import type { FounderForHomePage } from '../../types/founder';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Extract last name from full name for alphabetical sorting/grouping.
 * "Joseph Lubin" → "Lubin"
 * "end0xiii" → "end0xiii" (no space = use as-is)
 */
function getLastName(name: string): string {
  const parts = name.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

export interface LetterGroup {
  letter: string;
  founders: FounderForHomePage[];
  hasFounders: boolean;
}

export function useFounderAlphabetIndex(founders: FounderForHomePage[]) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Group founders by first letter of last name
  const letterGroups = useMemo<LetterGroup[]>(() => {
    const groupMap = new Map<string, FounderForHomePage[]>();

    founders.forEach((founder) => {
      const lastName = getLastName(founder.name);
      const letter = lastName[0].toUpperCase();
      if (!groupMap.has(letter)) {
        groupMap.set(letter, []);
      }
      groupMap.get(letter)!.push(founder);
    });

    // Sort founders within each group by last name
    groupMap.forEach((group) => {
      group.sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));
    });

    return ALPHABET.map((letter) => ({
      letter,
      founders: groupMap.get(letter) || [],
      hasFounders: groupMap.has(letter),
    }));
  }, [founders]);

  // Letters that have founders
  const activeLetters = useMemo(
    () => letterGroups.filter((g) => g.hasFounders).map((g) => g.letter),
    [letterGroups]
  );

  // Founders for the currently active letter
  const activeLetterFounders = useMemo(() => {
    if (!activeLetter) return [];
    const group = letterGroups.find((g) => g.letter === activeLetter);
    return group?.founders || [];
  }, [activeLetter, letterGroups]);

  // Hover: magnification only (no photo activation — that's click-only now)
  const handleLetterHoverStart = useCallback((_letter: string) => {
    // No-op: hover drives CSS magnification via AlphabetBar,
    // but photos are only opened by click (handleLetterClick).
  }, []);

  const handleLetterHoverEnd = useCallback(() => {
    // No-op: kept for API symmetry with AlphabetBar props.
  }, []);

  // Direct click: immediate activation
  const handleLetterClick = useCallback((letter: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const group = letterGroups.find((g) => g.letter === letter);
    if (group?.hasFounders) {
      setActiveLetter((prev) => (prev === letter ? null : letter));
    }
  }, [letterGroups]);

  // Direct touch setter (no delay — for mobile scrubber)
  const handleTouchLetter = useCallback((letter: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const group = letterGroups.find((g) => g.letter === letter);
    if (group?.hasFounders) {
      setActiveLetter(letter);
    }
  }, [letterGroups]);

  // Close the popover
  const close = useCallback(() => {
    setActiveLetter(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  return {
    letterGroups,
    activeLetters,
    activeLetter,
    activeLetterFounders,
    handleLetterHoverStart,
    handleLetterHoverEnd,
    handleLetterClick,
    handleTouchLetter,
    close,
  };
}
