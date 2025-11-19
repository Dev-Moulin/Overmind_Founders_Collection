import { useAccount, useDisconnect } from 'wagmi';

interface NotEligibleProps {
  message?: string;
}

export function NotEligible({ message }: NotEligibleProps) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card p-8 max-w-md text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-white mb-2">
          Accès non autorisé
        </h2>
        <p className="text-white/70 mb-4">
          {message ||
            "Votre adresse wallet n'est pas éligible pour participer à cette campagne."
          }
        </p>
        {address && (
          <p className="text-white/50 text-sm mb-6 font-mono break-all">
            {address}
          </p>
        )}
        <button
          onClick={() => disconnect()}
          className="glass-button-error w-full"
        >
          Déconnecter le wallet
        </button>
      </div>
    </div>
  );
}
