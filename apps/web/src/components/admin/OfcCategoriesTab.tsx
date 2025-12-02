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
  type: 'predicate' | 'category' | 'system';
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
    return <div className="p-6 text-center text-white/60">Chargement des atoms système...</div>;
  }

  const predicateAtoms = ofcAtoms.filter((a) => a.type === 'predicate');
  const systemAtom = ofcAtoms.find((a) => a.type === 'system');
  const categoryAtoms = ofcAtoms.filter((a) => a.type === 'category');

  const existingCount = ofcAtomsByLabel.size;
  const missingCount = ofcAtoms.length - existingCount;

  return (
    <div className="space-y-6">
      {/* Info Box - 3-triple system */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-bold text-blue-400 mb-2">Système 3-Triples:</h3>
        <div className="text-white/70 text-sm space-y-1">
          <p><code className="bg-white/10 px-2 py-1 rounded">Triple 1:</code> [Founder] → [has totem] → [Totem] <span className="text-white/50">(Vote FOR/AGAINST)</span></p>
          <p><code className="bg-white/10 px-2 py-1 rounded">Triple 2:</code> [Totem] → [has category] → [Category] <span className="text-white/50">(Sans préfixe)</span></p>
          <p><code className="bg-white/10 px-2 py-1 rounded">Triple 3:</code> [Category] → [tag category] → [Overmind Founders Collection] <span className="text-white/50">(Marqueur système)</span></p>
        </div>
        <p className="text-white/50 text-xs mt-2">
          Les atoms ci-dessous doivent être créés par l'admin avant utilisation.
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

      {/* Predicates Section */}
      {predicateAtoms.length > 0 && (
        <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">Prédicats système ({predicateAtoms.length})</h3>
          <div className="space-y-3">
            {predicateAtoms.map((atom) => {
              const exists = ofcAtomsByLabel.has(atom.label);
              const justCreated = createdItems.has(atom.label);

              return (
                <div key={atom.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
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
                            className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 disabled:opacity-50"
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
      )}

      {/* System Object Section */}
      {systemAtom && (
        <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <h3 className="text-lg font-bold text-cyan-400 mb-4">Objet système (Triple 3)</h3>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-bold text-white mb-1 flex items-center gap-2">
                  {systemAtom.emoji} "{systemAtom.label}"
                </div>
                <div className="text-sm text-white/60">{systemAtom.description}</div>
              </div>
              <div className="flex items-center gap-3">
                {(ofcAtomsByLabel.has(systemAtom.label) || createdItems.has(systemAtom.label)) ? (
                  <div className="text-right">
                    <span className="text-green-400 text-sm">Créé</span>
                    {ofcAtomsByLabel.has(systemAtom.label) && (
                      <div className="text-xs text-white/40 font-mono mt-1">
                        {ofcAtomsByLabel.get(systemAtom.label)?.term_id.slice(0, 10)}...
                      </div>
                    )}
                  </div>
                ) : (
                  isAdmin && (
                    <button
                      onClick={() => onCreateOfcAtom(systemAtom.label)}
                      disabled={creatingItem !== null}
                      className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 disabled:opacity-50"
                    >
                      {creatingItem === systemAtom.label ? 'Création...' : 'Créer'}
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
        <h3 className="text-lg font-bold text-purple-400 mb-4">Catégories ({categoryAtoms.length})</h3>
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

      {/* TermIds Export - Only show when atoms exist */}
      {ofcAtomsByLabel.size > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <h4 className="text-sm font-bold text-emerald-400 mb-2">Export termIds pour categories.json</h4>
          <p className="text-xs text-white/60 mb-3">Copiez ces valeurs dans <code className="bg-white/10 px-1 rounded">packages/shared/src/data/categories.json</code></p>
          <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto font-mono text-white/80">
{JSON.stringify({
  predicate: {
    termId: ofcAtomsByLabel.get('has category')?.term_id || null
  },
  tagPredicate: {
    termId: ofcAtomsByLabel.get('tag category')?.term_id || null
  },
  systemObject: {
    termId: ofcAtomsByLabel.get('Overmind Founders Collection')?.term_id || null
  },
  categories: [
    { id: 'animal', termId: ofcAtomsByLabel.get('Animal')?.term_id || null },
    { id: 'object', termId: ofcAtomsByLabel.get('Object')?.term_id || null },
    { id: 'trait', termId: ofcAtomsByLabel.get('Trait')?.term_id || null },
    { id: 'concept', termId: ofcAtomsByLabel.get('Concept')?.term_id || null },
    { id: 'element', termId: ofcAtomsByLabel.get('Element')?.term_id || null },
    { id: 'mythology', termId: ofcAtomsByLabel.get('Mythology')?.term_id || null }
  ]
}, null, 2)}
          </pre>
          <button
            onClick={() => {
              const json = JSON.stringify({
                predicate: { termId: ofcAtomsByLabel.get('has category')?.term_id || null },
                tagPredicate: { termId: ofcAtomsByLabel.get('tag category')?.term_id || null },
                systemObject: { termId: ofcAtomsByLabel.get('Overmind Founders Collection')?.term_id || null },
                categories: [
                  { id: 'animal', termId: ofcAtomsByLabel.get('Animal')?.term_id || null },
                  { id: 'object', termId: ofcAtomsByLabel.get('Object')?.term_id || null },
                  { id: 'trait', termId: ofcAtomsByLabel.get('Trait')?.term_id || null },
                  { id: 'concept', termId: ofcAtomsByLabel.get('Concept')?.term_id || null },
                  { id: 'element', termId: ofcAtomsByLabel.get('Element')?.term_id || null },
                  { id: 'mythology', termId: ofcAtomsByLabel.get('Mythology')?.term_id || null }
                ]
              }, null, 2);
              navigator.clipboard.writeText(json);
            }}
            className="mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm hover:bg-emerald-500/30"
          >
            Copier JSON
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="text-sm font-bold text-white/80 mb-2">Instructions (Système 3-Triples)</h4>
        <ol className="text-sm text-white/60 space-y-1 list-decimal list-inside">
          <li>Créer les 2 prédicats : <code className="bg-white/10 px-1 rounded">has category</code> et <code className="bg-white/10 px-1 rounded">tag category</code></li>
          <li>Créer l'objet système : <code className="bg-white/10 px-1 rounded">Overmind Founders Collection</code></li>
          <li>Créer les catégories (sans préfixe) : <code className="bg-white/10 px-1 rounded">Animal</code>, <code className="bg-white/10 px-1 rounded">Object</code>, etc.</li>
          <li><strong className="text-white/80">IMPORTANT:</strong> Mettre à jour les <code className="bg-white/10 px-1 rounded">termId</code> dans <code className="bg-white/10 px-1 rounded">categories.json</code></li>
          <li>Les triples seront créés automatiquement lors des votes dans VotePanel</li>
        </ol>
      </div>
    </div>
  );
}
