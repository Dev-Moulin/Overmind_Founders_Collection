import { useEffect, useRef, useState } from 'react';

const GLITCH_CHARS = '`¡™£¢∞§¶•ªº–≠åß∂ƒ©˙∆˚¬…æ≈ç√∫˜µ≤≥÷░▒▓';
const GLITCH_DIGITS = '0123456789#%&@$';

interface ScrambleOptions {
  /** Base frame count per character before revealing (default: 4) */
  baseIterations?: number;
  /** Random extra frames added per character (default: 6) */
  randomRange?: number;
  /** Milliseconds between frames (default: 40) */
  frameInterval?: number;
  /** Delay before starting animation in ms (default: 0) */
  delay?: number;
  /** Use digit-only glitch characters (for numbers) */
  numeric?: boolean;
  /** Increment to re-trigger animation without changing text */
  trigger?: number;
}

/**
 * Text scramble/glitch effect — each character cycles through random symbols
 * before settling on its final value, like a decoder.
 *
 * Triggers on mount and whenever `text` changes.
 */
export function useTextScramble(text: string, options?: ScrambleOptions) {
  const {
    baseIterations = 4,
    randomRange = 6,
    frameInterval = 40,
    delay = 0,
    numeric = false,
  } = options || {};

  const [display, setDisplay] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pool = numeric ? GLITCH_DIGITS : GLITCH_CHARS;

  useEffect(() => {
    if (!text) {
      setDisplay('');
      return;
    }

    // Per-character iteration count (how many frames before it locks)
    const charIterations = text.split('').map((char) =>
      char === ' ' ? 0 : Math.floor(Math.random() * randomRange) + baseIterations
    );
    const maxFrames = Math.max(...charIterations);
    let frame = 0;

    const start = () => {
      intervalRef.current = setInterval(() => {
        setDisplay(
          text
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' ';
              if (frame >= charIterations[i]) return char;
              return pool[Math.floor(Math.random() * pool.length)];
            })
            .join('')
        );

        frame++;
        if (frame > maxFrames && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }, frameInterval);
    };

    if (delay > 0) {
      setDisplay(text.split('').map((c) => (c === ' ' ? ' ' : pool[Math.floor(Math.random() * pool.length)])).join(''));
      timeoutRef.current = setTimeout(start, delay);
    } else {
      start();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, baseIterations, randomRange, frameInterval, delay, pool, options?.trigger]);

  return display || text;
}
