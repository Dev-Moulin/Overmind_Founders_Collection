/**
 * CartBadge - Badge showing cart item count
 *
 * A small badge component to show the number of items in the cart.
 * Can be used in navigation, headers, or floating buttons.
 *
 * @see Phase 4.6 in TODO_Implementation.md
 */

interface CartBadgeProps {
  /** Number of items in cart */
  count: number;
  /** Show badge even when count is 0 */
  showZero?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className */
  className?: string;
}

/**
 * Small badge showing item count
 *
 * @example
 * ```tsx
 * <CartBadge count={3} />
 * ```
 */
export function CartBadge({
  count,
  showZero = false,
  size = 'md',
  className = '',
}: CartBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full font-bold
        bg-purple-500 text-white
        ${sizeClasses[size]}
        ${count > 0 ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Cart icon with badge
 *
 * @example
 * ```tsx
 * <CartIconWithBadge count={3} onClick={() => openCart()} />
 * ```
 */
interface CartIconWithBadgeProps extends CartBadgeProps {
  onClick?: () => void;
  disabled?: boolean;
}

export function CartIconWithBadge({
  count,
  onClick,
  disabled = false,
  className = '',
}: CartIconWithBadgeProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-2 rounded-lg
        bg-white/5 hover:bg-white/10
        border border-white/10 hover:border-white/20
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={`Panier (${count} item${count !== 1 ? 's' : ''})`}
    >
      {/* Cart Icon (SVG) */}
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {/* Badge */}
      {count > 0 && (
        <span
          className="
            absolute -top-1 -right-1
            w-5 h-5 text-xs font-bold
            flex items-center justify-center
            rounded-full
            bg-purple-500 text-white
            animate-pulse
          "
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

/**
 * Floating cart button (fixed position)
 *
 * @example
 * ```tsx
 * <FloatingCartButton
 *   count={itemCount}
 *   totalCost="0.05"
 *   onClick={() => setCartOpen(true)}
 * />
 * ```
 */
interface FloatingCartButtonProps {
  count: number;
  totalCost?: string;
  onClick?: () => void;
  disabled?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

export function FloatingCartButton({
  count,
  totalCost,
  onClick,
  disabled = false,
  position = 'bottom-right',
}: FloatingCartButtonProps) {
  if (count === 0) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        fixed ${positionClasses[position]}
        z-50
        flex items-center gap-3
        px-4 py-3 rounded-full
        bg-purple-500 hover:bg-purple-600
        text-white font-medium
        shadow-lg shadow-purple-500/30
        transition-all duration-300
        hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
      `}
    >
      {/* Cart Icon */}
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {/* Count */}
      <span className="font-bold">{count}</span>

      {/* Divider */}
      <span className="w-px h-5 bg-white/30" />

      {/* Total cost */}
      {totalCost && (
        <span className="text-sm">
          {totalCost} TRUST
        </span>
      )}
    </button>
  );
}
