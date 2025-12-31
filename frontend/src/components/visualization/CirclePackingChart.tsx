import { useEffect, useRef } from 'react';
import type { CircleData } from '@/types';

interface CirclePackingChartProps {
  circles: CircleData | null;
  size?: number;
  className?: string;
}

// Island colors matching the design
const ISLAND_COLORS = [
  'rgba(59, 130, 246, 0.6)',   // Blue
  'rgba(249, 115, 22, 0.6)',   // Orange
  'rgba(34, 197, 94, 0.6)',    // Green
  'rgba(239, 68, 68, 0.6)',    // Red
];

const ISLAND_BORDER_COLORS = [
  'rgba(59, 130, 246, 1)',
  'rgba(249, 115, 22, 1)',
  'rgba(34, 197, 94, 1)',
  'rgba(239, 68, 68, 1)',
];

export function CirclePackingChart({
  circles,
  size = 300,
  className = ''
}: CirclePackingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !circles || !circles.centers || !circles.radii) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    // Calculate padding and scale
    const padding = size * 0.05;
    const drawableSize = size - 2 * padding;

    // Transform functions: data coords (0-1) to canvas coords
    const toCanvasX = (x: number) => padding + x * drawableSize;
    const toCanvasY = (y: number) => padding + (1 - y) * drawableSize; // Flip Y
    const toCanvasR = (r: number) => r * drawableSize;

    // Draw unit square boundary
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(toCanvasX(0), toCanvasY(1), drawableSize, drawableSize);
    ctx.setLineDash([]);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const pos = i / 10;
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(toCanvasX(pos), toCanvasY(0));
      ctx.lineTo(toCanvasX(pos), toCanvasY(1));
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), toCanvasY(pos));
      ctx.lineTo(toCanvasX(1), toCanvasY(pos));
      ctx.stroke();
    }

    // Draw circles (sort by radius descending so smaller circles render on top)
    const indices = circles.centers.map((_, i) => i);
    indices.sort((a, b) => circles.radii[b] - circles.radii[a]);

    for (const i of indices) {
      const [x, y] = circles.centers[i];
      const r = circles.radii[i];

      // Skip circles outside the unit square
      if (x < -0.5 || x > 1.5 || y < -0.5 || y > 1.5) continue;

      const canvasX = toCanvasX(x);
      const canvasY = toCanvasY(y);
      const canvasR = toCanvasR(r);

      if (canvasR < 0.5) continue; // Skip very small circles

      ctx.beginPath();
      ctx.arc(canvasX, canvasY, canvasR, 0, Math.PI * 2);
      ctx.fillStyle = ISLAND_COLORS[i % ISLAND_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = ISLAND_BORDER_COLORS[i % ISLAND_BORDER_COLORS.length];
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw labels for sum of radii
    const sumRadii = circles.radii.reduce((a, b) => a + b, 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = `${Math.max(10, size / 25)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Σr = ${sumRadii.toFixed(4)}`, size - padding, size - padding / 2);

  }, [circles, size]);

  if (!circles || !circles.centers || !circles.radii) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--color-muted)] rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[var(--color-muted-foreground)] text-sm">No visualization</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`${className}`}
      style={{ width: size, height: size }}
    />
  );
}
