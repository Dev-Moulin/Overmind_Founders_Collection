import { useCallback, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { WalletConnectButton } from '../components/common/ConnectButton';
import { FounderHomeCard, FounderHomeCardSkeleton } from '../components/founder';
import { FounderExpandedView } from '../components/founder';
import { useFoundersForHomePage, type FounderForHomePage } from '../hooks';

export function HomePage() {
  const { t } = useTranslation();
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
          {t('homePage.title')}
          <span className="block text-slate-400">{t('homePage.subtitle')}</span>
        </h1>
        <p className="text-lg text-white/70 max-w-2xl mx-auto mb-6">
          {t('homePage.description')}
        </p>

        {!isConnected ? (
          <div className="flex justify-center">
            <WalletConnectButton />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/vote" className="glass-button">
              {t('homePage.viewAllTotems')}
            </Link>
            <Link to="/results" className="glass-button bg-slate-500/20 border-slate-500/30">
              {t('homePage.results')}
            </Link>
          </div>
        )}
      </section>

      {/* Stats Section - Dynamic */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-slate-400">{stats.totalFounders}</div>
          <div className="text-white/60 text-sm">{t('homePage.stats.founders')}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-slate-400">{stats.foundersWithAtoms}</div>
          <div className="text-white/60 text-sm">{t('homePage.stats.onChain')}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-slate-400">{stats.totalProposals}</div>
          <div className="text-white/60 text-sm">{t('homePage.stats.proposals')}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-slate-400">{stats.foundersWithTotems}</div>
          <div className="text-white/60 text-sm">{t('homePage.stats.withTotem')}</div>
        </div>
      </section>

      {/* Founders Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{t('homePage.foundersTitle')}</h2>
        </div>

        {error && (
          <div className="glass-card p-6 text-center text-red-400">
            {t('homePage.loadingError')} : {error.message}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 16 }).map((_, i) => (
              <FounderHomeCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
    </div>
  );
}
