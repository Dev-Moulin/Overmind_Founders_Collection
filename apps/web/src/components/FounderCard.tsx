import { Link } from 'react-router-dom';

export interface FounderData {
  id: string;
  name: string;
  shortBio: string;
  fullBio?: string;
  twitter?: string | null;
  linkedin?: string | null;
}

interface FounderCardProps {
  founder: FounderData;
  proposalCount?: number;
  onPropose?: () => void;
}

export function FounderCard({ founder, proposalCount = 0, onPropose }: FounderCardProps) {
  return (
    <div className="glass-card p-4 flex flex-col h-full">
      {/* Header with name and social links */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-white leading-tight">
          {founder.name}
        </h3>
        <div className="flex gap-2">
          {founder.twitter && (
            <a
              href={`https://twitter.com/${founder.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-purple-400 transition-colors"
              title="Twitter"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
          {founder.linkedin && (
            <a
              href={founder.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-purple-400 transition-colors"
              title="LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Short bio */}
      <p className="text-white/70 text-sm mb-4 flex-1">
        {founder.shortBio}
      </p>

      {/* Footer with stats and action */}
      <div className="flex justify-between items-center pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">
            {proposalCount} {proposalCount === 1 ? 'proposition' : 'propositions'}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/vote/${founder.id}`}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Voir
          </Link>
          {onPropose && (
            <button
              onClick={onPropose}
              className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded hover:bg-purple-500/30 transition-colors"
            >
              Proposer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
