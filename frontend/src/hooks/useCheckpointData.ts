import { useQuery } from '@tanstack/react-query';
import type { CheckpointData, IndexData, Program, LineageData, MetricsTimelinePoint } from '@/types';
import { useAppStore, type DataSource } from '@/stores/appStore';

function getBasePath(source: DataSource): string {
  return source === 'shinka' ? '/data/shinka' : '/data';
}

function getCheckpointPath(source: DataSource): string {
  // ShinkaEvolve uses "generations" folder but same file naming
  return source === 'shinka' ? '/data/shinka/generations' : '/data/checkpoints';
}

export function useIndex() {
  const dataSource = useAppStore((state) => state.dataSource);

  return useQuery<IndexData>({
    queryKey: ['index', dataSource],
    queryFn: async () => {
      const response = await fetch(`${getBasePath(dataSource)}/index.json`);
      if (!response.ok) throw new Error('Failed to load index');
      return response.json();
    },
    staleTime: Infinity,
  });
}

export function useCheckpoint(checkpoint: number) {
  const dataSource = useAppStore((state) => state.dataSource);

  return useQuery<CheckpointData>({
    queryKey: ['checkpoint', checkpoint, dataSource],
    queryFn: async () => {
      const response = await fetch(`${getCheckpointPath(dataSource)}/checkpoint_${checkpoint}.json`);
      if (!response.ok) throw new Error(`Failed to load checkpoint ${checkpoint}`);
      return response.json();
    },
    staleTime: Infinity,
  });
}

export function useProgram(programId: string | null) {
  const dataSource = useAppStore((state) => state.dataSource);

  return useQuery<Program>({
    queryKey: ['program', programId, dataSource],
    queryFn: async () => {
      if (!programId) throw new Error('No program ID');
      const response = await fetch(`${getBasePath(dataSource)}/programs/${programId}.json`);
      if (!response.ok) throw new Error(`Failed to load program ${programId}`);
      return response.json();
    },
    enabled: !!programId,
    staleTime: Infinity,
  });
}

export function useLineage() {
  const dataSource = useAppStore((state) => state.dataSource);

  return useQuery<LineageData>({
    queryKey: ['lineage', dataSource],
    queryFn: async () => {
      const response = await fetch(`${getBasePath(dataSource)}/lineage.json`);
      if (!response.ok) throw new Error('Failed to load lineage');
      return response.json();
    },
    staleTime: Infinity,
  });
}

export function useMetricsTimeline() {
  const dataSource = useAppStore((state) => state.dataSource);

  return useQuery<MetricsTimelinePoint[]>({
    queryKey: ['metrics-timeline', dataSource],
    queryFn: async () => {
      const response = await fetch(`${getBasePath(dataSource)}/metrics_timeline.json`);
      if (!response.ok) throw new Error('Failed to load metrics timeline');
      return response.json();
    },
    staleTime: Infinity,
  });
}
