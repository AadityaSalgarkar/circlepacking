# Circle Packing Evolution

LLM-powered evolutionary optimization for the circle packing problem, with real-time visualization.

## The Problem

Pack 26 circles inside a unit square such that the sum of their radii is maximized. The best known result achieves a sum of approximately **2.635**.

This is a classic geometric optimization problem that serves as an excellent benchmark for evolutionary algorithms.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│              React + Vite Visualization Dashboard           │
│    (metrics, lineage graphs, solution gallery, timeline)    │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ reads checkpoints
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────────┐               ┌─────────────────────┐
│    MyOpenEvolve     │               │    ShinkaEvolve     │
│  (AlphaEvolve impl) │               │  (Sakana AI impl)   │
│                     │               │                     │
│  • OpenAI-compatible│               │  • Multi-island     │
│  • Async evaluation │               │  • Hydra configs    │
│  • Multi-objective  │               │  • Slurm support    │
└─────────────────────┘               └─────────────────────┘
```

## Components

### `frontend/`

React + TypeScript dashboard for visualizing evolution progress.

**Features:**
- Circle packing visualization
- Metrics charts (scores over generations)
- Solution gallery with code viewer
- Lineage graph (evolutionary family tree)
- Checkpoint timeline

**Quick start:**
```bash
cd frontend
npm install
npm run dev
```

### `MyOpenEvolve/`

Open-source implementation of Google DeepMind's AlphaEvolve.

**Features:**
- Works with any OpenAI-compatible API
- Distributed async evaluation
- Checkpoint system for resuming runs

**Quick start:**
```bash
cd MyOpenEvolve
pip install -e .
python openevolve-run.py examples/circle_packing/initial.py \
    examples/circle_packing/evaluator.py \
    --config examples/circle_packing/config.yaml
```

See `MyOpenEvolve/README.md` for full documentation.

### `ShinkaEvolve/`

Sakana AI's framework for sample-efficient program evolution.

**Features:**
- Multi-island evolutionary algorithm
- Local model support (LM Studio)
- Hydra-based configuration

**Quick start:**
```bash
cd ShinkaEvolve
uv venv --python 3.11 && source .venv/bin/activate
uv pip install -e .
shinka_launch variant=circle_packing_example
```

See `ShinkaEvolve/README.md` for full documentation.

## Live Demo

Frontend visualization: https://aadityasalgarkar.github.io/circlepacking/

## License

- MyOpenEvolve: Apache 2.0
- ShinkaEvolve: MIT
- Frontend: MIT
