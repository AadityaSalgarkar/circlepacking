import { useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { useIndex } from "@/hooks/useCheckpointData";
import { useAppStore } from "@/stores/appStore";
import { Clock } from "lucide-react";

export function CheckpointTimeline() {
  const { currentCheckpoint, setCurrentCheckpoint, dataSource } = useAppStore();
  const { data: index, isLoading } = useIndex();

  // Reset to valid checkpoint when data source changes
  useEffect(() => {
    if (index && !index.checkpoints.includes(currentCheckpoint)) {
      setCurrentCheckpoint(index.checkpoints[index.checkpoints.length - 1]);
    }
  }, [index, currentCheckpoint, setCurrentCheckpoint]);

  if (isLoading || !index) {
    return (
      <div className="px-6 py-4 bg-white border-b border-[var(--color-border)] animate-pulse">
        <div className="h-10 bg-[var(--color-muted)] rounded" />
      </div>
    );
  }

  const checkpoints = index.checkpoints;
  const currentIndex = checkpoints.indexOf(currentCheckpoint);
  const isShinka = dataSource === 'shinka';
  const unitLabel = isShinka ? 'Generation' : 'Iteration';
  const pluralLabel = isShinka ? 'generations' : 'checkpoints';

  const handleSliderChange = (value: number[]) => {
    const newIndex = value[0];
    if (newIndex >= 0 && newIndex < checkpoints.length) {
      setCurrentCheckpoint(checkpoints[newIndex]);
    }
  };

  return (
    <div className="px-6 py-4 bg-white border-b border-[var(--color-border)]">
      <div className="flex items-center gap-6">
        {/* Label */}
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] min-w-[100px]">
          <Clock className="w-4 h-4" />
          <span>{unitLabel}</span>
        </div>

        {/* Slider */}
        <div className="flex-1 relative px-2">
          <Slider
            value={[currentIndex >= 0 ? currentIndex : 0]}
            onValueChange={handleSliderChange}
            max={checkpoints.length - 1}
            step={1}
            className="w-full"
          />

          {/* Tick marks */}
          <div className="flex justify-between mt-2">
            {checkpoints.map((cp) => (
              <button
                key={cp}
                onClick={() => setCurrentCheckpoint(cp)}
                className={`
                  text-xs font-mono transition-all duration-200
                  ${cp === currentCheckpoint
                    ? 'text-[var(--color-primary)] font-bold scale-110'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  }
                `}
              >
                {cp}
              </button>
            ))}
          </div>

          {/* Progress indicator dots */}
          <div className="absolute top-[9px] left-2 right-2 flex justify-between pointer-events-none">
            {checkpoints.map((cp, idx) => (
              <div
                key={cp}
                className={`
                  w-2 h-2 rounded-full transition-all duration-200
                  ${idx <= currentIndex
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-muted)]'
                  }
                  ${cp === currentCheckpoint ? 'ring-2 ring-[var(--color-primary)]/30 scale-150' : ''}
                `}
              />
            ))}
          </div>
        </div>

        {/* Current value display */}
        <div className="min-w-[140px] text-right">
          <div className="text-3xl font-mono font-bold text-[var(--color-foreground)]">
            {currentCheckpoint}
          </div>
          <div className="text-xs text-[var(--color-muted-foreground)]">
            of {checkpoints[checkpoints.length - 1]} {isShinka ? 'generations' : 'iterations'}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-6 text-xs text-[var(--color-muted-foreground)]">
        <div>
          <span className="font-medium">{index.total_programs}</span> total programs
        </div>
        <div>
          <span className="font-medium">{index.total_edges}</span> lineage connections
        </div>
        <div>
          <span className="font-medium">{checkpoints.length}</span> {pluralLabel}
        </div>
      </div>
    </div>
  );
}
