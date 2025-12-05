/**
 * VotePreview - Affiche la prévisualisation du claim et le coût total
 * Extrait de VotePanel.tsx lignes 1018-1030
 */

interface TotalCost {
  formatted: string;
  totalWei: string;
}

interface VotePreviewProps {
  previewText: string;
  trustAmount: string;
  totalCost: TotalCost | null;
}

export function VotePreview({ previewText, trustAmount, totalCost }: VotePreviewProps) {
  return (
    <div className="mb-6 p-4 bg-slate-500/10 border border-slate-500/20 rounded-lg">
      <h4 className="text-xs font-semibold text-slate-400 mb-2">Preview</h4>
      <p className="text-white font-medium">{previewText}</p>
      <p className="text-sm text-white/50 mt-1">
        Dépôt: {trustAmount || '0'} TRUST (vote FOR)
      </p>
      {totalCost && (
        <p className="text-xs text-white/40 mt-1">
          Coût total: {totalCost.formatted} TRUST (base + dépôt)
        </p>
      )}
    </div>
  );
}
