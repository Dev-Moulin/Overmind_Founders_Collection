import { useAccount, useBalance, useDisconnect } from 'wagmi';

export function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();

  if (!isConnected || !address) {
    return null;
  }

  // Format address for display (0x1234...5678)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = () => {
    if (!balance) return '0';
    const value = parseFloat(balance.formatted);
    return value.toFixed(4);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-white/50 text-xs mb-1">Wallet connecté</span>
          <span className="text-white font-mono text-sm">
            {formatAddress(address)}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-white/50 text-xs mb-1">Balance</span>
          <span className="text-white font-medium">
            {formatBalance()} {balance?.symbol || 'ETH'}
          </span>
        </div>

        <button
          onClick={() => disconnect()}
          className="glass-button text-sm px-3 py-1.5"
        >
          Déconnecter
        </button>
      </div>
    </div>
  );
}
