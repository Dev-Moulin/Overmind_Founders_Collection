interface Atom {
  term_id: string;
  label: string;
  image?: string;
  emoji?: string;
  type?: string;
}

interface TotemCategory {
  id: string;
  name: string;
  emoji: string;
  ofcCategoryId: string;
  examples: string[];
}

interface ObjectsTabProps {
  categories: TotemCategory[];
  totemsByLabel: Map<string, Atom>;
  totemsLoading: boolean;
  createdItems: Map<string, { termId: string; txHash: string }>;
  creatingItem: string | null;
  isAdmin: boolean;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  customTotemLabel: string;
  setCustomTotemLabel: (value: string) => void;
  customTotemCategory: string;
  setCustomTotemCategory: (value: string) => void;
  totemCategoryMap: Map<string, string>;
  categoryTriplesLoading: boolean;
  onCreateTotem: (label: string, ofcCategoryId: string) => void;
  allTotemLabels: string[];
}

export function ObjectsTab({
  categories,
  totemsByLabel,
  totemsLoading,
  createdItems,
  creatingItem,
  isAdmin,
  selectedCategory,
  setSelectedCategory,
  customTotemLabel,
  setCustomTotemLabel,
  customTotemCategory,
  setCustomTotemCategory,
  totemCategoryMap,
  categoryTriplesLoading,
  onCreateTotem,
  allTotemLabels,
}: ObjectsTabProps) {
  const activeCategory = categories.find((c) => c.id === selectedCategory);

  // Count stats for totems
  // Complete = atom exists + category triple exists
  // Atom only = atom exists but no category triple
  // Missing = nothing exists
  const completeCount = allTotemLabels.filter(
    (label) => totemsByLabel.has(label) && totemCategoryMap.has(label)
  ).length;
  const atomOnlyCount = allTotemLabels.filter(
    (label) => totemsByLabel.has(label) && !totemCategoryMap.has(label)
  ).length;
  const missingCount = allTotemLabels.length - totemsByLabel.size;

  // Count for active category
  const activeCategoryCompleteCount = activeCategory
    ? activeCategory.examples.filter((e) => totemsByLabel.has(e) && totemCategoryMap.has(e)).length
    : 0;

  if (totemsLoading || categoryTriplesLoading) {
    return <div className="p-6 text-center text-white/60">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{completeCount}</div>
          <div className="text-sm text-white/60">Complets (atom + catégorie)</div>
        </div>
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="text-2xl font-bold text-orange-400">{atomOnlyCount}</div>
          <div className="text-sm text-white/60">Atom seul (sans catégorie)</div>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-2xl font-bold text-red-400">{missingCount}</div>
          <div className="text-sm text-white/60">Manquants</div>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{allTotemLabels.length}</div>
          <div className="text-sm text-white/60">Total exemples</div>
        </div>
      </div>

      {/* Info box for atom-only totems */}
      {atomOnlyCount > 0 && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p className="text-orange-300 text-sm">
            <strong>{atomOnlyCount} totems</strong> existent sur la blockchain mais n'ont pas de triple de catégorie.
            Cliquez sur "Ajouter catégorie" pour créer le triple <code className="bg-white/10 px-1 rounded">[Totem] [has_category] [OFC:*]</code>
          </p>
        </div>
      )}

      {/* Category Selector */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => {
          const categoryCompleteCount = category.examples.filter(
            (e) => totemsByLabel.has(e) && totemCategoryMap.has(e)
          ).length;
          const categoryAtomOnlyCount = category.examples.filter(
            (e) => totemsByLabel.has(e) && !totemCategoryMap.has(e)
          ).length;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-400'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              {category.emoji} {category.name} ({categoryCompleteCount}
              {categoryAtomOnlyCount > 0 && <span className="text-orange-400">+{categoryAtomOnlyCount}</span>}
              /{category.examples.length})
            </button>
          );
        })}
      </div>

      {/* Category Examples */}
      {activeCategory && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4">
            {activeCategory.emoji} {activeCategory.name} ({activeCategoryCompleteCount}/{activeCategory.examples.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeCategory.examples.map((example) => {
              const existsOnChain = totemsByLabel.has(example);
              const hasCategory = totemCategoryMap.has(example);
              const justCreated = createdItems.has(example);

              // 3 states:
              // 1. Complete (green): atom + category triple
              // 2. Atom only (orange): atom exists but no category triple
              // 3. Missing (white): nothing exists

              const isComplete = existsOnChain && hasCategory;
              const isAtomOnly = existsOnChain && !hasCategory;

              return (
                <div
                  key={example}
                  className={`p-3 rounded border text-center ${
                    isComplete || justCreated
                      ? 'bg-green-500/10 border-green-500/30'
                      : isAtomOnly
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="text-white font-medium mb-2">{example}</div>
                  {isComplete ? (
                    <div>
                      <span className="text-xs text-green-400">Complet</span>
                      <div className="text-xs text-white/40 mt-1">
                        {totemCategoryMap.get(example)?.replace('OFC:', '')}
                      </div>
                    </div>
                  ) : isAtomOnly ? (
                    <div>
                      <span className="text-xs text-orange-400 block mb-1">Atom seul</span>
                      <button
                        onClick={() => onCreateTotem(example, activeCategory.ofcCategoryId)}
                        disabled={creatingItem !== null || !isAdmin}
                        className="w-full px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 disabled:opacity-50"
                      >
                        {creatingItem === example ? 'Création...' : '+ Ajouter catégorie'}
                      </button>
                    </div>
                  ) : justCreated ? (
                    <span className="text-xs text-green-400">Créé cette session</span>
                  ) : (
                    <button
                      onClick={() => onCreateTotem(example, activeCategory.ofcCategoryId)}
                      disabled={creatingItem !== null || !isAdmin}
                      className="w-full px-3 py-1 text-sm bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 disabled:opacity-50"
                    >
                      {creatingItem === example ? 'Création...' : 'Créer'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Totem */}
      <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-bold text-blue-400 mb-4">Créer un objet/totem personnalisé</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={customTotemLabel}
            onChange={(e) => setCustomTotemLabel(e.target.value)}
            placeholder="Nom du totem (ex: 'Phoenix')"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40"
          />
          {/* Category selector for custom totem */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Catégorie OFC:</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCustomTotemCategory(cat.ofcCategoryId)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    customTotemCategory === cat.ofcCategoryId
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              if (customTotemLabel.trim() && customTotemCategory) {
                onCreateTotem(customTotemLabel.trim(), customTotemCategory);
                setCustomTotemLabel('');
                setCustomTotemCategory('');
              }
            }}
            disabled={!customTotemLabel.trim() || !customTotemCategory || creatingItem !== null}
            className="w-full px-6 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
