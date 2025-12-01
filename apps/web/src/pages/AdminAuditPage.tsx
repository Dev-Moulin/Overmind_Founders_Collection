import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ADMIN_WALLET } from '../config/constants';
import { useAdminAtoms } from '../hooks/useAdminAtoms';
import { useAdminActions } from '../hooks/useAdminActions';
import {
  FoundersTab,
  PredicatesTab,
  ObjectsTab,
  OfcCategoriesTab,
  AccessDenied,
  AdminHeader,
  AdminTabs,
  ErrorMessage,
  CreatedItemsList,
  type TabType,
  type TabConfig,
} from '../components/admin';
import foundersData from '../../../../packages/shared/src/data/founders.json';
import categoriesConfig from '../../../../packages/shared/src/data/categories.json';

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
    ofcCategoryId: 'animal',
    examples: ['Lion', 'Eagle', 'Wolf', 'Owl', 'Fox', 'Dolphin', 'Elephant', 'Whale', 'Falcon', 'Horse', 'Lynx', 'Nightingale', 'Parrot', 'Peacock', 'Swan', 'Turtle'],
  },
  {
    id: 'objects',
    name: 'Objets',
    emoji: '⚔️',
    ofcCategoryId: 'objet',
    examples: ['Master key', 'Foundation', 'Network node', 'Bridge', 'Megaphone', 'Compass', 'Shield', 'Padlock', 'Flashlight', 'Sword', 'Telescope', 'Radar'],
  },
  {
    id: 'traits',
    name: 'Traits de personnalité',
    emoji: '⭐',
    ofcCategoryId: 'trait',
    examples: ['Visionary', 'Leader', 'Innovator', 'Connector', 'Protector', 'Strategist', 'Builder', 'Pragmatic', 'Creative', 'Methodical', 'Analytical'],
  },
  {
    id: 'universe',
    name: 'Univers/Énergie',
    emoji: '🌌',
    ofcCategoryId: 'concept',
    examples: ['Ethereum genesis', 'ConsenSys', 'Web3 infrastructure', 'Enterprise blockchain', 'Crypto security', 'DeFi', 'NFTs', 'DAO', 'Gaming', 'Metaverse'],
  },
  {
    id: 'superpowers',
    name: 'Superpowers',
    emoji: '⚡',
    ofcCategoryId: 'concept',
    examples: ['Idea to ecosystem transformation', 'Traditional finance to crypto bridge', 'Hack detection', 'Operational scaling'],
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    ofcCategoryId: 'objet',
    examples: ['Football', 'Basketball', 'Tennis', 'Surf', 'Skateboard', 'Escalade', 'Marathon', 'Boxe', 'MMA', 'Chess'],
  },
];

const ALL_TOTEM_LABELS = TOTEM_CATEGORIES.flatMap((cat) => cat.examples);

const OFC_ATOMS = [
  {
    id: (categoriesConfig as { predicate: { id: string } }).predicate.id,
    label: (categoriesConfig as { predicate: { label: string } }).predicate.label,
    description: (categoriesConfig as { predicate: { description: string } }).predicate.description,
    emoji: '🔗',
    type: 'predicate' as const,
  },
  ...(categoriesConfig as { categories: Array<{ id: string; label: string; name: string }> }).categories.map((cat) => ({
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
  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  const [activeTab, setActiveTab] = useState<TabType>('founders');
  const [customPredicateLabel, setCustomPredicateLabel] = useState('');
  const [customTotemLabel, setCustomTotemLabel] = useState('');
  const [customTotemCategory, setCustomTotemCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('animals');

  // Atoms data hook
  const atoms = useAdminAtoms({
    founderNames,
    predicateLabels: PREDICATES.map((p) => p.label),
    ofcAtomLabels: OFC_ATOMS.map((a) => a.label),
    totemLabels: ALL_TOTEM_LABELS,
  });

  // Actions hook
  const actions = useAdminActions({
    isAdmin,
    categoriesConfig: categoriesConfig as { predicate: { label: string }; categories: Array<{ id: string; label: string }> },
    refetchAtoms: atoms.refetchAtoms,
    refetchPredicates: atoms.refetchPredicates,
    refetchOfcAtoms: atoms.refetchOfcAtoms,
    refetchTotems: atoms.refetchTotems,
    refetchCategoryTriples: atoms.refetchCategoryTriples,
  });

  // Counts
  const existingCount = atoms.atomsByLabel.size;
  const missingCount = founders.length - existingCount;

  // Tabs config
  const tabs: TabConfig[] = [
    { id: 'founders', label: 'Fondateurs', count: existingCount, total: founders.length },
    { id: 'predicates', label: 'Prédicats', count: atoms.predicatesByLabel.size, total: PREDICATES.length },
    { id: 'objects', label: 'Objets/Totems', count: atoms.totemsByLabel.size, total: ALL_TOTEM_LABELS.length },
    { id: 'ofc-categories', label: 'OFC: Catégories', count: atoms.ofcAtomsByLabel.size, total: OFC_ATOMS.length },
  ];

  if (!isAdmin) {
    return <AccessDenied adminWallet={ADMIN_WALLET} userAddress={address} />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminHeader />
        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

        {actions.createError && <ErrorMessage message={actions.createError} />}
        <CreatedItemsList createdItems={actions.createdItems} />

        {activeTab === 'founders' && (
          <FoundersTab
            founders={founders}
            atomsByLabel={atoms.atomsByLabel}
            createdItems={actions.createdItems}
            creatingItem={actions.creatingItem}
            isAdmin={isAdmin}
            atomsLoading={atoms.atomsLoading}
            atomsError={atoms.atomsError}
            existingCount={existingCount}
            missingCount={missingCount}
            onCreateAtom={actions.handleCreateFounderAtom}
          />
        )}

        {activeTab === 'predicates' && (
          <PredicatesTab
            predicates={PREDICATES}
            predicatesByLabel={atoms.predicatesByLabel}
            createdItems={actions.createdItems}
            creatingItem={actions.creatingItem}
            isAdmin={isAdmin}
            predicatesLoading={atoms.predicatesLoading}
            customPredicateLabel={customPredicateLabel}
            setCustomPredicateLabel={setCustomPredicateLabel}
            onCreatePredicate={actions.handleCreatePredicate}
          />
        )}

        {activeTab === 'objects' && (
          <ObjectsTab
            categories={TOTEM_CATEGORIES}
            totemsByLabel={atoms.totemsByLabel}
            totemsLoading={atoms.totemsLoading}
            createdItems={actions.createdItems}
            creatingItem={actions.creatingItem}
            isAdmin={isAdmin}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            customTotemLabel={customTotemLabel}
            setCustomTotemLabel={setCustomTotemLabel}
            customTotemCategory={customTotemCategory}
            setCustomTotemCategory={setCustomTotemCategory}
            totemCategoryMap={atoms.totemCategoryMap}
            categoryTriplesLoading={atoms.categoryTriplesLoading}
            onCreateTotem={actions.handleCreateTotem}
            allTotemLabels={ALL_TOTEM_LABELS}
          />
        )}

        {activeTab === 'ofc-categories' && (
          <OfcCategoriesTab
            ofcAtoms={OFC_ATOMS}
            ofcAtomsByLabel={atoms.ofcAtomsByLabel}
            createdItems={actions.createdItems}
            creatingItem={actions.creatingItem}
            isAdmin={isAdmin}
            ofcAtomsLoading={atoms.ofcAtomsLoading}
            onCreateOfcAtom={actions.handleCreateOfcAtom}
          />
        )}
      </div>
    </div>
  );
}
