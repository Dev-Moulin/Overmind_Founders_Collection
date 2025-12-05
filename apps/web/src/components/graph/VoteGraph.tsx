/**
 * VoteGraph - Interactive knowledge graph visualization
 *
 * Uses reagraph (WebGL) to render a force-directed graph of:
 * - Founders (subjects)
 * - Predicates (relationships)
 * - Totems (objects)
 *
 * Similar to the Intuition Portal graph visualization.
 *
 * @see Phase 10 in TODO_Implementation.md
 */

import { useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GraphCanvas, useSelection, lightTheme, darkTheme } from 'reagraph';
import type { GraphNode, GraphEdge } from '../../hooks/useVoteGraph';

/**
 * Color palette for node types
 */
const NODE_COLORS = {
  founder: '#64748b', // Slate
  predicate: '#475569', // Slate darker
  totem: '#10b981', // Green
};

/**
 * Node size based on type
 */
const NODE_SIZES = {
  founder: 12,
  predicate: 6,
  totem: 8,
};

interface VoteGraphProps {
  /** Graph nodes */
  nodes: GraphNode[];
  /** Graph edges */
  edges: GraphEdge[];
  /** Callback when a node is clicked */
  onNodeClick?: (node: GraphNode) => void;
  /** Callback when a node is double-clicked */
  onNodeDoubleClick?: (node: GraphNode) => void;
  /** Height of the graph container */
  height?: number | string;
  /** Whether to use dark theme */
  darkMode?: boolean;
  /** Layout algorithm */
  layoutType?: 'forceDirected2d' | 'forceDirected3d' | 'treeTd2d' | 'radialOut2d' | 'circular2d';
}


/**
 * Interactive knowledge graph visualization component
 *
 * @example
 * ```tsx
 * function FounderGraphView({ founderName }) {
 *   const { graphData, loading } = useVoteGraph(founderName);
 *
 *   if (loading) return <Spinner />;
 *
 *   return (
 *     <VoteGraph
 *       nodes={graphData.nodes}
 *       edges={graphData.edges}
 *       onNodeClick={(node) => console.log('Clicked:', node)}
 *       height={400}
 *       darkMode
 *     />
 *   );
 * }
 * ```
 */
export function VoteGraph({
  nodes,
  edges,
  onNodeClick,
  onNodeDoubleClick,
  height = 400,
  darkMode = true,
  layoutType = 'forceDirected2d',
}: VoteGraphProps) {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  // Transform nodes for reagraph format
  const graphNodes = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      label: node.emoji ? `${node.emoji} ${node.label}` : node.label,
      fill: NODE_COLORS[node.type],
      size: NODE_SIZES[node.type],
      data: node,
    }));
  }, [nodes]);

  // Transform edges for reagraph format
  const graphEdges = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      size: edge.weight ? Math.min(edge.weight, 5) : 1,
    }));
  }, [edges]);

  // Selection handling
  const {
    selections,
    actives,
    onNodeClick: handleNodeSelect,
    onCanvasClick,
  } = useSelection({
    ref: graphRef,
    nodes: graphNodes,
    edges: graphEdges,
    type: 'single',
  });

  // Handle node click with custom callback
  const handleNodeClick = useCallback(
    (node: { id: string; data?: GraphNode }) => {
      if (handleNodeSelect) {
        handleNodeSelect(node);
      }
      if (onNodeClick && node.data) {
        onNodeClick(node.data);
      }
    },
    [handleNodeSelect, onNodeClick]
  );

  // Handle node double-click
  const handleNodeDoubleClick = useCallback(
    (node: { id: string; data?: GraphNode }) => {
      if (onNodeDoubleClick && node.data) {
        onNodeDoubleClick(node.data);
      }
      // Center on node
      graphRef.current?.centerGraph([node.id]);
    },
    [onNodeDoubleClick]
  );

  // Custom theme based on dark mode
  const theme = useMemo(() => {
    const baseTheme = darkMode ? darkTheme : lightTheme;
    return {
      ...baseTheme,
      canvas: {
        ...baseTheme.canvas,
        background: 'transparent',
      },
      node: {
        ...baseTheme.node,
        label: {
          ...baseTheme.node.label,
          color: darkMode ? '#e5e7eb' : '#1f2937',
          fontSize: 10,
        },
      },
      edge: {
        ...baseTheme.edge,
        fill: darkMode ? '#4b5563' : '#9ca3af',
        activeFill: '#94a3b8',
      },
    };
  }, [darkMode]);

  // Empty state
  if (nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-white/5 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-white/20 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <p className="text-white/40 text-sm">{t('common.noRelationFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-900/50" style={{ height }}>
      <GraphCanvas
        ref={graphRef}
        nodes={graphNodes}
        edges={graphEdges}
        selections={selections}
        actives={actives}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onCanvasClick={onCanvasClick}
        theme={theme}
        layoutType={layoutType}
        labelType="all"
        draggable
        animated
        cameraMode="pan"
      />

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: NODE_COLORS.founder }}
          />
          <span className="text-xs text-white/60">{t('common.founder')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: NODE_COLORS.predicate }}
          />
          <span className="text-xs text-white/60">{t('common.relation')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: NODE_COLORS.totem }}
          />
          <span className="text-xs text-white/60">Totem</span>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={() => graphRef.current?.centerGraph()}
          className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded text-white/60 hover:text-white transition-colors"
          title="Recentrer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
        <button
          onClick={() => graphRef.current?.fitNodesInView()}
          className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded text-white/60 hover:text-white transition-colors"
          title="Ajuster la vue"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Compact version of the graph for smaller containers
 */
export function VoteGraphCompact({
  nodes,
  edges,
  onNodeClick,
  height = 200,
}: Omit<VoteGraphProps, 'layoutType' | 'darkMode'>) {
  return (
    <VoteGraph
      nodes={nodes}
      edges={edges}
      onNodeClick={onNodeClick}
      height={height}
      darkMode
      layoutType="radialOut2d"
    />
  );
}

/**
 * Graph with stats panel
 */
interface VoteGraphWithStatsProps extends VoteGraphProps {
  /** Stats to display */
  stats?: {
    totalNodes: number;
    totalEdges: number;
    uniqueTotems: number;
    uniquePredicates: number;
    totalVotes: string;
  };
}

export function VoteGraphWithStats({
  nodes,
  edges,
  stats,
  onNodeClick,
  height = 400,
  ...props
}: VoteGraphWithStatsProps) {
  return (
    <div className="space-y-2">
      <VoteGraph
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        height={height}
        {...props}
      />

      {stats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/5 rounded p-2">
            <div className="text-lg font-bold text-green-400">{stats.uniqueTotems}</div>
            <div className="text-xs text-white/50">Totems</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-lg font-bold text-white">{stats.totalEdges}</div>
            <div className="text-xs text-white/50">Connexions</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-lg font-bold text-slate-400">{stats.totalVotes}</div>
            <div className="text-xs text-white/50">Total TRUST</div>
          </div>
        </div>
      )}
    </div>
  );
}
