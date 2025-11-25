import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { FounderData } from './FounderCard';
import type { Hex } from 'viem';

interface ProposalModalProps {
  founder: FounderData;
  founderAtomId?: Hex; // Atom ID du fondateur sur INTUITION
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProposalFormData) => void;
  isLoading?: boolean;
  existingPredicates?: Array<{ id: Hex; label: string }>;
  existingObjects?: Array<{ id: Hex; label: string }>;
}

export interface ProposalFormData {
  founderId: string;
  founderAtomId?: Hex;
  predicate: string | Hex; // String = créer nouvel atom, Hex = utiliser existant
  object: string | Hex; // String = créer nouvel atom, Hex = utiliser existant
  trustAmount: string;
}

// Predicates par défaut proposés
const DEFAULT_PREDICATES = [
  'is represented by',
  'has totem',
  'is symbolized by',
  'is associated with',
  'embodies',
  'channels',
  'resonates with',
];

// Catégories de totems suggérés (mêmes que la page Admin)
const TOTEM_CATEGORIES = [
  {
    id: 'animals',
    name: 'Animaux',
    emoji: '🦁',
    examples: ['Lion', 'Aigle', 'Loup', 'Hibou', 'Renard', 'Dauphin', 'Éléphant', 'Baleine', 'Faucon', 'Cheval', 'Lynx', 'Chouette', 'Tortue']
  },
  {
    id: 'objects',
    name: 'Objets',
    emoji: '⚔️',
    examples: ['Clé maître', 'Fondation', 'Pont', 'Boussole', 'Bouclier', 'Lampe torche', 'Épée', 'Télescope']
  },
  {
    id: 'traits',
    name: 'Traits',
    emoji: '⭐',
    examples: ['Visionnaire', 'Leader', 'Innovateur', 'Connecteur', 'Protecteur', 'Stratège', 'Builder', 'Créatif']
  },
  {
    id: 'superpowers',
    name: 'Superpowers',
    emoji: '⚡',
    examples: ['Transformation', 'Connexion', 'Détection', 'Scaling', 'Innovation', 'Résilience']
  },
];

