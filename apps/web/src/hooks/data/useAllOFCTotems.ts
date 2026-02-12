/**
 * useAllOFCTotems - Hook to get all OFC totems from category triples
 *
 * Fetches totems that have a category triple:
 * [Totem] - [has category] - [Category]
 *
 * This includes totems created by admins that don't have votes yet.
 * Also extracts all unique categories (including user-created ones).
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

/** Dynamic category from blockchain */
export interface DynamicCategory {
  termId: string;
  label: string;
  image?: string;
}

interface UseAllOFCTotemsReturn {
  /** All OFC totems with their categories */
  totems: OFCTotem[];
  /** Loading state */
  loading: boolean;
  /** Map of totemId -> category for quick lookup */
  categoryMap: Map<string, string>;
  /** All unique categories found in the blockchain (dynamic) */
  dynamicCategories: DynamicCategory[];
}

export function useAllOFCTotems(): UseAllOFCTotemsReturn {
  // Subscribe to category triples via WebSocket
  const { data, loading } = useSubscription<{
    triples: Array<{
      term_id: string;
      subject: { term_id: string; label: string; image?: string };
      object: { term_id: string; label: string; image?: string };
      created_at: string;
    }>;
  }>(SUBSCRIBE_TOTEM_CATEGORIES);

  // Build totems list, category map, and dynamic categories list
  const { totems, categoryMap, dynamicCategories } = useMemo(() => {
    const totemsMap = new Map<string, OFCTotem>();
    const catMap = new Map<string, string>();
    const categoriesMap = new Map<string, DynamicCategory>();

    if (data?.triples) {
      data.triples.forEach((triple) => {
        const totemId = triple.subject.term_id;
        const category = triple.object.label;
        const categoryTermId = triple.object.term_id;

        // Skip entries with null labels (e.g. atoms created via Thing schema)
        if (category) {
          catMap.set(totemId, category);

          // Collect unique categories
          if (!categoriesMap.has(categoryTermId)) {
            categoriesMap.set(categoryTermId, {
              termId: categoryTermId,
              label: category,
              image: triple.object.image || undefined,
            });
          }
        }

        if (!totemsMap.has(totemId) && triple.subject.label) {
          totemsMap.set(totemId, {
            id: totemId,
            label: triple.subject.label,
            image: triple.subject.image,
            category: category || '',
          });
        }
      });
    }

    return {
      totems: Array.from(totemsMap.values()),
      categoryMap: catMap,
      dynamicCategories: Array.from(categoriesMap.values()).sort((a, b) =>
        (a.label || '').localeCompare(b.label || '')
      ),
    };
  }, [data]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    totems,
    loading,
    categoryMap,
    dynamicCategories,
  }), [totems, loading, categoryMap, dynamicCategories]);
}
