import { useParams, Link } from 'react-router-dom';
import { TotemProposalCard } from '../components/TotemProposalCard';
import { aggregateTriplesByObject, formatTrustAmount } from '../utils';

// TODO: Replace with GraphQL query from issue #34/#46
// Mock data for UI/UX validation
const MOCK_FOUNDER_DATA = {
  '1': {
    id: '1',
    name: 'Joseph Lubin',
    image: undefined,
    description:
      'Co-founder of Ethereum, founder of ConsenSys. Visionary leader in blockchain technology.',
    triples: [
      {
        id: 'triple-1',
        predicate: { id: 'pred-1', label: 'embodies' },
        object: {
          id: 'lion',
          label: 'Lion',
          image: undefined,
          description: 'King of the jungle, symbol of leadership and courage',
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
          description: 'King of the jungle, symbol of leadership and courage',
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
          description: 'Symbol of vision and freedom',
        },
        positiveVault: { totalAssets: '60000000000000000000' }, // 60 TRUST
        negativeVault: { totalAssets: '15000000000000000000' }, // 15 TRUST
      },
      {
        id: 'triple-4',
        predicate: { id: 'pred-3', label: 'is symbolized by' },
        object: {
          id: 'phoenix',
          label: 'Phoenix',
          image: undefined,
          description: 'Symbol of rebirth and innovation',
        },
        positiveVault: { totalAssets: '40000000000000000000' }, // 40 TRUST
        negativeVault: { totalAssets: '20000000000000000000' }, // 20 TRUST
      },
    ],
    totalVoters: 12,
  },
  '2': {
    id: '2',
    name: 'Andrew Keys',
    image: undefined,
    description: 'Early Ethereum pioneer and blockchain entrepreneur.',
    triples: [
      {
        id: 'triple-5',
        predicate: { id: 'pred-1', label: 'embodies' },
        object: {
          id: 'eagle',
          label: 'Eagle',
          image: undefined,
        },
        positiveVault: { totalAssets: '80000000000000000000' },
        negativeVault: { totalAssets: '5000000000000000000' },
      },
    ],
    totalVoters: 10,
  },
};

export function FounderDetailsPage() {
  const { founderId } = useParams<{ founderId: string }>();

  // TODO: Replace with GraphQL query
  const founderData = founderId ? MOCK_FOUNDER_DATA[founderId] : undefined;

  if (!founderData) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Fondateur introuvable
          </h2>
          <p className="text-white/60 mb-6">
            Le fondateur demandé n'existe pas ou n'a pas encore de propositions.
          </p>
          <Link to="/results" className="glass-button">
            ← Retour aux résultats
          </Link>
        </div>
      </div>
    );
  }

  // Aggregate votes by totem
  const aggregatedTotems = aggregateTriplesByObject(founderData.triples);
  const winningTotem = aggregatedTotems[0]; // Highest NET score

  // Calculate stats
  const totalFor = aggregatedTotems.reduce(
    (sum, t) => sum + t.totalFor,
    0n
  );
  const totalAgainst = aggregatedTotems.reduce(
    (sum, t) => sum + t.totalAgainst,
    0n
  );
  const totalStaked = totalFor + totalAgainst;
  const netTotal = totalFor - totalAgainst;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        to="/results"
        className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
      >
        ← Retour aux résultats
      </Link>

      {/* Founder Header */}
      <div className="glass-card p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold text-white flex-shrink-0">
            {founderData.image ? (
              <img
                src={founderData.image}
                alt={founderData.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              founderData.name.charAt(0)
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {founderData.name}
            </h1>
            {founderData.description && (
              <p className="text-white/70 mb-4">{founderData.description}</p>
            )}

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/60">Propositions:</span>
                <span className="font-semibold text-purple-400">
                  {aggregatedTotems.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60">Votants:</span>
                <span className="font-semibold text-purple-400">
                  {founderData.totalVoters}
                </span>
              </div>
              {winningTotem && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Totem gagnant:</span>
                  <span className="font-semibold text-purple-400">
                    🏆 {winningTotem.object.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Voting Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {formatTrustAmount(totalFor, 2)}
          </div>
          <div className="text-white/60 text-sm">TRUST FOR</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {formatTrustAmount(totalAgainst, 2)}
          </div>
          <div className="text-white/60 text-sm">TRUST AGAINST</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {formatTrustAmount(totalStaked, 2)}
          </div>
          <div className="text-white/60 text-sm">Total Staked</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div
            className={`text-2xl font-bold ${
              netTotal > 0n
                ? 'text-green-400'
                : netTotal < 0n
                  ? 'text-red-400'
                  : 'text-white/60'
            }`}
          >
            {netTotal >= 0n ? '+' : ''}
            {formatTrustAmount(netTotal, 2)}
          </div>
          <div className="text-white/60 text-sm">NET Total</div>
        </div>
      </div>

      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Propositions de Totems
        </h2>
        <p className="text-white/60">
          Classées par score NET (FOR - AGAINST)
        </p>
      </div>

      {/* Totem Proposals Grid */}
      {aggregatedTotems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aggregatedTotems.map((totem, index) => (
            <TotemProposalCard
              key={totem.objectId}
              founderId={founderData.id}
              totem={totem}
              rank={index + 1}
              isWinner={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">
            Aucune proposition
          </h3>
          <p className="text-white/60">
            Ce fondateur n'a pas encore de propositions de totems.
          </p>
        </div>
      )}

      {/* Participation Note */}
      <div className="glass-card p-4 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-white/60">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Résultats en temps réel - Vote en cours</span>
        </div>
      </div>
    </div>
  );
}
