import { useCheckpoint } from "@/hooks/useCheckpointData";
import { useAppStore } from "@/stores/appStore";
import { SolutionCard } from "./SolutionCard";

export function GalleryGrid() {
  const { currentCheckpoint } = useAppStore();
  const { data: checkpoint, isLoading } = useCheckpoint(currentCheckpoint);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-64 bg-[var(--color-muted)] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!checkpoint) {
    return (
      <div className="p-6 text-center text-[var(--color-muted-foreground)]">
        No checkpoint data available
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
          Archive - {checkpoint.archive.length} Elite Solutions
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {checkpoint.archive.map((programId) => (
          <SolutionCard
            key={programId}
            programId={programId}
            isArchive
            isBest={programId === checkpoint.best_program_id}
          />
        ))}
      </div>
    </div>
  );
}
