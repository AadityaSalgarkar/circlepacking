# Circle Packing with Opus 4.5 via Anannas AI

Run ShinkaEvolve's circle packing optimization using Claude Opus 4.5 through the Anannas AI API with local embeddings via LM Studio.

## Quick Start

```bash
# Edit .env with your Anannas API key, then:
make all
```

This will test connections, start evolution in tmux, and open the visualizer.

## Problem

Optimize placement of 26 circles in a unit square to maximize the sum of radii.
Best known result: sum of radii = 2.635

## Prerequisites

- Python 3.11+
- uv package manager
- Anannas API key (from https://anannas.ai/dashboard)
- LM Studio running locally (for embeddings)

## LM Studio Setup

1. Download and install LM Studio from https://lmstudio.ai/
2. Download an embedding model (e.g., `nomic-embed-text-v1.5`)
3. Start LM Studio server on port 1234 (default)
4. Verify server is running:
   ```bash
   curl http://localhost:1234/v1/models
   ```

## Installation

```bash
cd ShinkaEvolve
uv venv --python 3.11
source .venv/bin/activate
uv pip install -e .
```

## Configuration

Edit the `.env` file with your Anannas API key:

```bash
# .env file
ANANNAS_API_KEY=your_actual_anannas_api_key_here
OPENAI_API_KEY=sk-dummy-key-not-used-with-local-embeddings
```

## Usage

### Quick Test (20 generations)

```bash
shinka_launch \
    task=circle_packing \
    database=island_small \
    evolution=opus45_budget \
    cluster=local \
    evo_config.num_generations=20
```

### Standard Run (100 generations)

```bash
shinka_launch \
    task=circle_packing \
    database=island_large \
    evolution=opus45_budget \
    cluster=local
```

### Large Scale (300 generations, multi-island)

```bash
shinka_launch \
    task=circle_packing \
    database=island_large \
    evolution=opus45_budget \
    cluster=local \
    evo_config.num_generations=300 \
    evo_config.max_parallel_jobs=5
```

### Override Model via Command Line

Use any evolution config with Opus 4.5:

```bash
shinka_launch \
    task=circle_packing \
    database=island_large \
    evolution=small_budget \
    cluster=local \
    'evo_config.llm_models=["anthropic/claude-opus-4-5"]'
```

### Custom Embedding Model

Override the embedding model at runtime:

```bash
shinka_launch \
    task=circle_packing \
    evolution=opus45_budget \
    cluster=local \
    'evo_config.embedding_model="local-mxbai-embed-large-http://localhost:1234/v1"'
```

## Monitoring

Launch the WebUI to monitor evolution progress:

```bash
shinka_visualize --port 8888 --open
```

## Configuration Options

### Database Configs

| Config | Islands | Description |
|--------|---------|-------------|
| `island_small` | 2 | Quick experiments |
| `island_medium` | 4 | Balanced runs |
| `island_large` | 8+ | Maximum diversity |

### Evolution Configs

| Config | Generations | Parallel Jobs | Embedding |
|--------|-------------|---------------|-----------|
| `small_budget` | 20 | 1 | OpenAI |
| `medium_budget` | 100 | 3 | OpenAI |
| `large_budget` | 300 | 6 | OpenAI |
| `opus45_budget` | 100 | 3 | Local (LM Studio) |

### Key Parameters

```bash
evo_config.num_generations=N      # Number of evolution generations
evo_config.max_parallel_jobs=N    # Parallel evaluation jobs
evo_config.temperatures=[0.0,0.5] # LLM sampling temperatures
evo_config.max_tokens=16384       # Max tokens per LLM call
```

### Local Embedding Format

```
local-<model-name>-<url>
```

Examples:
- `local-nomic-embed-text-http://localhost:1234/v1`
- `local-mxbai-embed-large-http://localhost:1234/v1`
- `local-bge-small-en-http://localhost:8080/v1`

## Results

Results are saved to:
```
results/shinka_circle_packing/<timestamp>/
```

Contents:
- `evolution_db.sqlite` - Evolution database
- `best_program.py` - Best evolved solution
- `logs/` - Run logs
- `plots/` - Visualization outputs

## Troubleshooting

### LM Studio Connection

```bash
# Check if LM Studio is running
curl http://localhost:1234/v1/models

# Test embedding endpoint
curl http://localhost:1234/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "text-embedding-nomic-embed-text-v1.5", "input": "test"}'
```

### API Key Issues

```bash
# Verify environment variables are loaded
python -c "import os; print(os.environ.get('ANANNAS_API_KEY', 'NOT SET'))"
```

### Rate Limits

If hitting Anannas rate limits, reduce parallel jobs:
```bash
evo_config.max_parallel_jobs=1
```

### Connection Errors

Verify Anannas API connectivity:
```bash
curl -X POST https://api.anannas.ai/v1/chat/completions \
  -H "Authorization: Bearer $ANANNAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "anthropic/claude-opus-4-5", "messages": [{"role": "user", "content": "Hello"}]}'
```

## Makefile Commands

```bash
make help          # Show all commands
make start-lmstudio # Open LM Studio (macOS)
make test-embed    # Test local embedding endpoint
make test-anannas  # Test Anannas API connection
make test          # Run all tests
make run           # Start evolution in tmux (tests first)
make visualize     # Open visualization UI
make all           # Test, run, and visualize
make status        # Show tmux session status
make stop          # Stop tmux session
make clean         # Clean results directory
make quick-run     # Run without tests
```

### Override Parameters

```bash
make run GENERATIONS=100 DATABASE=island_large PARALLEL_JOBS=5
make run LMSTUDIO_PORT=8080 VISUALIZE_PORT=9999
```

## Architecture

ShinkaEvolve uses evolutionary algorithms with LLM-powered mutations:

1. **Population**: Programs on multiple islands evolve independently
2. **Mutation**: Opus 4.5 suggests code improvements (diff, full rewrite, crossover)
3. **Selection**: Best performers are selected for next generation
4. **Migration**: Programs migrate between islands for diversity
5. **Embeddings**: Local LM Studio provides code similarity embeddings

The circle packing evaluator validates:
- All circles within unit square bounds
- No circle overlaps
- Maximizes sum of radii
