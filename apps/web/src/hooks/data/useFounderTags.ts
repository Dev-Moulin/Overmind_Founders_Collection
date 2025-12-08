/**
 * useFounderTags - Hook to fetch tags for a founder
 *
 * Fetches all "has tag" triples where the founder is the subject.
 * Returns unique tag labels.
 *
 * @see GET_FOUNDER_TAGS query
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_FOUNDER_TAGS } from '../../lib/graphql/queries';

interface TagTriple {
  term_id: string;
  object: {
    term_id: string;
    label: string;
  };
}

interface GetFounderTagsResult {
  triples: TagTriple[];
}

export interface FounderTag {
  id: string;
  label: string;
}

interface UseFounderTagsReturn {
  tags: FounderTag[];
  loading: boolean;
  error: Error | undefined;
}

/**
 * Hook to fetch tags for a specific founder
 *
 * @param founderName - The founder's name to fetch tags for
 * @returns Object containing tags array, loading state, and error
 */
export function useFounderTags(founderName: string): UseFounderTagsReturn {
  const { data, loading, error } = useQuery<GetFounderTagsResult>(
    GET_FOUNDER_TAGS,
    {
      variables: { founderName },
      skip: !founderName,
    }
  );

  // Deduplicate tags by label and format
  const tags = useMemo(() => {
    if (!data?.triples) return [];

    const seen = new Set<string>();
    const uniqueTags: FounderTag[] = [];

    for (const triple of data.triples) {
      const label = triple.object.label;
      if (!seen.has(label)) {
        seen.add(label);
        uniqueTags.push({
          id: triple.object.term_id,
          label,
        });
      }
    }

    return uniqueTags;
  }, [data]);

  return {
    tags,
    loading,
    error: error as Error | undefined,
  };
}
