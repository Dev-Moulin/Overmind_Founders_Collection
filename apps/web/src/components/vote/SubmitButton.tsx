/**
 * SubmitButton - Bouton de soumission du vote
 * Extrait de VotePanel.tsx lignes 669-681
 */

interface SubmitButtonProps {
  onClick: () => void;
  isFormValid: boolean;
  isSubmitting: boolean;
  hasExistingClaim: boolean;
}

export function SubmitButton({
  onClick,
  isFormValid,
  isSubmitting,
  hasExistingClaim,
}: SubmitButtonProps) {
  const isDisabled = !isFormValid || isSubmitting || hasExistingClaim;

  const getButtonText = () => {
    if (isSubmitting) return 'Création en cours...';
    if (hasExistingClaim) return 'Claim déjà existant';
    return 'Créer le vote';
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full py-3 rounded-lg font-semibold transition-colors
        ${
          isFormValid && !isSubmitting && !hasExistingClaim
            ? 'bg-purple-500 hover:bg-purple-600 text-white'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        }`}
    >
      {getButtonText()}
    </button>
  );
}
