import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ADMIN_WALLET } from '../config/constants';
import { useAdminAtoms } from '../hooks';
import { useAdminActions } from '../hooks';
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

// Liste des 2 prédicats utilisateur (Phase 3 - Simplification)
// Ces prédicats sont utilisés dans Triple 1: [Founder] → [predicate] → [Totem]
const PREDICATES = [
  { id: 'has-totem', label: 'has totem', description: 'Associative/neutral: X has totem Y', isDefault: true },
  { id: 'embodies', label: 'embodies', description: 'Strong opinion: X embodies/incarnates Y', isDefault: false },
];

// Totem categories (mapped to categories.json IDs)
const TOTEM_CATEGORIES = [
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🦁',
    ofcCategoryId: 'animal',
    examples: ['Lion', 'Eagle', 'Wolf', 'Owl', 'Fox', 'Dolphin', 'Elephant', 'Whale', 'Falcon', 'Horse', 'Lynx', 'Nightingale', 'Parrot', 'Peacock', 'Swan', 'Turtle'],
  },
  {
    id: 'objects',
    name: 'Objects',
    emoji: '⚔️',
    ofcCategoryId: 'object',
    examples: ['Master key', 'Foundation', 'Network node', 'Bridge', 'Megaphone', 'Compass', 'Shield', 'Padlock', 'Flashlight', 'Sword', 'Telescope', 'Radar'],
  },
  {
    id: 'traits',
    name: 'Traits',
    emoji: '⭐',
    ofcCategoryId: 'trait',
    examples: ['Visionary', 'Leader', 'Innovator', 'Connector', 'Protector', 'Strategist', 'Builder', 'Pragmatic', 'Creative', 'Methodical', 'Analytical'],
  },
  {
    id: 'universe',
    name: 'Concepts',
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
    ofcCategoryId: 'object',
    examples: ['Football', 'Basketball', 'Tennis', 'Surf', 'Skateboard', 'Climbing', 'Marathon', 'Boxing', 'MMA', 'Chess'],
  },
];

const ALL_TOTEM_LABELS = TOTEM_CATEGORIES.flatMap((cat) => cat.examples);

// Type for categories.json with 3-triple system
interface CategoriesConfigType {
  predicate: { id: string; label: string; description: string; termId: string | null };
  tagPredicate: { id: string; label: string; description: string; termId: string | null };
  systemObject: { id: string; label: string; description: string; termId: string | null };
  categories: Array<{ id: string; label: string; name: string; termId: string | null }>;
}

const typedCategoriesConfig = categoriesConfig as CategoriesConfigType;

// Atoms système pour le système 3-triples
const OFC_ATOMS = [
  // Prédicat 1: has category (pour Triple 2)
  {
    id: typedCategoriesConfig.predicate.id,
    label: typedCategoriesConfig.predicate.label,
    description: typedCategoriesConfig.predicate.description,
    emoji: '🔗',
    type: 'predicate' as const,
  },
  // Prédicat 2: tag category (pour Triple 3)
  {
    id: typedCategoriesConfig.tagPredicate.id,
    label: typedCategoriesConfig.tagPredicate.label,
    description: typedCategoriesConfig.tagPredicate.description,
    emoji: '🏷️',
    type: 'predicate' as const,
  },
  // Objet système: Overmind Founders Collection (pour Triple 3)
  {
    id: typedCategoriesConfig.systemObject.id,
    label: typedCategoriesConfig.systemObject.label,
    description: typedCategoriesConfig.systemObject.description,
    emoji: '🎯',
    type: 'system' as const,
  },
  // Catégories (sans préfixe OFC:)
  ...typedCategoriesConfig.categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    description: `Category atom for ${cat.name} totems`,
    emoji: cat.id === 'animal' ? '🦁' : cat.id === 'object' ? '🔮' : cat.id === 'trait' ? '✨' : cat.id === 'concept' ? '💡' : cat.id === 'element' ? '🔥' : '🐉',
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
