import { Link } from 'react-router-dom';

export interface FounderData {
  id: string;
  name: string;
  shortBio: string;
  fullBio?: string;
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
  image?: string;
  atomId?: string; // INTUITION Atom ID (Hex) - sera renseigné après création on-chain
}

/**
 * Get the best available image URL for a founder
 * Priority: manual image > Twitter avatar > GitHub avatar > DiceBear fallback
 */
export function getFounderImageUrl(founder: { name: string; image?: string; twitter?: string | null; github?: string | null }): string {
  // 1. Manual image if provided
  if (founder.image) {
    return founder.image;
  }

  // 2. Twitter avatar via unavatar.io
  if (founder.twitter) {
    return `https://unavatar.io/twitter/${founder.twitter.replace('@', '')}`;
  }

  // 3. GitHub avatar
  if (founder.github) {
    return `https://github.com/${founder.github}.png`;
  }

  // 4. DiceBear fallback - generates unique avatar based on name
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
}

interface FounderCardProps {
  founder: FounderData;
  proposalCount?: number;
  onPropose?: () => void;
}

export function FounderCard({ founder, proposalCount = 0, onPropose }: FounderCardProps) {
  const imageUrl = getFounderImageUrl(founder);
  // Utiliser fullBio si disponible (c'est ce qui est stocké on-chain)
  const displayBio = founder.fullBio || founder.shortBio;

  return (
    <div className="glass-card p-5 flex flex-col h-full">
      {/* Header with photo and name */}
      <div className="flex items-start gap-4 mb-4">
        {/* Photo - taille fixe 80x80 */}
        <div className="w-20 h-20 flex-shrink-0 rounded-full overflow-hidden bg-white/10 border-2 border-purple-500/30">
          <img
            src={imageUrl}
            alt={founder.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Nom */}
          <h3 className="text-xl font-bold text-white leading-tight mb-2">
            {founder.name}
          </h3>

          {/* Badge INTUITION si on-chain */}
          {founder.atomId && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              On-chain
            </span>
          )}
        </div>
      </div>

      {/* Bio - fullBio avec line-clamp */}
      <div className="flex-1 mb-4">
        <p className="text-white/80 text-sm leading-relaxed line-clamp-4">
          {displayBio}
        </p>
      </div>

      {/* Liens sociaux avec icônes claires et boutons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {founder.twitter && (
          <a
            href={`https://twitter.com/${founder.twitter.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 hover:text-white transition-colors"
            title={`X (Twitter): ${founder.twitter}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>{founder.twitter}</span>
          </a>
        )}
        {founder.linkedin && (
          <a
            href={founder.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-blue-400 hover:text-blue-300 transition-colors"
            title="LinkedIn"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span>LinkedIn</span>
          </a>
        )}
        {founder.github && (
          <a
            href={`https://github.com/${founder.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 hover:text-white transition-colors"
            title={`GitHub: ${founder.github}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>{founder.github}</span>
          </a>
        )}
      </div>

      {/* Footer with stats and actions */}
      <div className="flex justify-between items-center pt-3 border-t border-white/10">
        <span className="text-white/50 text-xs">
          {proposalCount} {proposalCount === 1 ? 'proposition' : 'propositions'}
        </span>

        <div className="flex gap-2">
          <Link
            to={`/results/${founder.id}`}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-500/10"
          >
            Voir détails
          </Link>
          {onPropose && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPropose();
              }}
              className="text-xs bg-purple-500/20 text-purple-400 px-4 py-1.5 rounded-lg hover:bg-purple-500/30 transition-colors font-medium border border-purple-500/30"
            >
              Proposer un Totem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
