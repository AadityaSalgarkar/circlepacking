import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CirclePackingChart } from "@/components/visualization/CirclePackingChart";
import { useCheckpoint, useProgram } from "@/hooks/useCheckpointData";
import { useAppStore } from "@/stores/appStore";
import { Circle, Trophy } from "lucide-react";

function MetricDisplay({ label, value, unit = "" }: { label: string; value: number | undefined; unit?: string }) {
  return (
    <div className="text-center p-4 bg-[var(--color-muted)] rounded-lg">
      <div className="text-xs text-[var(--color-muted-foreground)] mb-1 uppercase tracking-wide">{label}</div>
      <div className="font-mono font-bold text-2xl">
        {value !== undefined ? value.toFixed(4) : "N/A"}{unit}
      </div>
    </div>
  );
}

export function BestSolution() {
  const { currentCheckpoint, setSelectedProgram, setCodePanelOpen } = useAppStore();
  const { data: checkpoint, isLoading: checkpointLoading } = useCheckpoint(currentCheckpoint);
  const { data: bestProgram } = useProgram(checkpoint?.best_program_id ?? null);

  const handleViewCode = () => {
    if (bestProgram) {
      setSelectedProgram(bestProgram);
      setCodePanelOpen(true);
    }
  };

  if (checkpointLoading || !checkpoint) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-[var(--color-muted)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Best Solution</h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Checkpoint {currentCheckpoint} - Generation {bestProgram?.generation ?? 0}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="text-sm px-3 py-1">
              Iteration {checkpoint.iteration}
            </Badge>
            {bestProgram && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Island {bestProgram.island}
              </Badge>
            )}
          </div>
        </div>

        {/* Main visualization */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <CirclePackingChart
                circles={bestProgram?.circles ?? null}
                size={500}
                className="rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricDisplay
            label="Combined Score"
            value={checkpoint.best_metrics.combined_score}
          />
          <MetricDisplay
            label="Sum of Radii"
            value={checkpoint.best_metrics.sum_radii}
          />
          <MetricDisplay
            label="Target Ratio"
            value={checkpoint.best_metrics.target_ratio}
          />
          <MetricDisplay
            label="Validity"
            value={checkpoint.best_metrics.validity}
          />
        </div>

        {/* Program info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-[var(--color-primary)]" fill="currentColor" />
                <span className="font-semibold">Program Details</span>
              </div>
              <button
                onClick={handleViewCode}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
              >
                View Code
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-[var(--color-muted-foreground)] mb-1">Program ID</div>
                <div className="font-mono text-xs bg-[var(--color-muted)] px-2 py-1 rounded">
                  {checkpoint.best_program_id}
                </div>
              </div>
              <div>
                <div className="text-[var(--color-muted-foreground)] mb-1">Generation</div>
                <div className="font-semibold">{bestProgram?.generation ?? 0}</div>
              </div>
              <div>
                <div className="text-[var(--color-muted-foreground)] mb-1">Island</div>
                <div className="font-semibold">{bestProgram?.island ?? 0}</div>
              </div>
              <div>
                <div className="text-[var(--color-muted-foreground)] mb-1">Found at Iteration</div>
                <div className="font-semibold">{bestProgram?.iteration_found ?? 0}</div>
              </div>
            </div>

            {bestProgram?.parent_id && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="text-[var(--color-muted-foreground)] text-sm mb-1">Parent Program</div>
                <div className="font-mono text-xs bg-[var(--color-muted)] px-2 py-1 rounded inline-block">
                  {bestProgram.parent_id}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
