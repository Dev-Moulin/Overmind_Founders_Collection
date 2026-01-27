/**
 * ErrorNotification - Affiche une notification d'erreur
 * Animation contrôlée par le parent via isExiting prop
 */

interface ErrorNotificationProps {
  message: string;
  onClose: () => void;
  isExiting?: boolean; // Si true, joue l'animation de sortie
}

export function ErrorNotification({ message, onClose, isExiting = false }: ErrorNotificationProps) {
  return (
    <div className={`mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg ${
      isExiting ? 'animate-slide-up' : 'animate-slide-down'
    }`}>
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-red-400 text-xs font-bold">!</span>
        </div>
        <div className="flex-1">
          <p className="text-red-300 text-sm whitespace-pre-line">{message}</p>
          <p className="text-red-400/50 text-xs mt-1">Voir console (F12) pour détails</p>
        </div>
        <button
          onClick={onClose}
          className="text-red-400/60 hover:text-red-400"
          disabled={isExiting}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
