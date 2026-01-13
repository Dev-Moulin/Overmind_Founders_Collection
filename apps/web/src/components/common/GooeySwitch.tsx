/**
 * GooeySwitch - Grid of buttons with Metaball/Gooey effect
 *
 * Uses SVG filters for the liquid/gooey merge effect on the indicator
 *
 * @example
 * // Simple usage with labels
 * <GooeySwitch
 *   options={[{ id: '1', label: 'One' }, { id: '2', label: 'Two' }, ...]}
 *   value="1"
 *   onChange={(id) => setValue(id)}
 *   columns={5}
 * />
 *
 * @example
 * // Custom rendering with renderOption
 * <GooeySwitch
 *   options={totems}
 *   value={selectedId}
 *   onChange={setSelectedId}
 *   columns={2}
 *   renderOption={(option, isSelected) => (
 *     <div className="p-2">
 *       <span>{option.label}</span>
 *       {option.category && <span className="text-xs">{option.category}</span>}
 *     </div>
 *   )}
 * />
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';

export interface GooeySwitchOption {
  id: string;
  label: string;
  /** Additional data for custom rendering */
  [key: string]: unknown;
}

interface GooeySwitchProps<T extends GooeySwitchOption = GooeySwitchOption> {
  options: T[];
  value: string;
  onChange: (id: string) => void;
  columns?: number;
  className?: string;
  color?: string;
  /** Custom render function for each option */
  renderOption?: (option: T, isSelected: boolean, index: number) => ReactNode;
  /** Gap between items in pixels */
  gap?: number;
  /** Padding inside container */
  padding?: number;
  /** Use transparent background (for grid mode with custom renderOption) */
  transparent?: boolean;
  /** Hide the gooey indicator blob (use when renderOption handles selection styling) */
  hideIndicator?: boolean;
}

export function GooeySwitch<T extends GooeySwitchOption = GooeySwitchOption>({
  options,
  value,
  onChange,
  columns = 5,
  className = '',
  color = '#334155', // slate-700 by default (darker for better contrast)
  renderOption,
  gap = 4,
  padding = 4,
  transparent = false,
  hideIndicator = false,
}: GooeySwitchProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate unique filter ID for this instance
  const [filterId] = useState(() => `gooey-switch-${Math.random().toString(36).substr(2, 9)}`);

  // Calculate indicator position
  useEffect(() => {
    if (!containerRef.current) return;
    const selectedButton = containerRef.current.querySelector<HTMLButtonElement>(`[data-gooey-id="${value}"]`);
    if (selectedButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        top: buttonRect.top - containerRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
      });
    }
  }, [value, options]);

  const handleOptionClick = (id: string) => {
    if (id !== value) {
      setIsAnimating(true);
      onChange(id);
      setTimeout(() => setIsAnimating(false), 400);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl ${transparent ? '' : 'bg-white/5 backdrop-blur-sm'} ${className}`}
    >
      {/* SVG Filter and Gooey indicator - only shown when hideIndicator is false */}
      {!hideIndicator && (
        <>
          <svg className="absolute w-0 h-0">
            <defs>
              <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                          0 0 0 20 -8"
                  result="gooey"
                />
                <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
              </filter>
            </defs>
          </svg>

          {/* Gooey indicator layer - applies filter to indicator */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ filter: `url(#${filterId})` }}
          >
            {/* Main indicator blob */}
            <div
              className="absolute rounded-xl transition-all duration-300 ease-out"
              style={{
                left: indicatorStyle.left,
                top: indicatorStyle.top,
                width: indicatorStyle.width,
                height: indicatorStyle.height,
                backgroundColor: color,
                opacity: 0.9,
                transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
              }}
            />
            {/* Trail blob for gooey effect during animation */}
            {isAnimating && (
              <div
                className="absolute rounded-xl transition-all duration-500 ease-out"
                style={{
                  left: indicatorStyle.left,
                  top: indicatorStyle.top,
                  width: indicatorStyle.width,
                  height: indicatorStyle.height,
                  backgroundColor: color,
                  opacity: 0.6,
                  transform: 'scale(0.9)',
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Buttons grid */}
      <div
        className="relative grid"
        style={{
          zIndex: 1,
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          padding: `${padding}px`,
        }}
      >
        {options.map((option, index) => {
          const isSelected = option.id === value;
          return (
            <button
              key={option.id}
              data-gooey-id={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`
                rounded-xl transition-colors duration-200
                outline-none focus:outline-none focus:ring-0 focus-visible:ring-0
                ${renderOption ? '' : 'px-3 py-2 text-sm font-medium'}
                ${isSelected
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
                }
              `}
              style={{ background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none' }}
            >
              {renderOption ? renderOption(option, isSelected, index) : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GooeySwitch;
