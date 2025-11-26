import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAccount } from 'wagmi';
import { GET_ATOMS_BY_LABELS, GET_ALL_TOTEM_CATEGORIES } from '../lib/graphql/queries';
import { useIntuition, getFounderImageUrl } from '../hooks/useIntuition';
import foundersData from '../../../../packages/shared/src/data/founders.json';
import categoriesConfig from '../../../../packages/shared/src/data/categories.json';

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

type TabType = 'founders' | 'predicates' | 'objects' | 'ofc-categories';

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
    ofcCategoryId: 'animal', // Maps to OFC:Animal
    examples: ['Lion', 'Aigle', 'Loup', 'Hibou', 'Renard', 'Dauphin', 'Éléphant', 'Baleine', 'Faucon', 'Cheval', 'Lynx', 'Chouette', 'Perroquet', 'Paon', 'Cygne', 'Tortue']
  },
  {
    id: 'objects',
    name: 'Objets',
    emoji: '⚔️',
    ofcCategoryId: 'objet', // Maps to OFC:Objet
    examples: ['Clé maître', 'Fondation', 'Nœud réseau', 'Pont', 'Mégaphone', 'Boussole', 'Bouclier', 'Cadenas', 'Lampe torche', 'Épée', 'Télescope', 'Radar']
  },
  {
    id: 'traits',
    name: 'Traits de personnalité',
    emoji: '⭐',
    ofcCategoryId: 'trait', // Maps to OFC:Trait
    examples: ['Visionnaire', 'Leader', 'Innovateur', 'Connecteur', 'Protecteur', 'Stratège', 'Builder', 'Pragmatique', 'Créatif', 'Méthodique', 'Analytique']
  },
  {
    id: 'universe',
    name: 'Univers/Énergie',
    emoji: '🌌',
    ofcCategoryId: 'concept', // Maps to OFC:Concept
    examples: ['Ethereum genesis', 'ConsenSys', 'Web3 infrastructure', 'Enterprise blockchain', 'Sécurité crypto', 'DeFi', 'NFTs', 'DAO', 'Gaming', 'Metaverse']
  },
  {
    id: 'superpowers',
    name: 'Superpowers',
    emoji: '⚡',
    ofcCategoryId: 'concept', // Maps to OFC:Concept
    examples: ['Transformation d\'idées en écosystèmes', 'Connexion entre finance traditionnelle et crypto', 'Détection de hacks', 'Scaling opérationnel']
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    ofcCategoryId: 'objet', // Maps to OFC:Objet
    examples: ['Football', 'Basketball', 'Tennis', 'Surf', 'Skateboard', 'Escalade', 'Marathon', 'Boxe', 'MMA', 'Chess']
  }
];

// Get all totem labels from all categories for the query
const ALL_TOTEM_LABELS = TOTEM_CATEGORIES.flatMap((cat) => cat.examples);

// OFC Categories atoms to create (from categories.json)
const OFC_ATOMS = [
  // Predicate first
  {
    id: categoriesConfig.predicate.id,
    label: categoriesConfig.predicate.label,
    description: categoriesConfig.predicate.description,
    emoji: '🔗',
    type: 'predicate' as const,
  },
  // Then all categories
  ...categoriesConfig.categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    description: `Category atom for ${cat.name} totems`,
    emoji: cat.id === 'animal' ? '🦁' : cat.id === 'objet' ? '🔮' : cat.id === 'trait' ? '✨' : cat.id === 'concept' ? '💡' : cat.id === 'element' ? '🔥' : '🐉',
    type: 'category' as const,
  })),
];

