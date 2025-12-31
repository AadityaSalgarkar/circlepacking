import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { CheckpointTimeline } from '@/components/timeline/CheckpointTimeline';
import { BestSolution } from '@/components/best/BestSolution';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { CodePanel } from '@/components/code/CodePanel';
import { LineageGraph } from '@/components/lineage/LineageGraph';
import { MetricsChart } from '@/components/metrics/MetricsChart';
import { useAppStore } from '@/stores/appStore';
import { Trophy, LayoutGrid, GitBranch, LineChart } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { activeView, setActiveView } = useAppStore();

  return (
    <div className="min-h-screen bg-[var(--color-muted)] flex flex-col">
      <Header />
      <CheckpointTimeline />

      <main className="flex-1 p-6">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="best" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Best
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="lineage" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Lineage
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Metrics
            </TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm min-h-[600px]">
            <TabsContent value="best" className="m-0">
              <BestSolution />
            </TabsContent>

            <TabsContent value="gallery" className="m-0">
              <GalleryGrid />
            </TabsContent>

            <TabsContent value="lineage" className="m-0">
              <LineageGraph />
            </TabsContent>

            <TabsContent value="metrics" className="m-0">
              <MetricsChart />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <CodePanel />

      <footer className="bg-white border-t border-[var(--color-border)] px-6 py-4 text-center text-xs text-[var(--color-muted-foreground)]">
        Circle Packing Visualizer - Exploring evolutionary algorithm solutions
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
