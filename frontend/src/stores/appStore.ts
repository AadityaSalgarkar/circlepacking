import { create } from 'zustand';
import type { Program } from '@/types';

export type DataSource = 'openevolve' | 'shinka';

interface AppState {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;

  currentCheckpoint: number;
  setCurrentCheckpoint: (checkpoint: number) => void;

  selectedProgram: Program | null;
  setSelectedProgram: (program: Program | null) => void;

  codePanelOpen: boolean;
  setCodePanelOpen: (open: boolean) => void;

  activeView: 'best' | 'gallery' | 'lineage' | 'metrics';
  setActiveView: (view: 'best' | 'gallery' | 'lineage' | 'metrics') => void;

  highlightFilter: 'none' | 'best' | 'archive' | 'island';
  setHighlightFilter: (filter: 'none' | 'best' | 'archive' | 'island') => void;
  highlightIsland: number | null;
  setHighlightIsland: (island: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  dataSource: 'shinka',
  setDataSource: (source) => set({
    dataSource: source,
    // Reset to first checkpoint/generation when switching sources
    currentCheckpoint: source === 'shinka' ? 19 : 100,
    selectedProgram: null,
    codePanelOpen: false,
  }),

  currentCheckpoint: 19,
  setCurrentCheckpoint: (checkpoint) => set({ currentCheckpoint: checkpoint }),

  selectedProgram: null,
  setSelectedProgram: (program) => set({ selectedProgram: program }),

  codePanelOpen: false,
  setCodePanelOpen: (open) => set({ codePanelOpen: open }),

  activeView: 'best',
  setActiveView: (view) => set({ activeView: view }),

  highlightFilter: 'best',
  setHighlightFilter: (filter) => set({ highlightFilter: filter }),
  highlightIsland: null,
  setHighlightIsland: (island) => set({ highlightIsland: island }),
}));
