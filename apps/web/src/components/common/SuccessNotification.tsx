/**
 * SuccessNotification - Affiche une notification de succès
 * Avec animations d'entrée et de sortie élastiques (3s chacune)
 */

import { useState } from 'react';

interface SuccessNotificationProps {
  message: string;
  onClose: () => void;
}

export function SuccessNotification({ message, onClose }: SuccessNotificationProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = () => {
    setIsLeaving(true);
    // Wait for exit animation to complete (3s)
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  return (
    <div className={`mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg ${
      isLeaving ? 'animate-slide-up' : 'animate-slide-down'
    }`}>
      <div className="flex items-start gap-2">
        <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-green-300 text-sm whitespace-pre-line">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="text-green-400/60 hover:text-green-400"
          disabled={isLeaving}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
