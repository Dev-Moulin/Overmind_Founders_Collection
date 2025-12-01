interface Atom {
  term_id: string;
  label: string;
  image?: string;
  emoji?: string;
  type?: string;
}

interface OfcAtom {
  id: string;
  label: string;
  description: string;
  emoji: string;
  type: 'predicate' | 'category';
}

interface OfcCategoriesTabProps {
  ofcAtoms: OfcAtom[];
  ofcAtomsByLabel: Map<string, Atom>;
  createdItems: Map<string, { termId: string; txHash: string }>;
  creatingItem: string | null;
  isAdmin: boolean;
  ofcAtomsLoading: boolean;
  onCreateOfcAtom: (label: string) => void;
}

export function OfcCategoriesTab({
  ofcAtoms,
  ofcAtomsByLabel,
  createdItems,
  creatingItem,
  isAdmin,
  ofcAtomsLoading,
  onCreateOfcAtom,
}: OfcCategoriesTabProps) {
  if (ofcAtomsLoading) {
    return <div className="p-6 text-center text-white/60">Chargement des atoms OFC...</div>;
  }

  const predicateAtom = ofcAtoms.find((a) => a.type === 'predicate');
  const categoryAtoms = ofcAtoms.filter((a) => a.type === 'category');

  const existingCount = ofcAtomsByLabel.size;
  const missingCount = ofcAtoms.length - existingCount;

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-bold text-blue-400 mb-2">Système de Catégories OFC:</h3>
        <p className="text-white/70 text-sm">
          Ces atoms sont utilisés pour catégoriser les totems via des triples :
          <code className="bg-white/10 px-2 py-1 rounded mx-1">[Totem] [has_category] [OFC:Category]</code>
        </p>
        <p className="text-white/50 text-xs mt-2">
          OFC = Overmind Founders Collection
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{existingCount}</div>
          <div className="text-sm text-white/60">Atoms existants</div>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-2xl font-bold text-red-400">{missingCount}</div>
          <div className="text-sm text-white/60">Atoms manquants</div>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">{ofcAtoms.length}</div>
          <div className="text-sm text-white/60">Total atoms OFC</div>
        </div>
      </div>

      {/* Debug: Show expected vs returned labels */}
      {missingCount > 0 && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <h4 className="text-sm font-bold text-orange-400 mb-2">Debug - Comparaison labels</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-white/60 mb-1">Labels attendus ({ofcAtoms.length}):</p>
              <ul className="text-white/80 font-mono space-y-0.5">
                {ofcAtoms.map((a) => (
                  <li key={a.id} className={ofcAtomsByLabel.has(a.label) ? 'text-green-400' : 'text-red-400'}>
                    "{a.label}" {ofcAtomsByLabel.has(a.label) ? '(ok)' : '(manquant)'}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white/60 mb-1">Labels retournés par GraphQL ({ofcAtomsByLabel.size}):</p>
              <ul className="text-white/80 font-mono space-y-0.5">
                {Array.from(ofcAtomsByLabel.keys()).map((label) => (
                  <li key={label}>"{label}"</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Predicate Section */}
      {predicateAtom && (
        <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">Prédicat has_category</h3>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-bold text-white mb-1 flex items-center gap-2">
                  {predicateAtom.emoji} "{predicateAtom.label}"
                </div>
                <div className="text-sm text-white/60">{predicateAtom.description}</div>
              </div>
              <div className="flex items-center gap-3">
                {(ofcAtomsByLabel.has(predicateAtom.label) || createdItems.has(predicateAtom.label)) ? (
                  <div className="text-right">
                    <span className="text-green-400 text-sm">Créé</span>
                    {ofcAtomsByLabel.has(predicateAtom.label) && (
                      <div className="text-xs text-white/40 font-mono mt-1">
                        {ofcAtomsByLabel.get(predicateAtom.label)?.term_id.slice(0, 10)}...
                      </div>
                    )}
                  </div>
                ) : (
                  isAdmin && (
                    <button
                      onClick={() => onCreateOfcAtom(predicateAtom.label)}
                      disabled={creatingItem !== null}
                      className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 disabled:opacity-50"
                    >
                      {creatingItem === predicateAtom.label ? 'Création...' : 'Créer'}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <h3 className="text-lg font-bold text-purple-400 mb-4">Catégories OFC:</h3>
        <div className="space-y-3">
          {categoryAtoms.map((atom) => {
            const exists = ofcAtomsByLabel.has(atom.label);
            const justCreated = createdItems.has(atom.label);

            return (
              <div
                key={atom.id}
                className={`p-4 rounded-lg border ${
                  exists || justCreated
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-white mb-1 flex items-center gap-2">
                      {atom.emoji} "{atom.label}"
                    </div>
                    <div className="text-sm text-white/60">{atom.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(exists || justCreated) ? (
                      <div className="text-right">
                        <span className="text-green-400 text-sm">Créé</span>
                        {exists && (
                          <div className="text-xs text-white/40 font-mono mt-1">
                            {ofcAtomsByLabel.get(atom.label)?.term_id.slice(0, 10)}...
                          </div>
                        )}
                      </div>
                    ) : (
                      isAdmin && (
                        <button
                          onClick={() => onCreateOfcAtom(atom.label)}
                          disabled={creatingItem !== null}
                          className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 disabled:opacity-50"
                        >
                          {creatingItem === atom.label ? 'Création...' : 'Créer'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="text-sm font-bold text-white/80 mb-2">Instructions</h4>
        <ol className="text-sm text-white/60 space-y-1 list-decimal list-inside">
          <li>Créer d'abord le prédicat <code className="bg-white/10 px-1 rounded">has_category</code></li>
          <li>Créer ensuite les 6 catégories <code className="bg-white/10 px-1 rounded">OFC:*</code></li>
          <li>Une fois créés, les atoms seront utilisés automatiquement dans VotePanel</li>
          <li>Noter les term_id dans <code className="bg-white/10 px-1 rounded">categories.json</code> (optionnel)</li>
        </ol>
      </div>
    </div>
  );
}