export function ProposalModal({
  founder,
  founderAtomId,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  existingPredicates = [],
  existingObjects = [],
}: ProposalModalProps) {
  // Predicate state
  const [predicateMode, setPredicateMode] = useState<'select' | 'create'>('select');
  const [selectedPredicate, setSelectedPredicate] = useState<Hex | ''>('');
  const [newPredicate, setNewPredicate] = useState('');

  // Object state
  const [objectMode, setObjectMode] = useState<'select' | 'create'>('create');
  const [selectedObject, setSelectedObject] = useState<Hex | ''>('');
  const [newObject, setNewObject] = useState('');

  // Trust amount
  const [trustAmount, setTrustAmount] = useState('0.001');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const predicate = predicateMode === 'create'
      ? newPredicate.trim()
      : selectedPredicate;

    const object = objectMode === 'create'
      ? newObject.trim()
      : selectedObject;

    if (!predicate || !object) return;

    onSubmit({
      founderId: founder.id,
      founderAtomId,
      predicate,
      object,
      trustAmount,
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      setPredicateMode('select');
      setSelectedPredicate('');
      setNewPredicate('');
      setObjectMode('create');
      setSelectedObject('');
      setNewObject('');
      setTrustAmount('0.001');
      onClose();
    }
  };

  const isPredicateValid = predicateMode === 'create'
    ? newPredicate.trim().length > 0
    : selectedPredicate !== '';

  const isObjectValid = objectMode === 'create'
    ? newObject.trim().length > 0
    : selectedObject !== '';

  const isTrustValid = parseFloat(trustAmount) > 0;

  const isFormValid = isPredicateValid && isObjectValid && isTrustValid;

  // Build predicates list: prioritize existing ones (with atomId), add missing as "to create"
  const allPredicates = DEFAULT_PREDICATES.map((label) => {
    const existing = existingPredicates.find(p => p.label === label);
    return {
      id: existing?.id || (`new:${label}` as Hex), // Prefix "new:" indicates atom needs to be created
      label,
      isOnChain: !!existing,
    };
  });

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={handleClose}
    >
      {/* Modal */}
      <div
        className="glass-card p-6 w-full overflow-y-auto"
        style={{
          maxWidth: '512px',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              Créer un Claim
            </h2>
            <p className="text-white/50 text-sm mt-1">
              pour {founder.name}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Claim Preview */}
        <div className="glass-card p-4 mb-6 text-center">
          <p className="text-white/50 text-xs mb-2">Votre claim :</p>
          <p className="text-white font-medium">
            <span className="text-purple-400">{founder.name}</span>
            {' '}
            <span className="text-white/70">
              {predicateMode === 'create'
                ? (newPredicate || '...')
                : (allPredicates.find(p => p.id === selectedPredicate)?.label || '...')}
            </span>
            {' '}
            <span className="text-purple-400">
              {objectMode === 'create' ? (newObject || '...') : (existingObjects.find(o => o.id === selectedObject)?.label || '...')}
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Predicate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-white/70">
                Predicate * <span className="text-white/40">({allPredicates.length} disponibles)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPredicateMode('select')}
                  className={`text-xs px-2 py-1 rounded ${
                    predicateMode === 'select'
                      ? 'bg-purple-500/30 text-purple-300'
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  Choisir ({allPredicates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPredicateMode('create')}
                  className={`text-xs px-2 py-1 rounded ${
                    predicateMode === 'create'
                      ? 'bg-purple-500/30 text-purple-300'
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  Créer nouveau
                </button>
              </div>
            </div>

            {predicateMode === 'select' ? (
              <select
                value={selectedPredicate}
                onChange={(e) => setSelectedPredicate(e.target.value as Hex)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
              >
                <option value="">-- Sélectionner un predicate --</option>
                {allPredicates.map((p) => (
                  <option key={p.id} value={p.isOnChain ? p.id : p.label}>
                    {p.label}{!p.isOnChain ? ' (nouveau)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newPredicate}
                onChange={(e) => setNewPredicate(e.target.value)}
                placeholder="Ex: is represented by, has totem..."
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
                maxLength={100}
              />
            )}
          </div>

          {/* Object (Totem) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Objet (Totem) *
            </label>

            {/* Input pour le totem */}
            <input
              type="text"
              value={objectMode === 'select' ? (existingObjects.find(o => o.id === selectedObject)?.label || '') : newObject}
              onChange={(e) => {
                setObjectMode('create');
                setNewObject(e.target.value);
                setSelectedObject('');
              }}
              placeholder="Tapez un totem ou choisissez ci-dessous..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
              maxLength={100}
            />

            {/* Totems existants (si on en a) */}
            {existingObjects.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-white/50 mb-2">Totems existants :</p>
                <div className="flex flex-wrap gap-1.5">
                  {existingObjects.slice(0, 10).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setObjectMode('select');
                        setSelectedObject(o.id);
                        setNewObject('');
                      }}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        selectedObject === o.id
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions par catégorie */}
            <div className="mt-3">
              <p className="text-xs text-white/50 mb-2">Suggestions :</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {TOTEM_CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <p className="text-xs text-white/40 mb-1">{cat.emoji} {cat.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.examples.slice(0, 6).map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => {
                            setObjectMode('create');
                            setNewObject(example);
                            setSelectedObject('');
                          }}
                          className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                            newObject === example
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Amount */}
          <div>
            <label htmlFor="trustAmount" className="block text-sm font-medium text-white/70 mb-2">
              Montant TRUST à déposer *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="trustAmount"
                type="number"
                step="0.001"
                min="0.001"
                value={trustAmount}
                onChange={(e) => setTrustAmount(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
                style={{ paddingRight: '64px' }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                  pointerEvents: 'none',
                }}
              >
                ETH
              </span>
            </div>
            <p className="text-white/40 text-xs mt-1">
              Plus vous déposez, plus votre vote compte
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="flex-1 glass-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création...
                </span>
              ) : (
                'Créer le Claim'
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <p className="text-white/40 text-xs text-center mt-4">
          Ce claim sera enregistré on-chain via le protocole INTUITION
        </p>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
