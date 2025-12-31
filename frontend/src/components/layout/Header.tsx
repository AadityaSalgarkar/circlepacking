import { Circle, Github, ChevronDown } from "lucide-react";
import { useAppStore, type DataSource } from "@/stores/appStore";

const DATA_SOURCES: { value: DataSource; label: string }[] = [
  { value: 'openevolve', label: 'OpenEvolve' },
  { value: 'shinka', label: 'ShinkaEvolve' },
];

export function Header() {
  const { dataSource, setDataSource } = useAppStore();

  return (
    <header className="bg-white border-b border-[var(--color-border)] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-blue-700">
            <Circle className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">
              Circle Packing Visualizer
            </h1>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Evolution Explorer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Data Source Selector */}
          <div className="relative">
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as DataSource)}
              className="appearance-none bg-[var(--color-muted)] border border-[var(--color-border)] rounded-lg px-4 py-2 pr-8 text-sm font-medium cursor-pointer hover:bg-[var(--color-muted)]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            >
              {DATA_SOURCES.map(source => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)] pointer-events-none" />
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>Source</span>
          </a>
        </div>
      </div>
    </header>
  );
}
