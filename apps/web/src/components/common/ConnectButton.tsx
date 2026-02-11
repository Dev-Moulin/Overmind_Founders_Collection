import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              // Pas connecté : afficher bouton Connect
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="glass-button"
                    style={{ padding: '6px 20px' }}
                  >
                    Connect Wallet
                  </button>
                );
              }

              // Mauvais réseau : afficher bouton pour changer
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="glass-button glass-button-error"
                    style={{ padding: '6px 20px' }}
                  >
                    Wrong network
                  </button>
                );
              }

              // Connecté : afficher adresse
              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="glass-button glass-button-connected"
                  style={{ padding: '6px 20px' }}
                >
                  {account.displayName}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
