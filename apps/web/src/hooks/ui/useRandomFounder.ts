import { useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useFoundersData } from '../../contexts/FoundersDataContext';
import type { FounderForHomePage } from '../../types/founder';

/**
 * Hook de sélection aléatoire d'un fondateur, priorisé par votes utilisateur.
 * - Pas connecté → random pur
 * - Connecté, fondateurs non-votés restants → random parmi eux
 * - Tous votés → random parmi ceux avec le moins de votes
 */
export function useRandomFounder(founders: FounderForHomePage[]) {
  const { address } = useAccount();
  const { depositsByTermId, proposalsByFounder } = useFoundersData();

  const voteCountByFounderName = useMemo(() => {
    const map = new Map<string, number>();
    if (!address) return map;

    const lowerAddress = address.toLowerCase();

    // Compter les deposits de l'utilisateur par term_id
    const userDepositCounts = new Map<string, number>();
    depositsByTermId.forEach((deposits, termId) => {
      const count = deposits.filter(
        (d) => d.sender_id.toLowerCase() === lowerAddress,
      ).length;
      if (count > 0) userDepositCounts.set(termId, count);
    });

    // Agréger par fondateur
    proposalsByFounder.forEach((proposals, founderName) => {
      let count = 0;
      for (const p of proposals) {
        count += userDepositCounts.get(p.term_id) || 0;
        if (p.counter_term?.id) {
          count += userDepositCounts.get(p.counter_term.id) || 0;
        }
      }
      map.set(founderName, count);
    });

    return map;
  }, [address, depositsByTermId, proposalsByFounder]);

  const pickRandom = useCallback((): string | null => {
    if (founders.length === 0) return null;

    if (!address) {
      return founders[Math.floor(Math.random() * founders.length)].id;
    }

    const unvoted: FounderForHomePage[] = [];
    const voted: { founder: FounderForHomePage; count: number }[] = [];

    for (const f of founders) {
      const count = voteCountByFounderName.get(f.name) || 0;
      if (count === 0) {
        unvoted.push(f);
      } else {
        voted.push({ founder: f, count });
      }
    }

    if (unvoted.length > 0) {
      return unvoted[Math.floor(Math.random() * unvoted.length)].id;
    }

    voted.sort((a, b) => a.count - b.count);
    const minCount = voted[0].count;
    const leastVoted = voted.filter((v) => v.count === minCount);
    return leastVoted[Math.floor(Math.random() * leastVoted.length)].founder.id;
  }, [founders, address, voteCountByFounderName]);

  return { pickRandom };
}
