/**
 * Vote components - Décomposition de VotePanel.tsx
 *
 * Exports:
 * - VotePanel: Composant principal (orchestrateur)
 * - Sous-composants réutilisables
 */

// Main component (will be updated as we extract)
export { VotePanel } from '../VotePanel';

// Sub-components (to be added as we extract)
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
