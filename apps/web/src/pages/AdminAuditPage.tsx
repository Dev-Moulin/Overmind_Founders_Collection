import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAccount } from 'wagmi';
import { GET_ATOMS_BY_LABELS } from '../lib/graphql/queries';
import { useIntuition, getFounderImageUrl } from '../hooks/useIntuition';
import foundersData from '../../../../packages/shared/src/data/founders.json';

const ADMIN_WALLET = '0xefc86f5fabe767daac9358d0ba2dfd9ac7d29948';

interface Atom {
  term_id: string;
  label: string;
  image?: string;
  emoji?: string;
  type?: string;
}

interface FounderData {
  id: string;
  name: string;
  shortBio: string;
  fullBio?: string;
  twitter: string | null;
  linkedin?: string | null;
  github?: string | null;
  image?: string;
}

/**
 * Get the image source type for display
 */
function getImageSource(founder: FounderData): string {
  if (founder.image) return 'Manuel';
  if (founder.twitter) return 'Twitter';
  if (founder.github) return 'GitHub';
  return 'DiceBear (généré)';
}

type TabType = 'founders' | 'predicates' | 'objects';

// Liste des 6 prédicats à créer
const PREDICATES = [
  { label: 'is represented by', description: 'X est représenté par Y' },
  { label: 'has totem', description: 'X a pour totem Y' },
  { label: 'is symbolized by', description: 'X est symbolisé par Y' },
  { label: 'embodies', description: 'X incarne Y' },
  { label: 'channels', description: 'X canalise Y' },
  { label: 'resonates with', description: 'X résonne avec Y' },
];

// Catégories de totems/objets
const TOTEM_CATEGORIES = [
  {
    id: 'animals',
    name: 'Animaux',
    emoji: '🦁',
    examples: ['Lion', 'Aigle', 'Loup', 'Hibou', 'Renard', 'Dauphin', 'Éléphant', 'Baleine', 'Faucon', 'Cheval', 'Lynx', 'Chouette', 'Perroquet', 'Paon', 'Cygne', 'Tortue']
  },
  {
    id: 'objects',
    name: 'Objets',
    emoji: '⚔️',
    examples: ['Clé maître', 'Fondation', 'Nœud réseau', 'Pont', 'Mégaphone', 'Boussole', 'Bouclier', 'Cadenas', 'Lampe torche', 'Épée', 'Télescope', 'Radar']
  },
  {
    id: 'traits',
    name: 'Traits de personnalité',
    emoji: '⭐',
    examples: ['Visionnaire', 'Leader', 'Innovateur', 'Connecteur', 'Protecteur', 'Stratège', 'Builder', 'Pragmatique', 'Créatif', 'Méthodique', 'Analytique']
  },
  {
    id: 'universe',
    name: 'Univers/Énergie',
    emoji: '🌌',
    examples: ['Ethereum genesis', 'ConsenSys', 'Web3 infrastructure', 'Enterprise blockchain', 'Sécurité crypto', 'DeFi', 'NFTs', 'DAO', 'Gaming', 'Metaverse']
  },
  {
    id: 'superpowers',
    name: 'Superpowers',
    emoji: '⚡',
    examples: ['Transformation d\'idées en écosystèmes', 'Connexion entre finance traditionnelle et crypto', 'Détection de hacks', 'Scaling opérationnel']
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    examples: ['Football', 'Basketball', 'Tennis', 'Surf', 'Skateboard', 'Escalade', 'Marathon', 'Boxe', 'MMA', 'Chess']
  }
];

