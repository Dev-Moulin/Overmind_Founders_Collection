/**
 * useVoteSubmit - Hook pour gérer la soumission d'un vote/claim
 * Extrait de VotePanel.tsx lignes 246-351
 *
 * Gère:
 * - Création de claim avec totem existant
 * - Création de claim avec nouveau totem + catégorie
 * - Gestion des erreurs (ClaimExistsError, InsufficientBalance, etc.)
 * - Reset du formulaire après succès
 */

import { useState, useCallback } from 'react';
import { type Hex } from 'viem';
import { useIntuition, ClaimExistsError } from './useIntuition';
import type { ExistingClaimInfo } from '../components/ClaimExistsModal';

interface FounderData {
  name: string;
  atomId?: string;
}

interface PredicateWithAtom {
  id: string;
  label: string;
  atomId: string | null;
  isOnChain: boolean;
}

interface TotemData {
  id: string;
  label: string;
}

interface UseVoteSubmitProps {
  founder: FounderData;
  selectedPredicateWithAtom: PredicateWithAtom | undefined;
  totemMode: 'existing' | 'new';
  selectedTotemId: string;
  selectedTotem: TotemData | undefined;
  newTotemName: string;
  selectedCategoryId: string | undefined;
  trustAmount: string;
  isFormValid: boolean;
  // Callbacks pour reset le formulaire
  onResetForm: () => void;
  // Callback pour refresh les proposals
  refetchProposals: () => void;
}

interface UseVoteSubmitReturn {
  /** True si la soumission est en cours */
  isSubmitting: boolean;
  /** Message d'erreur (null si pas d'erreur) */
  error: string | null;
  /** Message de succès (null si pas de succès) */
  success: string | null;
  /** Info du claim existant pour la modal */
  existingClaimInfo: ExistingClaimInfo | null;
  /** True si la modal ClaimExists doit s'afficher */
  showClaimExistsModal: boolean;
  /** Fonction pour fermer la modal */
  closeClaimExistsModal: () => void;
  /** Fonction pour effacer l'erreur */
  clearError: () => void;
  /** Fonction pour effacer le succès */
  clearSuccess: () => void;
  /** Fonction pour définir le succès (utilisé par ClaimExistsModal) */
  setSuccess: (msg: string | null) => void;
  /** Fonction pour définir l'info claim existant */
  setExistingClaimInfo: (info: ExistingClaimInfo | null) => void;
  /** Fonction pour afficher la modal */
  setShowClaimExistsModal: (show: boolean) => void;
  /** Fonction de soumission */
  handleSubmit: () => Promise<void>;
}

export function useVoteSubmit({
  founder,
  selectedPredicateWithAtom,
  totemMode,
  selectedTotemId,
  selectedTotem,
  newTotemName,
  selectedCategoryId,
  trustAmount,
  isFormValid,
  onResetForm,
  refetchProposals,
}: UseVoteSubmitProps): UseVoteSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingClaimInfo, setExistingClaimInfo] = useState<ExistingClaimInfo | null>(null);
  const [showClaimExistsModal, setShowClaimExistsModal] = useState(false);

  const { createClaim, createClaimWithCategory, isReady } = useIntuition();

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isReady) {
        throw new Error('Wallet non connecté');
      }

      if (!founder.atomId) {
        throw new Error(
          `Le fondateur "${founder.name}" n'a pas d'Atom ID sur INTUITION. ` +
          `Vérifiez que son atom a bien été créé sur la blockchain.`
        );
      }

      // Determine predicate value (atomId if exists, label if needs creation)
      const predicateValue = selectedPredicateWithAtom?.atomId || selectedPredicateWithAtom?.label;
      if (!predicateValue) {
        throw new Error('Prédicat non sélectionné');
      }

      let result;

      if (totemMode === 'existing') {
        // Use existing totem - use createClaim
        if (!selectedTotemId) {
          throw new Error('Totem non sélectionné');
        }

        result = await createClaim({
          subjectId: founder.atomId as Hex,
          predicate: predicateValue,
          object: selectedTotemId as Hex,
          depositAmount: trustAmount,
        });
      } else {
        // Create new totem with category triple (OFC: system)
        if (!newTotemName.trim()) {
          throw new Error('Nom du totem requis');
        }

        if (!selectedCategoryId) {
          throw new Error('Catégorie invalide. Veuillez choisir une catégorie existante.');
        }

        result = await createClaimWithCategory({
          subjectId: founder.atomId as Hex,
          predicate: predicateValue,
          objectName: newTotemName.trim(),
          categoryId: selectedCategoryId,
          depositAmount: trustAmount,
        });
      }

      // Show success message
      const totemLabel = totemMode === 'existing' ? selectedTotem?.label : newTotemName;
      setSuccess(
        `Claim créé avec succès!\n` +
        `"${founder.name} ${selectedPredicateWithAtom?.label} ${totemLabel}"\n` +
        `Transaction: ${result.triple.transactionHash.slice(0, 10)}...`
      );

      // Reset form
      onResetForm();

      // Refresh proposals data
      refetchProposals();

      // Clear success after 8 seconds
      setTimeout(() => setSuccess(null), 8000);
    } catch (err) {
      // Check if claim already exists - open modal to vote on it
      if (err instanceof ClaimExistsError) {
        setExistingClaimInfo({
          termId: err.termId,
          counterTermId: err.counterTermId,
          subjectLabel: err.subjectLabel,
          predicateLabel: err.predicateLabel,
          objectLabel: err.objectLabel,
          forVotes: err.forVotes,
          againstVotes: err.againstVotes,
        });
        setShowClaimExistsModal(true);
        setIsSubmitting(false);
        return;
      }

      let errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du claim';

      // Improve common error messages
      if (errorMessage.includes('InsufficientBalance')) {
        errorMessage = `Balance tTRUST insuffisante. Assurez-vous d'avoir assez de tTRUST sur INTUITION Testnet.`;
      } else if (errorMessage.includes('TripleExists')) {
        errorMessage = `Ce claim existe déjà. Vous pouvez voter dessus au lieu de le recréer.`;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    isSubmitting,
    isReady,
    founder,
    selectedPredicateWithAtom,
    totemMode,
    selectedTotemId,
    selectedTotem,
    newTotemName,
    selectedCategoryId,
    trustAmount,
    createClaim,
    createClaimWithCategory,
    onResetForm,
    refetchProposals,
  ]);

  const closeClaimExistsModal = useCallback(() => {
    setShowClaimExistsModal(false);
    setExistingClaimInfo(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(null), []);

  return {
    isSubmitting,
    error,
    success,
    existingClaimInfo,
    showClaimExistsModal,
    closeClaimExistsModal,
    clearError,
    clearSuccess,
    setSuccess,
    setExistingClaimInfo,
    setShowClaimExistsModal,
    handleSubmit,
  };
}
