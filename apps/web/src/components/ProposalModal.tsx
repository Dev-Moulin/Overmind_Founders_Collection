import { useState } from 'react';
import type { FounderData } from './FounderCard';

interface ProposalModalProps {
  founder: FounderData;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProposalFormData) => void;
  isLoading?: boolean;
}

export interface ProposalFormData {
  founderId: string;
  totemName: string;
  description: string;
  imageUrl?: string;
}

export function ProposalModal({
  founder,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ProposalModalProps) {
  const [totemName, setTotemName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      founderId: founder.id,
      totemName: totemName.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      setTotemName('');
      setDescription('');
      setImageUrl('');
      onClose();
    }
  };

  const isFormValid = totemName.trim().length > 0 && description.trim().length > 0;

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
              Proposer un Totem
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Totem Name */}
          <div>
            <label htmlFor="totemName" className="block text-sm font-medium text-white/70 mb-2">
              Nom du Totem *
            </label>
            <input
              id="totemName"
              type="text"
              value={totemName}
              onChange={(e) => setTotemName(e.target.value)}
              placeholder="Ex: Le Phoenix Éthéré"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
              maxLength={100}
              required
            />
            <p className="text-white/40 text-xs mt-1">
              {totemName.length}/100 caractères
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white/70 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez pourquoi ce totem représente bien ce fondateur..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50 resize-none"
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-white/40 text-xs mt-1">
              {description.length}/500 caractères
            </p>
          </div>

          {/* Image URL (optional - will be replaced by ImageUpload in #28) */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-white/70 mb-2">
              URL de l'image (optionnel)
            </label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
            />
            <p className="text-white/40 text-xs mt-1">
              L'upload IPFS sera disponible prochainement
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
                  Soumission...
                </span>
              ) : (
                'Soumettre'
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <p className="text-white/40 text-xs text-center mt-4">
          Votre proposition sera enregistrée on-chain via INTUITION
        </p>
      </div>
    </div>
  );
}
