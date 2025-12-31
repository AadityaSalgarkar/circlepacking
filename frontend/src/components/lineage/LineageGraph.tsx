import { useEffect, useRef, useMemo, useState } from 'react';
import { useLineage, useCheckpoint } from '@/hooks/useCheckpointData';
import { useAppStore } from '@/stores/appStore';
import type { LineageNode } from '@/types';

const BASE_URL = import.meta.env.BASE_URL;

const ISLAND_COLORS = [
  '#1f77b4', // blue
  '#ff7f0e', // orange
  '#2ca02c', // green
  '#d62728', // red
];

interface NodePosition {
  x: number;
  y: number;
  node: LineageNode;
}

export function LineageGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setSelectedProgram, setCodePanelOpen, currentCheckpoint } = useAppStore();
  const { data: lineage, isLoading } = useLineage();
  const { data: checkpoint } = useCheckpoint(currentCheckpoint);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  // Compute layout
  const layout = useMemo(() => {
    if (!lineage) return null;

    const { nodes, edges } = lineage;

    // Build adjacency lists
    const children = new Map<string, string[]>();
    const parents = new Map<string, string>();
    edges.forEach(edge => {
      if (!children.has(edge.source)) children.set(edge.source, []);
      children.get(edge.source)!.push(edge.target);
      parents.set(edge.target, edge.source);
    });

    // Group by generation for hierarchical layout
    const generations = new Map<number, LineageNode[]>();
    nodes.forEach(node => {
      const gen = node.generation;
      if (!generations.has(gen)) generations.set(gen, []);
      generations.get(gen)!.push(node);
    });

    // Compute positions
    const positions = new Map<string, NodePosition>();
    const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b);
    const maxGen = sortedGens[sortedGens.length - 1] || 0;

    // Calculate spacing
    const horizontalSpacing = Math.min(160, (dimensions.width - 100) / (maxGen + 1));
    const padding = 50;

    sortedGens.forEach((gen) => {
      const nodesInGen = generations.get(gen)!;
      const verticalSpacing = Math.min(50, (dimensions.height - 100) / nodesInGen.length);

      nodesInGen.forEach((node, nodeIndex) => {
        positions.set(node.id, {
          x: padding + gen * horizontalSpacing,
          y: padding + nodeIndex * verticalSpacing + (verticalSpacing / 2),
          node
        });
      });
    });

    return { positions, nodes, edges, children, parents };
  }, [lineage, dimensions]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, rect.width - 40),
          height: Math.max(400, rect.height - 40)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Render canvas
  useEffect(() => {
    if (!layout || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const { positions, edges } = layout;
    const currentProgramIds = new Set(checkpoint?.program_ids || []);

    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw subtle grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < dimensions.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
    }
    for (let y = 0; y < dimensions.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();
    }

    // Draw edges
    edges.forEach(edge => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) return;

      const isHighlighted =
        hoveredNode === edge.source ||
        hoveredNode === edge.target;

      ctx.beginPath();
      ctx.strokeStyle = isHighlighted ? '#2563eb' : '#e2e8f0';
      ctx.lineWidth = isHighlighted ? 2 : 1;

      // Bezier curve
      const midX = (source.x + target.x) / 2;
      ctx.moveTo(source.x, source.y);
      ctx.bezierCurveTo(midX, source.y, midX, target.y, target.x, target.y);
      ctx.stroke();
    });

    // Draw nodes
    positions.forEach((pos) => {
      const { x, y, node } = pos;
      const isInCurrentCheckpoint = currentProgramIds.has(node.id);
      const isHovered = hoveredNode === node.id;
      const isBest = checkpoint?.best_program_id === node.id;

      // Node size based on score
      const baseRadius = 8;
      const scoreBonus = (node.metrics.combined_score || 0) * 8;
      let radius = baseRadius + scoreBonus;

      if (isHovered) radius *= 1.3;
      if (isBest) radius *= 1.2;

      // Draw glow for current checkpoint nodes
      if (isInCurrentCheckpoint) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = `${ISLAND_COLORS[node.island % 4]}20`;
        ctx.fill();
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = ISLAND_COLORS[node.island % 4];
      ctx.fill();

      // Border
      ctx.strokeStyle = isInCurrentCheckpoint ? '#1e40af' : '#ffffff';
      ctx.lineWidth = isInCurrentCheckpoint ? 3 : 2;
      ctx.stroke();

      // Best indicator
      if (isBest) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Generation label for larger nodes
      if (radius > 12) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px IBM Plex Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${node.generation}`, x, y);
      }
    });

    // Draw legend
    ctx.font = '12px IBM Plex Sans';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Islands:', 10, dimensions.height - 60);

    ISLAND_COLORS.forEach((color, i) => {
      const lx = 80 + i * 80;
      ctx.beginPath();
      ctx.arc(lx, dimensions.height - 60, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillText(`${i}`, lx + 15, dimensions.height - 56);
    });

    ctx.fillStyle = '#64748b';
    ctx.fillText('Node size = score | Bright border = current checkpoint | Yellow ring = best', 10, dimensions.height - 30);

  }, [layout, hoveredNode, dimensions, checkpoint]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!layout || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found = false;
    for (const [nodeId, pos] of layout.positions) {
      const radius = 8 + (pos.node.metrics.combined_score || 0) * 8;
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

      if (dist <= radius + 5) {
        setHoveredNode(nodeId);
        found = true;
        break;
      }
    }

    if (!found) setHoveredNode(null);
  };

  const handleCanvasClick = async (_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!layout || !hoveredNode) return;

    const response = await fetch(`${BASE_URL}data/programs/${hoveredNode}.json`);
    if (response.ok) {
      const program = await response.json();
      setSelectedProgram(program);
      setCodePanelOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[600px]">
        <div className="text-[var(--color-muted-foreground)]">Loading lineage graph...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-6 h-full min-h-[600px]">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
        className="border border-[var(--color-border)] rounded-lg cursor-pointer bg-white shadow-inner"
        style={{ width: dimensions.width, height: dimensions.height }}
      />

      {/* Tooltip */}
      {hoveredNode && layout?.positions.get(hoveredNode) && (
        <div className="absolute pointer-events-none bg-white border border-[var(--color-border)] rounded-lg shadow-lg p-3 text-sm">
          <div className="font-mono text-xs text-[var(--color-muted-foreground)]">
            {hoveredNode.slice(0, 8)}...
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
            <div>Generation: <strong>{layout.positions.get(hoveredNode)!.node.generation}</strong></div>
            <div>Island: <strong>{layout.positions.get(hoveredNode)!.node.island}</strong></div>
            <div>Score: <strong>{((layout.positions.get(hoveredNode)!.node.metrics.combined_score || 0) * 100).toFixed(1)}%</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
