/**
 * useAllOFCTotems - Hook to get all OFC totems from category triples
 *
 * Fetches totems that have a category triple:
 * [Totem] - [has category] - [Animal|Object|Trait|Concept|Element|Mythology]
 *
 * This includes totems created by admins that don't have votes yet.
 */

import { useMemo } from 'react';
import { useSubscription } from '@apollo/client';
import { SUBSCRIBE_TOTEM_CATEGORIES } from '../../lib/graphql/subscriptions';

export interface OFCTotem {
  id: string;
  label: string;
  image?: string;
  category: string;
}

interface UseAllOFCTotemsReturn {
  /** All OFC totems with their categories */
  totems: OFCTotem[];
  /** Loading state */
  loading: boolean;
  /** Map of totemId -> category for quick lookup */
  categoryMap: Map<string, string>;
}

export function useAllOFCTotems(): UseAllOFCTotemsReturn {
  // Subscribe to category triples via WebSocket
  const { data, loading } = useSubscription<{
    triples: Array<{
      term_id: string;
      subject: { term_id: string; label: string; image?: string };
      object: { term_id: string; label: string };
      created_at: string;
    }>;
  }>(SUBSCRIBE_TOTEM_CATEGORIES);

  // Build totems list and category map
  const { totems, categoryMap } = useMemo(() => {
    const totemsMap = new Map<string, OFCTotem>();
    const catMap = new Map<string, string>();

    if (data?.triples) {
      data.triples.forEach((triple) => {
        const totemId = triple.subject.term_id;
        const category = triple.object.label;

        catMap.set(totemId, category);

        if (!totemsMap.has(totemId)) {
          totemsMap.set(totemId, {
            id: totemId,
            label: triple.subject.label,
            image: triple.subject.image,
            category,
          });
        }
      });
    }

    return {
      totems: Array.from(totemsMap.values()),
      categoryMap: catMap,
    };
  }, [data]);

  return {
    totems,
    loading,
    categoryMap,
  };
}
