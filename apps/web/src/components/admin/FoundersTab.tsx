import { getFounderImageUrl } from '../../utils/founderImage';

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

interface FoundersTabProps {
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

export function FoundersTab({
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
}: FoundersTabProps) {
  if (atomsLoading) {
    return <div className="p-6 text-center text-white/60">Chargement des atoms...</div>;
  }

  if (atomsError) {
    return (
      <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg">
        <p className="text-red-400">Erreur GraphQL : {atomsError.message}</p>
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
            Fondateurs avec Atoms ({existingCount})
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
            Fondateurs sans Atom ({missingCount})
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
                          {creatingItem === founder.name ? 'Création...' : 'Créer Atom'}
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
