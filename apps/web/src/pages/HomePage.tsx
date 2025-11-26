import { useCallback, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { WalletConnectButton } from '../components/ConnectButton';
import { FounderHomeCard, FounderHomeCardSkeleton } from '../components/FounderHomeCard';
import { FounderExpandedView } from '../components/FounderExpandedView';
import { useFoundersForHomePage, type FounderForHomePage } from '../hooks/useFoundersForHomePage';

export function HomePage() {
  const { isConnected } = useAccount();
  const { founders, loading, error, stats } = useFoundersForHomePage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get selected founder from URL param
  const selectedFounderId = searchParams.get('founder');

  // Find the selected founder object
  const selectedFounder = useMemo<FounderForHomePage | null>(() => {
    if (!selectedFounderId || founders.length === 0) return null;
    return founders.find(f => f.id === selectedFounderId) || null;
  }, [selectedFounderId, founders]);

  // Select a founder (updates URL)
  const selectFounder = useCallback((founderId: string) => {
    setSearchParams({ founder: founderId });
  }, [setSearchParams]);

  // Close the expanded view (removes URL param)
  const closeExpandedView = useCallback(() => {
    searchParams.delete('founder');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFounder) {
        closeExpandedView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFounder, closeExpandedView]);

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          INTUITION
          <span className="block text-purple-400">Founders Totem</span>
        </h1>
        <p className="text-lg text-white/70 max-w-2xl mx-auto mb-6">
          Proposez et votez pour les totems qui représentent les 42 fondateurs
          de la collection INTUITION. Créez des identités on-chain uniques.
        </p>

        {!isConnected ? (
          <div className="flex justify-center">
            <WalletConnectButton />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/vote" className="glass-button">
              Voir tous les Totems
            </Link>
            <Link to="/results" className="glass-button bg-purple-500/20 border-purple-500/30">
              Résultats
            </Link>
          </div>
        )}
      </section>

      {/* Stats Section - Dynamic */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{stats.totalFounders}</div>
          <div className="text-white/60 text-sm">Fondateurs</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{stats.foundersWithAtoms}</div>
          <div className="text-white/60 text-sm">On-chain</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{stats.totalProposals}</div>
          <div className="text-white/60 text-sm">Propositions</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{stats.foundersWithTotems}</div>
          <div className="text-white/60 text-sm">Avec Totem</div>
        </div>
      </section>

      {/* Founders Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Les 42 Fondateurs</h2>
          <Link to="/propose" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Proposer un totem &rarr;
          </Link>
        </div>

        {error && (
          <div className="glass-card p-6 text-center text-red-400">
            Erreur de chargement : {error.message}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <FounderHomeCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {founders.map((founder) => (
              <FounderHomeCard
                key={founder.id}
                founder={founder}
                onSelect={selectFounder}
                isSelected={founder.id === selectedFounderId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Expanded Founder View (when a founder is selected) */}
      {selectedFounder && (
        <FounderExpandedView
          founder={selectedFounder}
          onClose={closeExpandedView}
        />
      )}

      {/* How It Works Section */}
      <section className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          Comment ça marche ?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-400 font-bold text-sm">1</span>
            </div>
            <h4 className="font-semibold text-white text-sm mb-1">Connectez</h4>
            <p className="text-white/60 text-xs">
              Connectez votre wallet
            </p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-400 font-bold text-sm">2</span>
            </div>
            <h4 className="font-semibold text-white text-sm mb-1">Proposez</h4>
            <p className="text-white/60 text-xs">
              Créez un totem
            </p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-400 font-bold text-sm">3</span>
            </div>
            <h4 className="font-semibold text-white text-sm mb-1">Votez</h4>
            <p className="text-white/60 text-xs">
              Stakez du TRUST
            </p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-400 font-bold text-sm">4</span>
            </div>
            <h4 className="font-semibold text-white text-sm mb-1">Gagnez</h4>
            <p className="text-white/60 text-xs">
              Le meilleur totem gagne
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
