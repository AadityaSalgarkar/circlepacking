import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CirclePackingChart } from "@/components/visualization/CirclePackingChart";
import { useProgram } from "@/hooks/useCheckpointData";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

interface SolutionCardProps {
  programId: string;
  isArchive?: boolean;
  isBest?: boolean;
  onClick?: () => void;
}

const islandVariants = ["island0", "island1", "island2", "island3"] as const;

export function SolutionCard({ programId, isArchive, isBest, onClick }: SolutionCardProps) {
  const { data: program, isLoading } = useProgram(programId);
  const { setSelectedProgram, setCodePanelOpen } = useAppStore();

  const handleClick = () => {
    if (program) {
      setSelectedProgram(program);
      setCodePanelOpen(true);
    }
    onClick?.();
  };

  if (isLoading || !program) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-4 bg-[var(--color-muted)] rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-[var(--color-muted)] rounded" />
        </CardContent>
      </Card>
    );
  }

  const score = program.metrics.combined_score ?? 0;
  const scorePercent = (score * 100).toFixed(1);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-[var(--color-primary)]/50",
        isBest && "ring-2 ring-[var(--color-primary)]",
        isArchive && "bg-gradient-to-br from-white to-blue-50/50"
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[var(--color-muted-foreground)] truncate max-w-[120px]">
            {program.id.slice(0, 8)}...
          </span>
          <div className="flex gap-1">
            <Badge variant={islandVariants[program.island % 4]}>
              I{program.island}
            </Badge>
            <Badge variant="secondary">G{program.generation}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visualization thumbnail */}
        <div className="mb-3 flex justify-center">
          <CirclePackingChart
            circles={program.circles}
            size={150}
            className="rounded-lg border border-[var(--color-border)]"
          />
        </div>

        {/* Score bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--color-muted-foreground)]">Score</span>
            <span className="font-mono font-medium">{scorePercent}%</span>
          </div>
          <div className="h-2 bg-[var(--color-muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all"
              style={{ width: `${score * 100}%` }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[var(--color-muted-foreground)]">Sum Radii</span>
            <div className="font-mono font-medium">
              {program.metrics.sum_radii?.toFixed(3) ?? "N/A"}
            </div>
          </div>
          <div>
            <span className="text-[var(--color-muted-foreground)]">Validity</span>
            <div className="font-mono font-medium">
              {program.metrics.validity === 1 ? "Valid" : "Invalid"}
            </div>
          </div>
        </div>

        {/* Change description */}
        {program.changes && (
          <div className="mt-2 text-xs text-[var(--color-muted-foreground)] truncate">
            {program.changes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