export function AdminAuditPage() {
  const founders = foundersData as FounderData[];
  const founderNames = founders.map((f) => f.name);

  const { address } = useAccount();
  const { createAtom, createFounderAtom, getOrCreateAtom, createTriple, isReady } = useIntuition();

  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  const [activeTab, setActiveTab] = useState<TabType>('founders');
  const [creatingItem, setCreatingItem] = useState<string | null>(null);
  const [createdItems, setCreatedItems] = useState<Map<string, { termId: string; txHash: string }>>(new Map());
  const [createError, setCreateError] = useState<string | null>(null);

  // Custom input states
  const [customPredicateLabel, setCustomPredicateLabel] = useState('');
  const [customTotemLabel, setCustomTotemLabel] = useState('');
  const [customTotemCategory, setCustomTotemCategory] = useState('');
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

  /**
   * Create a totem atom AND its category triple [Totem] [has_category] [OFC:Category]
   * This makes the totem available in VotePanel via SUBSCRIBE_TOTEM_CATEGORIES
   */
  const handleCreateTotem = async (label: string, ofcCategoryId: string) => {
    if (!isReady || !isAdmin) return;

    setCreatingItem(label);
    setCreateError(null);

    try {
      // Find the OFC category config
      const categoryConfig = (categoriesConfig as { predicate: { label: string }; categories: Array<{ id: string; label: string }> });
      const category = categoryConfig.categories.find(c => c.id === ofcCategoryId);
      if (!category) {
        throw new Error(`Catégorie OFC invalide: ${ofcCategoryId}`);
      }

      // Step 1: Create or get the totem atom
      console.log(`[Admin] Creating totem atom: ${label}`);
      const totemResult = await getOrCreateAtom(label);
      const totemId = totemResult.termId;
      console.log(`[Admin] Totem atom ID: ${totemId}, created: ${totemResult.created}`);

      // Step 2: Get or create the has_category predicate atom
      console.log(`[Admin] Getting has_category predicate...`);
      const predicateResult = await getOrCreateAtom(categoryConfig.predicate.label);
      const predicateId = predicateResult.termId;
      console.log(`[Admin] has_category predicate ID: ${predicateId}`);

      // Step 3: Get or create the OFC:Category atom
      console.log(`[Admin] Getting ${category.label} atom...`);
      const categoryResult = await getOrCreateAtom(category.label);
      const categoryObjectId = categoryResult.termId;
      console.log(`[Admin] ${category.label} atom ID: ${categoryObjectId}`);

      // Step 4: Create the category triple [Totem] [has_category] [OFC:Category]
      console.log(`[Admin] Creating triple: [${label}] [has_category] [${category.label}]`);
      const tripleResult = await createTriple(totemId, predicateId, categoryObjectId, '0.001'); // Min deposit V2
      console.log(`[Admin] Triple created:`, tripleResult);

      setCreatedItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(label, { termId: totemId, txHash: tripleResult.transactionHash });
        return newMap;
      });

      // Rafraîchir les totems et les triples de catégorie après création
      await Promise.all([refetchTotems(), refetchCategoryTriples()]);
    } catch (err) {
      console.error('[Admin] Error creating totem with category:', err);
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

  // Query OFC atoms (has_category + OFC:* categories)
  const {
    data: ofcAtomsData,
    loading: ofcAtomsLoading,
    refetch: refetchOfcAtoms,
  } = useQuery<{ atoms: Atom[] }>(GET_ATOMS_BY_LABELS, {
    variables: { labels: OFC_ATOMS.map(a => a.label) },
  });

  // Query totems (for ObjectsTab)
  const {
    data: totemsData,
    loading: totemsLoading,
    refetch: refetchTotems,
  } = useQuery<{ atoms: Atom[] }>(GET_ATOMS_BY_LABELS, {
    variables: { labels: ALL_TOTEM_LABELS },
  });

  // Query existing category triples to know which totems already have a category
  const {
    data: categoryTriplesData,
    loading: categoryTriplesLoading,
    refetch: refetchCategoryTriples,
  } = useQuery<{
    triples: Array<{
      term_id: string;
      subject: { term_id: string; label: string };
      object: { term_id: string; label: string };
    }>;
  }>(GET_ALL_TOTEM_CATEGORIES);

  // Map of totem label -> category label (e.g., "Lion" -> "OFC:Animal")
  const totemCategoryMap = new Map<string, string>();
  categoryTriplesData?.triples.forEach((triple) => {
    totemCategoryMap.set(triple.subject.label, triple.object.label);
  });

  const atomsByLabel = new Map<string, Atom>();
  atomsData?.atoms.forEach((atom) => {
    atomsByLabel.set(atom.label, atom);
  });

  const predicatesByLabel = new Map<string, Atom>();
  predicatesData?.atoms.forEach((atom) => {
    predicatesByLabel.set(atom.label, atom);
  });

  const ofcAtomsByLabel = new Map<string, Atom>();
  ofcAtomsData?.atoms.forEach((atom) => {
    ofcAtomsByLabel.set(atom.label, atom);
  });

  const totemsByLabel = new Map<string, Atom>();
  totemsData?.atoms.forEach((atom) => {
    totemsByLabel.set(atom.label, atom);
  });

  const existingCount = atomsByLabel.size;
  const missingCount = founders.length - existingCount;

  const existingPredicatesCount = predicatesByLabel.size;
  const existingOfcAtomsCount = ofcAtomsByLabel.size;
  const existingTotemsCount = totemsByLabel.size;

  // Handler for creating OFC atoms
  const handleCreateOfcAtom = async (label: string) => {
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

      // Refresh OFC atoms after creation
      await refetchOfcAtoms();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'atom OFC');
    } finally {
      setCreatingItem(null);
    }
  };

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
            ⚡ Objets/Totems ({existingTotemsCount}/{ALL_TOTEM_LABELS.length})
          </button>
          <button
            onClick={() => setActiveTab('ofc-categories')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'ofc-categories'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            🏷️ OFC: Catégories ({existingOfcAtomsCount}/{OFC_ATOMS.length})
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
            totemsByLabel={totemsByLabel}
            totemsLoading={totemsLoading}
            createdItems={createdItems}
            creatingItem={creatingItem}
            isAdmin={isAdmin}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            customTotemLabel={customTotemLabel}
            setCustomTotemLabel={setCustomTotemLabel}
            customTotemCategory={customTotemCategory}
            setCustomTotemCategory={setCustomTotemCategory}
            totemCategoryMap={totemCategoryMap}
            categoryTriplesLoading={categoryTriplesLoading}
            onCreateTotem={handleCreateTotem}
          />
        )}

        {activeTab === 'ofc-categories' && (
          <OfcCategoriesTab
            ofcAtoms={OFC_ATOMS}
            ofcAtomsByLabel={ofcAtomsByLabel}
            createdItems={createdItems}
            creatingItem={creatingItem}
            isAdmin={isAdmin}
            ofcAtomsLoading={ofcAtomsLoading}
            onCreateOfcAtom={handleCreateOfcAtom}
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
}: {
  categories: Array<{ id: string; name: string; emoji: string; ofcCategoryId: string; examples: string[] }>;
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
}) {
  const activeCategory = categories.find((c) => c.id === selectedCategory);

  // Count stats for totems
  // Complete = atom exists + category triple exists
  // Atom only = atom exists but no category triple
  // Missing = nothing exists
  const completeCount = ALL_TOTEM_LABELS.filter(
    (label) => totemsByLabel.has(label) && totemCategoryMap.has(label)
  ).length;
  const atomOnlyCount = ALL_TOTEM_LABELS.filter(
    (label) => totemsByLabel.has(label) && !totemCategoryMap.has(label)
  ).length;
  const missingCount = ALL_TOTEM_LABELS.length - totemsByLabel.size;

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
          <div className="text-2xl font-bold text-blue-400">{ALL_TOTEM_LABELS.length}</div>
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

function OfcCategoriesTab({
  ofcAtoms,
  ofcAtomsByLabel,
  createdItems,
  creatingItem,
  isAdmin,
  ofcAtomsLoading,
  onCreateOfcAtom,
}: {
  ofcAtoms: Array<{ id: string; label: string; description: string; emoji: string; type: 'predicate' | 'category' }>;
  ofcAtomsByLabel: Map<string, Atom>;
  createdItems: Map<string, { termId: string; txHash: string }>;
  creatingItem: string | null;
  isAdmin: boolean;
  ofcAtomsLoading: boolean;
  onCreateOfcAtom: (label: string) => void;
}) {
  if (ofcAtomsLoading) {
    return <div className="p-6 text-center text-white/60">⏳ Chargement des atoms OFC...</div>;
  }

  const predicateAtom = ofcAtoms.find((a) => a.type === 'predicate');
  const categoryAtoms = ofcAtoms.filter((a) => a.type === 'category');

  const existingCount = ofcAtomsByLabel.size;
  const missingCount = ofcAtoms.length - existingCount;

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-bold text-blue-400 mb-2">ℹ️ Système de Catégories OFC:</h3>
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
          <h4 className="text-sm font-bold text-orange-400 mb-2">🔍 Debug - Comparaison labels</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-white/60 mb-1">Labels attendus ({ofcAtoms.length}):</p>
              <ul className="text-white/80 font-mono space-y-0.5">
                {ofcAtoms.map((a) => (
                  <li key={a.id} className={ofcAtomsByLabel.has(a.label) ? 'text-green-400' : 'text-red-400'}>
                    "{a.label}" {ofcAtomsByLabel.has(a.label) ? '✅' : '❌'}
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
          <h3 className="text-lg font-bold text-yellow-400 mb-4">🔗 Prédicat has_category</h3>
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
                    <span className="text-green-400 text-sm">✅ Créé</span>
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
                      {creatingItem === predicateAtom.label ? '⏳ Création...' : '🚀 Créer'}
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
        <h3 className="text-lg font-bold text-purple-400 mb-4">🏷️ Catégories OFC:</h3>
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
                        <span className="text-green-400 text-sm">✅ Créé</span>
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
                          {creatingItem === atom.label ? '⏳ Création...' : '🚀 Créer'}
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
        <h4 className="text-sm font-bold text-white/80 mb-2">📋 Instructions</h4>
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
