/**
 * useTotemData - Hook pour gérer les données des totems
 * Extrait de VotePanel.tsx lignes 110-382
 *
 * Gère:
 * - Subscription WebSocket aux catégories de totems
 * - Agrégation des totems depuis les triples et catégories
 * - Filtrage et groupement par catégorie
 * - Catégories dynamiques
 */

import { useMemo } from 'react';
import { useSubscription } from '@apollo/client';
import { formatEther } from 'viem';
import { SUBSCRIBE_TOTEM_CATEGORIES } from '../../lib/graphql/subscriptions';
import { getCategoryName } from '../../utils';
import type { CategoryConfigType } from '../../types/category';
import categoriesConfig from '../../../../../packages/shared/src/data/categories.json';

// Cast imported JSON to typed config
const typedCategoriesConfig = categoriesConfig as CategoryConfigType;

export interface TotemData {
  id: string;
  label: string;
  image?: string;
  category?: string;
  trustScore?: number;
}

interface TriplesData {
  triples: Array<{
    object: {
      term_id: string;
      label: string;
      image?: string;
      description?: string;
    };
  }>;
}

interface Proposal {
  object: {
    term_id: string;
    label: string;
    image?: string;
  };
  votes: {
    forVotes: string;
    againstVotes: string;
  };
}

interface UseTotemDataProps {
  triplesData: TriplesData | undefined;
  proposals: Proposal[] | undefined;
  searchQuery: string;
}

interface UseTotemDataReturn {
  /** Tous les totems existants (fusion triples + catégories WebSocket) */
  allExistingTotems: TotemData[];
  /** Totems avec scores agrégés pour le founder */
  existingTotems: TotemData[];
  /** Totems filtrés par recherche */
  filteredAllTotems: TotemData[];
  /** Totems groupés par catégorie */
  totemsByCategory: Map<string, TotemData[]>;
  /** Catégories dynamiques depuis WebSocket */
  dynamicCategories: string[];
  /** Map totemId -> catégorie */
  totemCategoriesMap: Map<string, string>;
}

export function useTotemData({
  triplesData,
  proposals,
  searchQuery,
}: UseTotemDataProps): UseTotemDataReturn {
  // Subscribe to totem categories via WebSocket (OFC: triple system)
  const { data: categoriesSubData } = useSubscription<{
    triples: Array<{
      term_id: string;
      subject: { term_id: string; label: string; image?: string };
      object: { term_id: string; label: string };
      created_at: string;
    }>;
  }>(SUBSCRIBE_TOTEM_CATEGORIES);

  // Build a map of totem ID -> category from WebSocket subscription
  const totemCategoriesMap = useMemo(() => {
    const map = new Map<string, string>();
    if (categoriesSubData?.triples) {
      categoriesSubData.triples.forEach((triple) => {
        // subject = totem, object = OFC:Category
        map.set(triple.subject.term_id, getCategoryName(triple.object.label));
      });
    }
    return map;
  }, [categoriesSubData]);

  // Extract unique objects (totems) from two sources:
  // 1. Triples de vote existants (triplesData) - totems déjà utilisés dans des votes
  // 2. Triples de catégorie (categoriesSubData) - tous les totems avec catégorie OFC:
  const allExistingTotems = useMemo(() => {
    const objectMap = new Map<string, TotemData>();

    // Source 1: Totems from vote triples (already used in votes)
    if (triplesData?.triples) {
      triplesData.triples.forEach((triple) => {
        const obj = triple.object;
        if (obj?.label && !objectMap.has(obj.term_id)) {
          // Get category from OFC: triple system (WebSocket) or fallback to description (HTTP)
          const categoryFromTriple = totemCategoriesMap.get(obj.term_id);
          const categoryFromDescription = obj?.description?.startsWith('Categorie : ')
            ? obj.description.replace('Categorie : ', '')
            : undefined;
          const category = categoryFromTriple || categoryFromDescription;

          if (category) {
            objectMap.set(obj.term_id, {
              id: obj.term_id,
              label: obj.label,
              image: obj.image,
              category,
            });
          }
        }
      });
    }

    // Source 2: Totems from category triples (includes newly created totems from AdminAuditPage)
    if (categoriesSubData?.triples) {
      categoriesSubData.triples.forEach((triple) => {
        const totemId = triple.subject.term_id;
        if (!objectMap.has(totemId)) {
          objectMap.set(totemId, {
            id: totemId,
            label: triple.subject.label,
            image: triple.subject.image,
            category: getCategoryName(triple.object.label),
          });
        }
      });
    }

    return Array.from(objectMap.values());
  }, [triplesData, totemCategoriesMap, categoriesSubData]);

  // Aggregate proposals by totem (object) to get unique totems with their scores
  const existingTotems = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];

    // Group by object (totem) and aggregate votes
    const totemMap = new Map<string, TotemData>();

    proposals.forEach((proposal) => {
      const totemId = proposal.object.term_id;
      const existing = totemMap.get(totemId);
      const forVotes = BigInt(proposal.votes.forVotes);
      const againstVotes = BigInt(proposal.votes.againstVotes);
      const netScore = forVotes - againstVotes;

      if (existing) {
        // Add to existing totem's score
        existing.trustScore = (existing.trustScore || 0) + Number(formatEther(netScore));
      } else {
        // New totem
        totemMap.set(totemId, {
          id: totemId,
          label: proposal.object.label,
          image: proposal.object.image,
          trustScore: Number(formatEther(netScore)),
        });
      }
    });

    // Convert to array and sort by trustScore descending
    return Array.from(totemMap.values())
      .sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
  }, [proposals]);

  // Filter all existing totems by search query
  const filteredAllTotems = useMemo(() => {
    if (!searchQuery) return allExistingTotems;
    const query = searchQuery.toLowerCase();
    return allExistingTotems.filter((t) => t.label.toLowerCase().includes(query));
  }, [allExistingTotems, searchQuery]);

  // Group totems by category for display
  const totemsByCategory = useMemo(() => {
    const grouped = new Map<string, TotemData[]>();

    // Group all existing totems by their category
    allExistingTotems.forEach((totem) => {
      const category = totem.category || 'Autre';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(totem);
    });

    // Sort categories: predefined first (from config), then dynamic ones, "Autre" last
    const predefinedOrder = typedCategoriesConfig.categories.map(c => c.name);
    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      const indexA = predefinedOrder.indexOf(a[0]);
      const indexB = predefinedOrder.indexOf(b[0]);

      // "Autre" always last
      if (a[0] === 'Autre') return 1;
      if (b[0] === 'Autre') return -1;

      // Predefined categories first (by config order)
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // Dynamic categories alphabetically
      return a[0].localeCompare(b[0]);
    });

    return new Map(sortedEntries);
  }, [allExistingTotems]);

  // Get unique categories from WebSocket subscription (dynamic categories)
  const dynamicCategories = useMemo(() => {
    const categories = new Set<string>();
    if (categoriesSubData?.triples) {
      categoriesSubData.triples.forEach((triple) => {
        const categoryName = getCategoryName(triple.object.label);
        categories.add(categoryName);
      });
    }
    return Array.from(categories);
  }, [categoriesSubData]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    allExistingTotems,
    existingTotems,
    filteredAllTotems,
    totemsByCategory,
    dynamicCategories,
    totemCategoriesMap,
  }), [allExistingTotems, existingTotems, filteredAllTotems, totemsByCategory, dynamicCategories, totemCategoriesMap]);
}
