import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CirclePackingChart } from "@/components/visualization/CirclePackingChart";
import { Highlight, themes } from "prism-react-renderer";
import { useAppStore } from "@/stores/appStore";
import { ArrowRight, GitBranch } from "lucide-react";

const islandVariants = ["island0", "island1", "island2", "island3"] as const;

function MetricsComparison({ current, parent }: { current: Record<string, number>; parent: Record<string, number> | null }) {
  if (!parent) return null;

  const metrics = ['combined_score', 'sum_radii', 'target_ratio'];

  return (
    <div className="mt-4 p-4 bg-[var(--color-muted)] rounded-lg">
      <div className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2 uppercase tracking-wide">
        Improvement from Parent
      </div>
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const curr = current[metric] ?? 0;
          const prev = parent[metric] ?? 0;
          const diff = curr - prev;
          const isPositive = diff > 0;

          return (
            <div key={metric} className="text-center">
              <div className="text-xs text-[var(--color-muted-foreground)] mb-1">
                {metric.replace(/_/g, ' ')}
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
                  {prev.toFixed(3)}
                </span>
                <ArrowRight className="w-3 h-3" />
                <span className="font-mono text-sm font-medium">
                  {curr.toFixed(3)}
                </span>
              </div>
              <div className={`text-xs font-mono ${isPositive ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-[var(--color-muted-foreground)]'}`}>
                {isPositive ? '+' : ''}{diff.toFixed(4)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CodePanel() {
  const { selectedProgram, codePanelOpen, setCodePanelOpen } = useAppStore();

  if (!selectedProgram) return null;

  return (
    <Sheet open={codePanelOpen} onOpenChange={setCodePanelOpen}>
      <SheetContent className="w-[700px] sm:max-w-[700px] overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-mono text-sm flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Program {selectedProgram.id.slice(0, 8)}...
          </SheetTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={islandVariants[selectedProgram.island % 4]}>
              Island {selectedProgram.island}
            </Badge>
            <Badge variant="secondary">Generation {selectedProgram.generation}</Badge>
            <Badge variant="outline">Iteration {selectedProgram.iteration_found}</Badge>
            {selectedProgram.changes && (
              <Badge variant="outline" className="bg-yellow-50">
                {selectedProgram.changes}
              </Badge>
            )}
          </div>

          {/* Visualization */}
          <div className="mt-4 flex justify-center">
            <CirclePackingChart
              circles={selectedProgram.circles}
              size={250}
              className="rounded-lg border border-[var(--color-border)]"
            />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            <div className="p-2 bg-[var(--color-muted)] rounded">
              <div className="text-xs text-[var(--color-muted-foreground)]">Score</div>
              <div className="font-mono font-semibold">
                {(selectedProgram.metrics.combined_score * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 bg-[var(--color-muted)] rounded">
              <div className="text-xs text-[var(--color-muted-foreground)]">Sum Radii</div>
              <div className="font-mono font-semibold">
                {selectedProgram.metrics.sum_radii?.toFixed(3)}
              </div>
            </div>
            <div className="p-2 bg-[var(--color-muted)] rounded">
              <div className="text-xs text-[var(--color-muted-foreground)]">Target</div>
              <div className="font-mono font-semibold">
                {selectedProgram.metrics.target_ratio?.toFixed(3)}
              </div>
            </div>
            <div className="p-2 bg-[var(--color-muted)] rounded">
              <div className="text-xs text-[var(--color-muted-foreground)]">Validity</div>
              <div className={`font-mono font-semibold ${selectedProgram.metrics.validity === 1 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedProgram.metrics.validity === 1 ? 'Valid' : 'Invalid'}
              </div>
            </div>
          </div>

          {/* Parent comparison */}
          <MetricsComparison
            current={selectedProgram.metrics as unknown as Record<string, number>}
            parent={selectedProgram.parent_metrics as unknown as Record<string, number> | null}
          />

          {selectedProgram.parent_id && (
            <div className="mt-2 text-xs text-[var(--color-muted-foreground)]">
              Parent: <span className="font-mono">{selectedProgram.parent_id.slice(0, 8)}...</span>
            </div>
          )}
        </SheetHeader>

        {/* Code viewer */}
        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
          <Highlight
            theme={themes.github}
            code={selectedProgram.code}
            language="python"
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${className} text-sm leading-relaxed p-4 rounded-lg border border-[var(--color-border)] overflow-x-auto`}
                style={{ ...style, backgroundColor: '#f8fafc' }}
              >
                {tokens.map((line, i) => {
                  const lineContent = line.map(t => t.content).join('');
                  const isEvolveMarker = lineContent.includes('EVOLVE-BLOCK');

                  return (
                    <div
                      key={i}
                      {...getLineProps({ line })}
                      className={isEvolveMarker ? 'bg-blue-100 -mx-4 px-4 border-l-4 border-[var(--color-primary)]' : ''}
                    >
                      <span className="inline-block w-10 text-[var(--color-muted-foreground)] select-none text-right pr-4 opacity-50">
                        {i + 1}
                      </span>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
