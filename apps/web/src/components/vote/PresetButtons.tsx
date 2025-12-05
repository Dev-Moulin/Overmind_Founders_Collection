/**
 * PresetButtons - Quick amount selection buttons
 *
 * Provides preset buttons for quick amount selection:
 * [Min] [10%] [25%] [50%] [100%]
 *
 * - Min: Protocol minimum deposit
 * - Percentages: Based on user's wallet balance or maxAmount prop
 *
 * @see Phase 4.4 in TODO_Implementation.md
 */

import { useMemo } from 'react';

interface PresetButtonsProps {
  /** Current amount value */
  value: string;
  /** Callback when amount changes */
  onChange: (amount: string) => void;
  /** User's available balance in TRUST (formatted string) */
  balance?: string;
  /** Maximum amount allowed (formatted string, defaults to balance) */
  maxAmount?: string;
  /** Minimum amount (formatted string, e.g., "0.0001") */
  minAmount?: string;
  /** Whether buttons are disabled */
  disabled?: boolean;
  /** Optional className for container */
  className?: string;
  /** Show percentage buttons (default: true) */
  showPercentages?: boolean;
}

interface PresetButton {
  label: string;
  value: string;
  isActive: boolean;
}

/**
 * PresetButtons component for quick amount selection
 *
 * @example
 * ```tsx
 * function VoteForm() {
 *   const [amount, setAmount] = useState('0.01');
 *   const { config } = useProtocolConfig();
 *
 *   return (
 *     <PresetButtons
 *       value={amount}
 *       onChange={setAmount}
 *       balance="1.5"
 *       minAmount={config?.formattedMinDeposit}
 *     />
 *   );
 * }
 * ```
 */
export function PresetButtons({
  value,
  onChange,
  balance,
  maxAmount,
  minAmount = '0.0001',
  disabled = false,
  className = '',
  showPercentages = true,
}: PresetButtonsProps) {
  const effectiveMax = maxAmount || balance || '1';

  /**
   * Calculate preset values
   */
  const presets = useMemo((): PresetButton[] => {
    const buttons: PresetButton[] = [];
    const currentValue = parseFloat(value) || 0;
    const max = parseFloat(effectiveMax) || 1;
    const min = parseFloat(minAmount) || 0.0001;

    // Min button
    buttons.push({
      label: 'Min',
      value: minAmount,
      isActive: Math.abs(currentValue - min) < 0.000001,
    });

    if (showPercentages && max > 0) {
      // Percentage buttons
      const percentages = [10, 25, 50, 100];

      for (const pct of percentages) {
        const pctValue = (max * pct) / 100;
        // Ensure we don't go below min
        const finalValue = Math.max(pctValue, min);
        // Format to reasonable decimals
        const formatted = formatAmount(finalValue);

        buttons.push({
          label: `${pct}%`,
          value: formatted,
          isActive: Math.abs(currentValue - finalValue) < 0.000001,
        });
      }
    }

    return buttons;
  }, [value, effectiveMax, minAmount, showPercentages]);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onChange(preset.value)}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-lg
            transition-all duration-200
            ${
              preset.isActive
                ? 'bg-slate-500 text-white border border-slate-400'
                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Format amount to reasonable decimal places
 */
function formatAmount(value: number): string {
  if (value >= 1) {
    return value.toFixed(2);
  } else if (value >= 0.01) {
    return value.toFixed(4);
  } else {
    return value.toFixed(6);
  }
}

/**
 * Compact version with just Min/Max buttons
 */
export function PresetButtonsCompact({
  onChange,
  minAmount = '0.0001',
  maxAmount,
  disabled = false,
  className = '',
}: Omit<PresetButtonsProps, 'value' | 'showPercentages'>) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(minAmount)}
        disabled={disabled}
        className={`
          px-2 py-1 text-xs font-medium rounded
          bg-white/5 text-white/70 border border-white/10
          hover:bg-white/10 hover:text-white
          transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        Min
      </button>
      {maxAmount && (
        <button
          type="button"
          onClick={() => onChange(maxAmount)}
          disabled={disabled}
          className={`
            px-2 py-1 text-xs font-medium rounded
            bg-white/5 text-white/70 border border-white/10
            hover:bg-white/10 hover:text-white
            transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          Max
        </button>
      )}
    </div>
  );
}
