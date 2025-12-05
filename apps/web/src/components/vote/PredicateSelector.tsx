import type { Predicate } from '../../types/predicate';

/**
 * PredicateSelector - Accordion pour sélectionner le prédicat (Step 1)
 * Extrait de VotePanel.tsx lignes 628-691
 *
 * Phase 3: Simplifié à 2 prédicats:
 * - "has totem" : Associatif/neutre (défaut)
 * - "embodies" : Opinion forte, "incarne"
 */

interface PredicateSelectorProps {
  predicates: Predicate[];
  selectedPredicateId: string;
  selectedPredicate: Predicate | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (predicateId: string) => void;
}

export function PredicateSelector({
  predicates,
  selectedPredicateId,
  selectedPredicate,
  isOpen,
  onToggle,
  onSelect,
}: PredicateSelectorProps) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/70">1. Prédicat</span>
          {selectedPredicate && (
            <span className="text-sm text-slate-400">: {selectedPredicate.label}</span>
          )}
        </div>
        <span className={`text-xs text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown content with smooth transition */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-lg">
          {predicates.map((predicate) => (
            <label
              key={predicate.id}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                ${
                  selectedPredicateId === predicate.id
                    ? 'bg-slate-500/20 border border-slate-500/50'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
            >
              <input
                type="radio"
                name="predicate"
                value={predicate.id}
                checked={selectedPredicateId === predicate.id}
                onChange={(e) => onSelect(e.target.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center
                ${
                  selectedPredicateId === predicate.id
                    ? 'border-slate-500 bg-slate-500'
                    : 'border-white/30'
                }`}
              >
                {selectedPredicateId === predicate.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium">{predicate.label}</span>
                {predicate.description && (
                  <span className="text-xs text-white/50 mt-0.5">{predicate.description}</span>
                )}
              </div>
              {predicate.isDefault && (
                <span className="ml-auto text-xs bg-slate-500/30 text-slate-300 px-2 py-0.5 rounded">
                  défaut
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
