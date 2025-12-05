import { WalletConnectButton } from '../ConnectButton';

/**
 * NotConnected - Écran affiché quand l'utilisateur n'est pas connecté
 * Extrait de VotePanel.tsx lignes 522-535
 */
export function NotConnected() {
  return (
    <div className="glass-card h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-500/20 flex items-center justify-center mb-4">
        <span className="text-3xl">🔗</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Connectez votre wallet</h3>
      <p className="text-white/60 mb-6">
        Pour voter ou proposer un totem, vous devez connecter votre wallet.
      </p>
      <WalletConnectButton />
    </div>
  );
}
