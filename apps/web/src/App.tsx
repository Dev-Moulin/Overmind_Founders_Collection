import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';

import { config } from './config/wagmi';
import { Layout } from './components/Layout';
import { NetworkGuard } from './components/NetworkGuard';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#7c3aed',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <Layout>
            <NetworkGuard>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Welcome to Founders Totem
                </h2>
                <p className="text-white/70">
                  Connect your wallet to propose and vote for founder totems.
                </p>
              </div>
            </NetworkGuard>
          </Layout>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
