import { useParams, Link } from 'react-router-dom';
import { ClaimCard } from '../components/ClaimCard';
import { aggregateTriplesByObject, formatTrustAmount } from '../utils';

// TODO: Replace with GraphQL query from issue #34/#46
// Mock data structure matching the actual data model
const MOCK_DATA = {
  founders: {
    '1': {
      id: '1',
      name: 'Joseph Lubin',
    },
    '2': {
      id: '2',
      name: 'Andrew Keys',
    },
  },
  triples: {
    '1': [
      {
        id: 'triple-1',
        predicate: { id: 'pred-1', label: 'embodies' },
        object: {
          id: 'lion',
          label: 'Lion',
          image: undefined,
          description:
            'King of the jungle, symbol of leadership, courage, and strength.',
        },
        positiveVault: { totalAssets: '100000000000000000000' }, // 100 TRUST
        negativeVault: { totalAssets: '7000000000000000000' }, // 7 TRUST
      },
      {
        id: 'triple-2',
        predicate: { id: 'pred-2', label: 'channels' },
        object: {
          id: 'lion',
          label: 'Lion',
          image: undefined,
          description:
            'King of the jungle, symbol of leadership, courage, and strength.',
        },
        positiveVault: { totalAssets: '80000000000000000000' }, // 80 TRUST
        negativeVault: { totalAssets: '5000000000000000000' }, // 5 TRUST
      },
      {
        id: 'triple-3',
        predicate: { id: 'pred-1', label: 'embodies' },
        object: {
          id: 'eagle',
          label: 'Eagle',
          image: undefined,
          description: 'Symbol of vision, freedom, and perspective.',
        },
        positiveVault: { totalAssets: '60000000000000000000' },
        negativeVault: { totalAssets: '15000000000000000000' },
      },
    ],
  },
};

export function TotemDetailsPage() {
  const { founderId, totemId } = useParams<{
    founderId: string;
    totemId: string;
  }>();

  // TODO: Replace with GraphQL query
  const founder = founderId ? MOCK_DATA.founders[founderId] : undefined;
  const allTriples = founderId ? MOCK_DATA.triples[founderId] : undefined;

  if (!founder || !allTriples) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Données introuvables
          </h2>
          <p className="text-white/60 mb-6">
            Le fondateur ou le totem demandé n'existe pas.
          </p>
          <Link to="/results" className="glass-button">
            ← Retour aux résultats
          </Link>
        </div>
      </div>
    );
  }

  // Filter triples for this specific totem
  const totemTriples = allTriples.filter((t) => t.object.id === totemId);

  if (totemTriples.length === 0) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Totem introuvable
          </h2>
          <p className="text-white/60 mb-6">
            Aucune proposition de ce totem pour ce fondateur.
          </p>
          <Link to={`/results/${founderId}`} className="glass-button">
            ← Retour aux totems de {founder.name}
          </Link>
        </div>
      </div>
    );
  }

  // Aggregate to get overall stats
  const aggregated = aggregateTriplesByObject(totemTriples);
  const totemData = aggregated[0]; // Should only be one totem

  // Check if this is the winning totem by comparing with all totems
  const allAggregated = aggregateTriplesByObject(allTriples);
  const isWinner = allAggregated[0]?.objectId === totemId;

  const winRate =
    totemData.totalFor > 0n
      ? Number(
          (totemData.totalFor * 100n) /
            (totemData.totalFor + totemData.totalAgainst)
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Link to="/results" className="hover:text-purple-400 transition-colors">
          Résultats
        </Link>
        <span>→</span>
        <Link
          to={`/results/${founderId}`}
          className="hover:text-purple-400 transition-colors"
        >
          {founder.name}
        </Link>
        <span>→</span>
        <span className="text-white">{totemData.object.label}</span>
      </div>

      {/* Totem Header */}
      <div className="glass-card p-8 relative">
        {/* Winner Badge */}
        {isWinner && (
          <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            🏆 Totem Gagnant
          </div>
        )}

        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          {/* Totem Image */}
          <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-900/20 to-blue-900/20 overflow-hidden">
            {totemData.object.image ? (
              <img
                src={totemData.object.image}
                alt={totemData.object.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-9xl">
                  {totemData.object.label.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Totem Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {totemData.object.label}
              </h1>
              <p className="text-lg text-white/60 mb-4">
                Totem proposé pour{' '}
                <Link
                  to={`/results/${founderId}`}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {founder.name}
                </Link>
              </p>
              {totemData.object.description && (
                <p className="text-white/80">{totemData.object.description}</p>
              )}
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    totemData.netScore > 0n
                      ? 'text-green-400'
                      : totemData.netScore < 0n
                        ? 'text-red-400'
                        : 'text-white/60'
                  }`}
                >
                  {totemData.netScore >= 0n ? '+' : ''}
                  {formatTrustAmount(totemData.netScore, 2)}
                </div>
                <div className="text-white/60 text-xs">NET Score</div>
              </div>

              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {formatTrustAmount(totemData.totalFor, 2)}
                </div>
                <div className="text-white/60 text-xs">TRUST FOR</div>
              </div>

              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {formatTrustAmount(totemData.totalAgainst, 2)}
                </div>
                <div className="text-white/60 text-xs">TRUST AGAINST</div>
              </div>

              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {totemData.claimCount}
                </div>
                <div className="text-white/60 text-xs">
                  Claim{totemData.claimCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Win Rate Bar */}
            <div>
              <div className="flex justify-between text-sm text-white/60 mb-2">
                <span>Taux d'approbation</span>
                <span className="font-semibold">{winRate.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claims Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Détails des Claims
        </h2>
        <p className="text-white/60 mb-6">
          Chaque claim représente une proposition avec un prédicat différent
        </p>

        {/* Claims Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {totemData.claims
            .sort((a, b) => {
              if (a.netScore > b.netScore) return -1;
              if (a.netScore < b.netScore) return 1;
              return 0;
            })
            .map((claim, index) => (
              <ClaimCard key={claim.tripleId} claim={claim} rank={index + 1} />
            ))}
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <Link
          to={`/results/${founderId}`}
          className="glass-button px-6 py-3"
        >
          ← Retour aux totems de {founder.name}
        </Link>
      </div>

      {/* Status Notice */}
      <div className="glass-card p-4 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-white/60">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Résultats en temps réel - Vote en cours</span>
        </div>
      </div>
    </div>
  );
}
