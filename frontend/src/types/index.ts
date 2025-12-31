export interface ProgramMetrics {
  validity: number;
  sum_radii: number;
  target_ratio: number;
  combined_score: number;
  eval_time?: number;
}

export interface CircleData {
  centers: number[][];
  radii: number[];
}

export interface Program {
  id: string;
  code: string;
  parent_id: string | null;
  generation: number;
  iteration_found: number;
  metrics: ProgramMetrics;
  island: number;
  changes: string;
  parent_metrics: ProgramMetrics | null;
  first_seen_checkpoint: number;
  circles: CircleData | null;
}

export interface CheckpointData {
  checkpoint: number;
  iteration: number;
  best_program_id: string;
  best_metrics: ProgramMetrics;
  feature_map: Record<string, string>;
  islands: string[][];
  archive: string[];
  island_generations: number[];
  program_count: number;
  program_ids: string[];
}

export interface LineageNode {
  id: string;
  generation: number;
  island: number;
  metrics: ProgramMetrics;
  has_children: boolean;
}

export interface LineageEdge {
  source: string;
  target: string;
  checkpoint: number;
}

export interface LineageData {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface MetricsTimelinePoint {
  checkpoint: number;
  iteration: number;
  validity: number;
  sum_radii: number;
  target_ratio: number;
  combined_score: number;
}

export interface IndexData {
  checkpoints: number[];
  total_programs: number;
  total_edges: number;
  source?: string;
  label?: string;
}
