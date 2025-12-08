/**
 * useVoteGraph - Hook for building graph data from founder proposals
 *
 * Transforms founder proposals (triples) into nodes and edges
 * for visualization with reagraph.
 *
 * Node types:
 * - founder: The founder atom (subject)
 * - predicate: The relationship type (predicate)
 * - totem: The totem atom (object)
 *
 * Edge types:
 * - subject->predicate
 * - predicate->object
 *
 * @see Phase 10 in TODO_Implementation.md
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_FOUNDER_PROPOSALS } from '../../lib/graphql/queries';

/**
 * Node type for the graph
 */
export interface GraphNode {
  id: string;
  label: string;
  type: 'founder' | 'predicate' | 'totem';
  /** Optional image URL */
  image?: string;
  /** Optional emoji */
  emoji?: string;
  /** Total FOR votes (TRUST) */
  forVotes?: string;
  /** Total AGAINST votes (TRUST) */
  againstVotes?: string;
  /** Net votes (FOR - AGAINST) */
  netVotes?: string;
  /** Original term_id */
  termId?: string;
}

/**
 * Edge type for the graph
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** Edge weight based on votes */
  weight?: number;
}

/**
 * Graph data structure
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Hook result
 */
export interface UseVoteGraphResult {
  /** Graph data ready for rendering */
  graphData: GraphData;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch data */
  refetch: () => void;
  /** Stats about the graph */
  stats: {
    totalNodes: number;
    totalEdges: number;
    uniqueTotems: number;
    uniquePredicates: number;
    totalVotes: string;
  };
}

/**
 * Format bigint value to human-readable string
 */
function formatTrust(value: string | number | bigint | undefined): string {
  if (!value) return '0';
  const num = typeof value === 'bigint' ? value : BigInt(value.toString());
  const formatted = Number(num) / 1e18;
  return formatted.toFixed(4);
}

/**
 * Hook to build graph data from founder proposals
 *
 * @param founderName - The founder name to fetch proposals for
 * @returns Graph data, loading state, and stats
 *
 * @example
 * ```tsx
 * function FounderGraph({ founderName }) {
 *   const { graphData, loading, stats } = useVoteGraph(founderName);
 *
 *   if (loading) return <Spinner />;
 *
 *   return (
 *     <GraphCanvas
 *       nodes={graphData.nodes}
 *       edges={graphData.edges}
 *     />
 *   );
 * }
 * ```
 */
export function useVoteGraph(founderName: string): UseVoteGraphResult {
  const { data, loading, error, refetch } = useQuery(GET_FOUNDER_PROPOSALS, {
    variables: { founderName },
    skip: !founderName,
  });

  const graphData = useMemo<GraphData>(() => {
    if (!data?.triples || data.triples.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodesMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    // Process each triple
    for (const triple of data.triples) {
      const subject = triple.subject;
      const predicate = triple.predicate;
      const object = triple.object;
      const vault = triple.triple_vault;
      const counterVault = triple.counter_term;

      // Calculate votes
      const forVotes = vault?.total_assets || '0';
      const againstVotes = counterVault?.total_assets || '0';
      const netVotes = (BigInt(forVotes) - BigInt(againstVotes)).toString();

      // Add founder node (subject)
      if (subject?.term_id && !nodesMap.has(subject.term_id)) {
        nodesMap.set(subject.term_id, {
          id: subject.term_id,
          label: subject.label || 'Unknown',
          type: 'founder',
          image: subject.image,
          emoji: subject.emoji,
          termId: subject.term_id,
        });
      }

      // Add predicate node
      if (predicate?.term_id && !nodesMap.has(predicate.term_id)) {
        nodesMap.set(predicate.term_id, {
          id: predicate.term_id,
          label: predicate.label || 'Unknown',
          type: 'predicate',
          termId: predicate.term_id,
        });
      }

      // Add totem node (object) with vote data
      if (object?.term_id) {
        // Update or create totem node with vote data
        const existingNode = nodesMap.get(object.term_id);
        if (existingNode) {
          // Accumulate votes if totem appears multiple times
          const prevFor = BigInt(existingNode.forVotes || '0');
          const prevAgainst = BigInt(existingNode.againstVotes || '0');
          existingNode.forVotes = (prevFor + BigInt(forVotes)).toString();
          existingNode.againstVotes = (prevAgainst + BigInt(againstVotes)).toString();
          existingNode.netVotes = (BigInt(existingNode.forVotes) - BigInt(existingNode.againstVotes)).toString();
        } else {
          nodesMap.set(object.term_id, {
            id: object.term_id,
            label: object.label || 'Unknown',
            type: 'totem',
            image: object.image,
            emoji: object.emoji,
            forVotes,
            againstVotes,
            netVotes,
            termId: object.term_id,
          });
        }
      }

      // Create edges for the triple relationship
      // Subject -> Predicate
      if (subject?.term_id && predicate?.term_id) {
        const edgeId1 = `${subject.term_id}->${predicate.term_id}`;
        if (!edges.find(e => e.id === edgeId1)) {
          edges.push({
            id: edgeId1,
            source: subject.term_id,
            target: predicate.term_id,
          });
        }
      }

      // Predicate -> Object (with weight based on votes)
      if (predicate?.term_id && object?.term_id) {
        const edgeId2 = `${predicate.term_id}->${object.term_id}-${triple.term_id}`;
        const weight = Math.max(1, Math.log10(Number(forVotes) / 1e18 + 1) * 10);
        edges.push({
          id: edgeId2,
          source: predicate.term_id,
          target: object.term_id,
          weight,
        });
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
    };
  }, [data]);

  const stats = useMemo(() => {
    const uniqueTotems = graphData.nodes.filter(n => n.type === 'totem').length;
    const uniquePredicates = graphData.nodes.filter(n => n.type === 'predicate').length;

    let totalVotesBigInt = 0n;
    for (const node of graphData.nodes) {
      if (node.type === 'totem' && node.forVotes) {
        totalVotesBigInt += BigInt(node.forVotes);
      }
    }

    return {
      totalNodes: graphData.nodes.length,
      totalEdges: graphData.edges.length,
      uniqueTotems,
      uniquePredicates,
      totalVotes: formatTrust(totalVotesBigInt),
    };
  }, [graphData]);

  return {
    graphData,
    loading,
    error: error ? new Error(error.message) : null,
    refetch,
    stats,
  };
}

/**
 * Hook to get graph data for all proposals (global view)
 */
export function useGlobalVoteGraph(): UseVoteGraphResult {
  const { loading, error, refetch } = useQuery(GET_FOUNDER_PROPOSALS, {
    variables: { founderName: '' },
    skip: true, // We'll implement this with GET_ALL_PROPOSALS later
  });

  // For now, return empty data - this can be expanded later
  return {
    graphData: { nodes: [], edges: [] },
    loading,
    error: error ? new Error(error.message) : null,
    refetch,
    stats: {
      totalNodes: 0,
      totalEdges: 0,
      uniqueTotems: 0,
      uniquePredicates: 0,
      totalVotes: '0',
    },
  };
}
