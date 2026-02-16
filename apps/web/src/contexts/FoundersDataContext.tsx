import { createContext, useContext, type ReactNode } from 'react';
import type { ApolloError } from '@apollo/client';
import type { Triple, GetDepositsByTermIdsResult } from '../lib/graphql/types';
import type { FounderForHomePage } from '../types/founder';
import type { TopTotem } from '../hooks/data/useTopTotems';
import { useFoundersForHomePage } from '../hooks/data/useFoundersForHomePage';

type DepositEntry = GetDepositsByTermIdsResult['deposits'][number];

interface FoundersDataContextValue {
  // Enriched founders list (42 founders with atomId, winningTotem, etc.)
  founders: FounderForHomePage[];
  // Homepage stats
  stats: {
    totalTrustVoted: number;
    uniqueVoters: number;
    foundersWithTotems: number;
    totalProposals: number;
  };
  // Pre-computed top totems per founder (for carousel cards)
  topTotemsMap: Map<string, TopTotem[]>;
  // Raw proposals grouped by founder name (for panel hooks)
  proposalsByFounder: Map<string, Triple[]>;
  // Raw deposits indexed by term_id (for panel hooks)
  depositsByTermId: Map<string, DepositEntry[]>;
  // State
  loading: boolean;
  error: ApolloError | null;
  // Invalidation after vote
  refetch: () => Promise<void>;
}

const FoundersDataContext = createContext<FoundersDataContextValue | null>(null);

export function FoundersDataProvider({ children }: { children: ReactNode }) {
  const data = useFoundersForHomePage();

  return (
    <FoundersDataContext.Provider value={data}>
      {children}
    </FoundersDataContext.Provider>
  );
}

export function useFoundersData(): FoundersDataContextValue {
  const ctx = useContext(FoundersDataContext);
  if (!ctx) {
    throw new Error('useFoundersData must be used within a FoundersDataProvider');
  }
  return ctx;
}
