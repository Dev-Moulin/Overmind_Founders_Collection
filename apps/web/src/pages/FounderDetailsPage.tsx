import { useParams, Link } from 'react-router-dom';
import { TotemProposalCard } from '../components/TotemProposalCard';
import { aggregateTriplesByObject, formatTrustAmount } from '../utils';
import { useFounderProposals } from '../hooks';

export function FounderDetailsPage() {
  const { founderId } = useParams<{ founderId: string }>();

  // Decode founder name from URL (may contain spaces encoded as %20 or -)
  const founderName = founderId
    ? decodeURIComponent(founderId).replace(/-/g, ' ')
    : '';

  // Fetch founder proposals from GraphQL
  const { proposals, loading, error } = useFounderProposals(founderName);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Chargement...
          </h2>
          <p className="text-white/70">
            Récupération des propositions pour {founderName}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-white/60 mb-6">
            Erreur lors du chargement des propositions: {error.message}
          </p>
          <Link to="/results" className="glass-button">
            ← Retour aux résultats
          </Link>
        </div>
      </div>
    );
  }

  // No proposals found
  if (!proposals || proposals.length === 0) {
    return (
      <div className="space-y-8">
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Fondateur introuvable
          </h2>
          <p className="text-white/60 mb-6">
            Le fondateur "{founderName}" n'existe pas ou n'a pas encore de
            propositions.
          </p>
          <Link to="/results" className="glass-button">
            ← Retour aux résultats
          </Link>
        </div>
      </div>
    );
  }

  // Convert proposals to the format expected by aggregateTriplesByObject
  const triples = proposals.map((p) => ({
    term_id: p.term_id,
    predicate: { term_id: 'represented_by', label: 'represented_by' },
    object: p.object,
    triple_vault: { total_assets: p.votes.forVotes.toString() },
    counter_term: { id: '', total_assets: p.votes.againstVotes.toString() },
  }));

  // Aggregate votes by totem
  const aggregatedTotems = aggregateTriplesByObject(triples);
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
            {proposals[0]?.subject?.image ? (
              <img
                src={proposals[0].subject.image}
                alt={founderName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              founderName.charAt(0)
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {founderName}
            </h1>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/60">Propositions:</span>
                <span className="font-semibold text-purple-400">
                  {aggregatedTotems.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60">Claims totaux:</span>
                <span className="font-semibold text-purple-400">
                  {proposals.length}
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
              founderId={encodeURIComponent(founderName)}
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
