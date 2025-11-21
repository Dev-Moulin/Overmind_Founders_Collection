import { useState } from 'react';
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

  // Combine default predicates with existing ones
  const allPredicates = [
    ...DEFAULT_PREDICATES.map((label, i) => ({
      id: `default-${i}` as Hex,
      label,
      isDefault: true
    })),
    ...existingPredicates.map(p => ({ ...p, isDefault: false })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative glass-card p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
                Predicate *
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
                  Choisir
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
                  Créer
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
                <option value="">Sélectionner un predicate...</option>
                {allPredicates.map((p) => (
                  <option key={p.id} value={p.isDefault ? p.label : p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newPredicate}
                onChange={(e) => setNewPredicate(e.target.value)}
                placeholder="Ex: is represented by"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
                maxLength={100}
              />
            )}
          </div>

          {/* Object (Totem) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-white/70">
                Objet (Totem) *
              </label>
              <div className="flex gap-2">
                {existingObjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setObjectMode('select')}
                    className={`text-xs px-2 py-1 rounded ${
                      objectMode === 'select'
                        ? 'bg-purple-500/30 text-purple-300'
                        : 'bg-white/5 text-white/50 hover:text-white'
                    }`}
                  >
                    Choisir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setObjectMode('create')}
                  className={`text-xs px-2 py-1 rounded ${
                    objectMode === 'create'
                      ? 'bg-purple-500/30 text-purple-300'
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  Créer
                </button>
              </div>
            </div>

            {objectMode === 'select' && existingObjects.length > 0 ? (
              <select
                value={selectedObject}
                onChange={(e) => setSelectedObject(e.target.value as Hex)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
              >
                <option value="">Sélectionner un totem...</option>
                {existingObjects.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newObject}
                onChange={(e) => setNewObject(e.target.value)}
                placeholder="Ex: guitare, écharpe, phoenix..."
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
                maxLength={100}
              />
            )}
          </div>

          {/* Trust Amount */}
          <div>
            <label htmlFor="trustAmount" className="block text-sm font-medium text-white/70 mb-2">
              Montant TRUST à déposer *
            </label>
            <div className="relative">
              <input
                id="trustAmount"
                type="number"
                step="0.001"
                min="0.001"
                value={trustAmount}
                onChange={(e) => setTrustAmount(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50 pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">
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
}