export function AdminAuditPage() {
  const founders = foundersData as FounderData[];
  const founderNames = founders.map((f) => f.name);

  const { address } = useAccount();
  const { createAtom, createFounderAtom, isReady } = useIntuition();

  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  const [activeTab, setActiveTab] = useState<TabType>('founders');
  const [creatingItem, setCreatingItem] = useState<string | null>(null);
  const [createdItems, setCreatedItems] = useState<Map<string, { termId: string; txHash: string }>>(new Map());
  const [createError, setCreateError] = useState<string | null>(null);

  // Custom input states
  const [customPredicateLabel, setCustomPredicateLabel] = useState('');
  const [customTotemLabel, setCustomTotemLabel] = useState('');
  const [customTotemDescription, setCustomTotemDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('animals');

  const handleCreateFounderAtom = async (founder: FounderData) => {
    if (!isReady || !isAdmin) return;

    setCreatingItem(founder.name);
    setCreateError(null);

    try {
      const result = await createFounderAtom({
        name: founder.name,
        shortBio: founder.shortBio,
        fullBio: founder.fullBio,
        twitter: founder.twitter,
        linkedin: founder.linkedin,
        github: founder.github,
        image: founder.image,
      });
      setCreatedItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(founder.name, { termId: result.termId, txHash: result.transactionHash });
        return newMap;
      });

      // Rafraîchir les données GraphQL après création
      await refetchAtoms();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreatingItem(null);
    }
  };

  const handleCreatePredicate = async (label: string) => {
    if (!isReady || !isAdmin) return;

    setCreatingItem(label);
    setCreateError(null);

    try {
      const result = await createAtom(label);
      setCreatedItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(label, { termId: result.termId, txHash: result.transactionHash });
        return newMap;
      });

      // Rafraîchir les prédicats après création
      await refetchPredicates();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur lors de la création du prédicat');
    } finally {
      setCreatingItem(null);
    }
  };

  const handleCreateTotem = async (label: string, description?: string) => {
    if (!isReady || !isAdmin) return;

    setCreatingItem(label);
    setCreateError(null);

    try {
      const result = await createAtom(description ? `${label}: ${description}` : label);
      setCreatedItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(label, { termId: result.termId, txHash: result.transactionHash });
        return newMap;
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'objet');
    } finally {
      setCreatingItem(null);
    }
  };

  // Query atoms matching founder names
  const {
    data: atomsData,
    loading: atomsLoading,
    error: atomsError,
    refetch: refetchAtoms,
  } = useQuery<{ atoms: Atom[] }>(GET_ATOMS_BY_LABELS, {
    variables: { labels: founderNames },
  });

  // Query predicates
  const {
    data: predicatesData,
    loading: predicatesLoading,
    refetch: refetchPredicates,
  } = useQuery<{ atoms: Atom[] }>(GET_ATOMS_BY_LABELS, {
    variables: { labels: PREDICATES.map(p => p.label) },
  });

  const atomsByLabel = new Map<string, Atom>();
  atomsData?.atoms.forEach((atom) => {
    atomsByLabel.set(atom.label, atom);
  });

  const predicatesByLabel = new Map<string, Atom>();
  predicatesData?.atoms.forEach((atom) => {
    predicatesByLabel.set(atom.label, atom);
  });

  const existingCount = atomsByLabel.size;
  const missingCount = founders.length - existingCount;

  const existingPredicatesCount = predicatesByLabel.size;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-red-400">🚫 Accès Refusé</h1>
          <p className="text-white/70">
            Cette page est réservée à l'administrateur du projet.
          </p>
          <p className="text-white/50 mt-2">Wallet admin : {ADMIN_WALLET}</p>
          <p className="text-white/50">Votre wallet : {address || 'Non connecté'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🔧 Admin - Gestion des Atoms INTUITION</h1>
            <p className="text-white/60 mt-1">
              Créer les fondateurs, prédicats et objets sur INTUITION Testnet
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('founders')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'founders'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            👤 Fondateurs ({existingCount}/{founders.length})
          </button>
          <button
            onClick={() => setActiveTab('predicates')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'predicates'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            🔗 Prédicats ({existingPredicatesCount}/{PREDICATES.length})
          </button>
          <button
            onClick={() => setActiveTab('objects')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'objects'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            ⚡ Objets/Totems
          </button>
        </div>

        {/* Error Message */}
        {createError && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{createError}</p>
          </div>
        )}

        {/* Created Items Success */}
        {createdItems.size > 0 && (
          <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h2 className="text-xl font-bold text-green-400 mb-4">
              ✅ Atoms créés cette session ({createdItems.size})
            </h2>
            <div className="space-y-2">
              {Array.from(createdItems.entries()).map(([name, data]) => (
                <div key={name} className="p-3 bg-white/5 rounded flex justify-between items-center">
                  <span className="text-white font-medium">{name}</span>
                  <a
                    href={`https://testnet.explorer.intuition.systems/tx/${data.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    Voir TX →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'founders' && (
          <FoundersTab
            founders={founders}
            atomsByLabel={atomsByLabel}
            createdItems={createdItems}
            creatingItem={creatingItem}
            isAdmin={isAdmin}
            atomsLoading={atomsLoading}
            atomsError={atomsError}
            existingCount={existingCount}
            missingCount={missingCount}
            onCreateAtom={handleCreateFounderAtom}
          />
        )}

        {activeTab === 'predicates' && (
          <PredicatesTab
            predicates={PREDICATES}
            predicatesByLabel={predicatesByLabel}
            createdItems={createdItems}
            creatingItem={creatingItem}
            isAdmin={isAdmin}
            predicatesLoading={predicatesLoading}
            customPredicateLabel={customPredicateLabel}
            setCustomPredicateLabel={setCustomPredicateLabel}
            onCreatePredicate={handleCreatePredicate}
          />
        )}

        {activeTab === 'objects' && (
          <ObjectsTab
            categories={TOTEM_CATEGORIES}
            createdItems={createdItems}
            creatingItem={creatingItem}
            isAdmin={isAdmin}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            customTotemLabel={customTotemLabel}
            setCustomTotemLabel={setCustomTotemLabel}
            customTotemDescription={customTotemDescription}
            setCustomTotemDescription={setCustomTotemDescription}
            onCreateTotem={handleCreateTotem}
          />
        )}
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function FoundersTab({
  founders,
  atomsByLabel,
  createdItems,
  creatingItem,
  isAdmin,
  atomsLoading,
  atomsError,
  existingCount,
  missingCount,
  onCreateAtom,
}: {
  founders: FounderData[];
  atomsByLabel: Map<string, Atom>;
  createdItems: Map<string, { termId: string; txHash: string }>;
  creatingItem: string | null;
  isAdmin: boolean;
  atomsLoading: boolean;
  atomsError: any;
  existingCount: number;
  missingCount: number;
  onCreateAtom: (founder: FounderData) => void;
}) {
  if (atomsLoading) {
    return <div className="p-6 text-center text-white/60">⏳ Chargement des atoms...</div>;
  }

  if (atomsError) {
    return (
      <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg">
        <p className="text-red-400">❌ Erreur GraphQL : {atomsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{founders.length}</div>
          <div className="text-sm text-white/60">Total fondateurs</div>
        </div>
      </div>

      {/* Existing Atoms Table */}
      {existingCount > 0 && (
        <div className="p-6 bg-white/5 rounded-lg border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">
            ✅ Fondateurs avec Atoms ({existingCount})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-2 text-white/60">#</th>
                  <th className="pb-2 text-white/60">Nom</th>
                  <th className="pb-2 text-white/60">Term ID</th>
                  <th className="pb-2 text-white/60">Type</th>
                </tr>
              </thead>
              <tbody>
                {founders
                  .filter((f) => atomsByLabel.has(f.name))
                  .map((founder, index) => {
                    const atom = atomsByLabel.get(founder.name)!;
                    return (
                      <tr key={founder.id} className="border-b border-white/5">
                        <td className="py-2 text-white/40">{index + 1}</td>
                        <td className="py-2 text-white font-medium">{founder.name}</td>
                        <td className="py-2 text-purple-400 text-sm font-mono">
                          {atom.term_id.slice(0, 10)}...
                        </td>
                        <td className="py-2 text-white/60">{atom.type || 'Thing'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Missing Founders */}
      {missingCount > 0 && (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h2 className="text-xl font-bold text-red-400 mb-4">
            ❌ Fondateurs sans Atom ({missingCount})
          </h2>
          <div className="space-y-4">
            {founders
              .filter((f) => !atomsByLabel.has(f.name) && !createdItems.has(f.name))
              .map((founder) => {
                const atomUrl = founder.twitter
                  ? `https://twitter.com/${founder.twitter.replace('@', '')}`
                  : founder.linkedin || null;

                const atomImage = getFounderImageUrl(founder);
                const imageSource = getImageSource(founder);

                return (
                  <div
                    key={founder.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={atomImage}
                          alt={founder.name}
                          className="w-12 h-12 rounded-full object-cover bg-white/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
                          }}
                        />
                        <div>
                          <div className="font-bold text-white text-lg">{founder.name}</div>
                          <div className="text-xs text-white/40">Image: {imageSource}</div>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => onCreateAtom(founder)}
                          disabled={creatingItem !== null}
                          className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creatingItem === founder.name ? '⏳ Création...' : '🚀 Créer Atom'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-white/50">Name:</span>
                        <span className="text-white">{founder.name}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-white/50">Description:</span>
                        <span className="text-white/80 text-xs">{founder.fullBio || founder.shortBio}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-white/50">URL:</span>
                        {atomUrl ? (
                          <a
                            href={atomUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 truncate"
                          >
                            {atomUrl}
                          </a>
                        ) : (
                          <span className="text-white/30 italic">Aucune URL</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function PredicatesTab({
  predicates,
  predicatesByLabel,
  createdItems,
  creatingItem,
  isAdmin,
  predicatesLoading,
  customPredicateLabel,
  setCustomPredicateLabel,
  onCreatePredicate,
}: {
  predicates: Array<{ label: string; description: string }>;
  predicatesByLabel: Map<string, Atom>;
  createdItems: Map<string, { termId: string; txHash: string }>;
  creatingItem: string | null;
  isAdmin: boolean;
  predicatesLoading: boolean;
  customPredicateLabel: string;
  setCustomPredicateLabel: (value: string) => void;
  onCreatePredicate: (label: string) => void;
}) {
  if (predicatesLoading) {
    return <div className="p-6 text-center text-white/60">⏳ Chargement des prédicats...</div>;
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
                    <span className="text-green-400 text-sm">✅ Créé</span>
                  )}
                  {!exists && !justCreated && isAdmin && (
                    <button
                      onClick={() => onCreatePredicate(predicate.label)}
                      disabled={creatingItem !== null}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 disabled:opacity-50"
                    >
                      {creatingItem === predicate.label ? '⏳ Création...' : '🚀 Créer'}
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
        <h3 className="text-lg font-bold text-blue-400 mb-4">➕ Créer un prédicat personnalisé</h3>
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
            🚀 Créer
          </button>
        </div>
      </div>
    </div>
  );
}

function ObjectsTab({
  categories,
  createdItems,
  creatingItem,
  isAdmin,
  selectedCategory,
  setSelectedCategory,
  customTotemLabel,
  setCustomTotemLabel,
  customTotemDescription,
  setCustomTotemDescription,
  onCreateTotem,
}: {
  categories: Array<{ id: string; name: string; emoji: string; examples: string[] }>;
  createdItems: Map<string, { termId: string; txHash: string }>;
  creatingItem: string | null;
  isAdmin: boolean;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  customTotemLabel: string;
  setCustomTotemLabel: (value: string) => void;
  customTotemDescription: string;
  setCustomTotemDescription: (value: string) => void;
  onCreateTotem: (label: string, description?: string) => void;
}) {
  const activeCategory = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Selector */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-400'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            {category.emoji} {category.name}
          </button>
        ))}
      </div>

      {/* Category Examples */}
      {activeCategory && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4">
            {activeCategory.emoji} {activeCategory.name} - Exemples
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeCategory.examples.map((example) => {
              const justCreated = createdItems.has(example);

              return (
                <div
                  key={example}
                  className={`p-3 rounded border text-center ${
                    justCreated
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="text-white font-medium mb-2">{example}</div>
                  {justCreated ? (
                    <span className="text-xs text-green-400">✅ Créé</span>
                  ) : (
                    <button
                      onClick={() => onCreateTotem(example)}
                      disabled={creatingItem !== null || !isAdmin}
                      className="w-full px-3 py-1 text-sm bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 disabled:opacity-50"
                    >
                      {creatingItem === example ? '⏳' : '🚀 Créer'}
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
        <h3 className="text-lg font-bold text-blue-400 mb-4">➕ Créer un objet/totem personnalisé</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={customTotemLabel}
            onChange={(e) => setCustomTotemLabel(e.target.value)}
            placeholder="Nom du totem (ex: 'Phoenix')"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40"
          />
          <input
            type="text"
            value={customTotemDescription}
            onChange={(e) => setCustomTotemDescription(e.target.value)}
            placeholder="Description (optionnel)"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40"
          />
          <button
            onClick={() => {
              if (customTotemLabel.trim()) {
                onCreateTotem(customTotemLabel.trim(), customTotemDescription.trim() || undefined);
                setCustomTotemLabel('');
                setCustomTotemDescription('');
              }
            }}
            disabled={!customTotemLabel.trim() || creatingItem !== null}
            className="w-full px-6 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50"
          >
            🚀 Créer
          </button>
        </div>
      </div>
    </div>
  );
}
