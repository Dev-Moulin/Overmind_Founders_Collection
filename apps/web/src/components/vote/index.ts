/**
 * Vote components - Décomposition de VotePanel.tsx
 *
 * Exports:
 * - VotePanel: Composant principal (orchestrateur)
 * - Sous-composants réutilisables
 */

// Main component (will be updated as we extract)
export { VotePanel } from '../VotePanel';

// Sub-components
export { NotConnected } from './NotConnected';
export { RecentActivity } from './RecentActivity';
export { VotePreview } from './VotePreview';
export { ClaimExistsWarning } from './ClaimExistsWarning';
export { PredicateSelector } from './PredicateSelector';
export { TrustAmountInput } from './TrustAmountInput';
export { TotemSelector } from './TotemSelector';
export { SuccessNotification } from './SuccessNotification';
export { ErrorNotification } from './ErrorNotification';
export { SubmitButton } from './SubmitButton';

// Phase 4 - Cart & Preview components
export { PresetButtons, PresetButtonsCompact } from './PresetButtons';
export { PositionModifier } from './PositionModifier';
export { CartBadge, CartIconWithBadge, FloatingCartButton } from './CartBadge';
export { VoteCartPanel } from './VoteCartPanel';
