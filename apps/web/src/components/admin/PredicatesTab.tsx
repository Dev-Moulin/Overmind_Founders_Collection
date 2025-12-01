interface Atom {
  term_id: string;
  label: string;
  image?: string;
  emoji?: string;
  type?: string;
}

interface PredicatesTabProps {
  predicates: Array<{ label: string; description: string }>;
  predicatesByLabel: Map<string, Atom>;
  createdItems: Map<string, { termId: string; txHash: string }>;
  creatingItem: string | null;
  isAdmin: boolean;
  predicatesLoading: boolean;
  customPredicateLabel: string;
  setCustomPredicateLabel: (value: string) => void;
  onCreatePredicate: (label: string) => void;
}

export function PredicatesTab({
  predicates,
  predicatesByLabel,
  createdItems,
  creatingItem,
  isAdmin,
  predicatesLoading,
  customPredicateLabel,
  setCustomPredicateLabel,
  onCreatePredicate,
}: PredicatesTabProps) {
  if (predicatesLoading) {
    return <div className="p-6 text-center text-white/60">Chargement des prédicats...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <div className="text-2xl font-bold text-purple-400">
          {predicatesByLabel.size}/{predicates.length}
        </div>
        <div className="text-sm text-white/60">Prédicats créés</div>
      </div>

      {/* Predicate List */}
      <div className="space-y-3">
        {predicates.map((predicate) => {
          const exists = predicatesByLabel.has(predicate.label);
          const justCreated = createdItems.has(predicate.label);

          return (
            <div
              key={predicate.label}
              className={`p-4 rounded-lg border ${
                exists || justCreated
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-white mb-1">"{predicate.label}"</div>
                  <div className="text-sm text-white/60">{predicate.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  {(exists || justCreated) && (
                    <span className="text-green-400 text-sm">Créé</span>
                  )}
                  {!exists && !justCreated && isAdmin && (
                    <button
                      onClick={() => onCreatePredicate(predicate.label)}
                      disabled={creatingItem !== null}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 disabled:opacity-50"
                    >
                      {creatingItem === predicate.label ? 'Création...' : 'Créer'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Predicate */}
      <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-bold text-blue-400 mb-4">Créer un prédicat personnalisé</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={customPredicateLabel}
            onChange={(e) => setCustomPredicateLabel(e.target.value)}
            placeholder="Ex: 'is inspired by'"
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40"
          />
          <button
            onClick={() => {
              if (customPredicateLabel.trim()) {
                onCreatePredicate(customPredicateLabel.trim());
                setCustomPredicateLabel('');
              }
            }}
            disabled={!customPredicateLabel.trim() || creatingItem !== null}
            className="px-6 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
