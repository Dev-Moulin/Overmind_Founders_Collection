interface Atom {
  term_id: string;
  label: string;
  image?: string;
  emoji?: string;
  type?: string;
}

interface PredicateConfig {
  id: string;
  label: string;
  description: string;
  isDefault: boolean;
}

interface PredicatesTabProps {
  predicates: PredicateConfig[];
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

  const existingCount = predicatesByLabel.size;
  const missingCount = predicates.length - existingCount;

  return (
    <div className="space-y-6">
      {/* Info Box - Phase 3 Simplification */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-bold text-blue-400 mb-2">Prédicats Utilisateur (Phase 3):</h3>
        <div className="text-white/70 text-sm space-y-1">
          <p><code className="bg-white/10 px-2 py-1 rounded">Triple 1:</code> [Founder] → [<span className="text-slate-400">predicate</span>] → [Totem] <span className="text-white/50">(Vote FOR/AGAINST)</span></p>
        </div>
        <p className="text-white/50 text-xs mt-2">
          Ces 2 prédicats sont utilisés par les utilisateurs dans le VotePanel.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{existingCount}</div>
          <div className="text-sm text-white/60">Prédicats existants</div>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-2xl font-bold text-red-400">{missingCount}</div>
          <div className="text-sm text-white/60">Prédicats manquants</div>
        </div>
        <div className="p-4 bg-slate-500/10 border border-slate-500/30 rounded-lg">
          <div className="text-2xl font-bold text-slate-400">{predicates.length}</div>
          <div className="text-sm text-white/60">Total prédicats</div>
        </div>
      </div>

      {/* Predicate List */}
      <div className="space-y-3">
        {predicates.map((predicate) => {
          const exists = predicatesByLabel.has(predicate.label);
          const justCreated = createdItems.has(predicate.label);

          return (
            <div
              key={predicate.id}
              className={`p-4 rounded-lg border ${
                exists || justCreated
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-white mb-1 flex items-center gap-2">
                    "{predicate.label}"
                    {predicate.isDefault && (
                      <span className="text-xs bg-slate-500/30 text-slate-300 px-2 py-0.5 rounded">
                        défaut
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/60">{predicate.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  {(exists || justCreated) ? (
                    <div className="text-right">
                      <span className="text-green-400 text-sm">Créé</span>
                      {exists && (
                        <div className="text-xs text-white/40 font-mono mt-1">
                          {predicatesByLabel.get(predicate.label)?.term_id.slice(0, 10)}...
                        </div>
                      )}
                    </div>
                  ) : (
                    isAdmin && (
                      <button
                        onClick={() => onCreatePredicate(predicate.label)}
                        disabled={creatingItem !== null}
                        className="px-4 py-2 bg-slate-500/20 text-slate-400 rounded hover:bg-slate-500/30 disabled:opacity-50"
                      >
                        {creatingItem === predicate.label ? 'Création...' : 'Créer'}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TermIds Export - Only show when predicates exist */}
      {predicatesByLabel.size > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <h4 className="text-sm font-bold text-emerald-400 mb-2">Export termIds pour predicates.json</h4>
          <p className="text-xs text-white/60 mb-3">Copiez ces valeurs dans <code className="bg-white/10 px-1 rounded">packages/shared/src/data/predicates.json</code></p>
          <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto font-mono text-white/80">
{JSON.stringify([
  {
    id: 'has-totem',
    label: 'has totem',
    description: 'Associative/neutral: X has totem Y',
    termId: predicatesByLabel.get('has totem')?.term_id || null,
    isDefault: true
  },
  {
    id: 'embodies',
    label: 'embodies',
    description: 'Strong opinion: X embodies/incarnates Y',
    termId: predicatesByLabel.get('embodies')?.term_id || null,
    isDefault: false
  }
], null, 2)}
          </pre>
          <button
            onClick={() => {
              const json = JSON.stringify([
                {
                  id: 'has-totem',
                  label: 'has totem',
                  description: 'Associative/neutral: X has totem Y',
                  termId: predicatesByLabel.get('has totem')?.term_id || null,
                  isDefault: true
                },
                {
                  id: 'embodies',
                  label: 'embodies',
                  description: 'Strong opinion: X embodies/incarnates Y',
                  termId: predicatesByLabel.get('embodies')?.term_id || null,
                  isDefault: false
                }
              ], null, 2);
              navigator.clipboard.writeText(json);
            }}
            className="mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm hover:bg-emerald-500/30"
          >
            Copier JSON
          </button>
        </div>
      )}

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

      {/* Instructions */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="text-sm font-bold text-white/80 mb-2">Instructions (Prédicats Utilisateur)</h4>
        <ol className="text-sm text-white/60 space-y-1 list-decimal list-inside">
          <li>Créer les 2 prédicats : <code className="bg-white/10 px-1 rounded">has totem</code> et <code className="bg-white/10 px-1 rounded">embodies</code></li>
          <li><strong className="text-white/80">IMPORTANT:</strong> Mettre à jour les <code className="bg-white/10 px-1 rounded">termId</code> dans <code className="bg-white/10 px-1 rounded">predicates.json</code></li>
          <li>Ces prédicats seront utilisés dans le VotePanel pour créer des claims</li>
        </ol>
      </div>
    </div>
  );
}
