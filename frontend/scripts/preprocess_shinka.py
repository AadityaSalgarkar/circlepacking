#!/usr/bin/env python3
"""
Preprocess ShinkaEvolve data into static JSON for React frontend.
Loads circle data directly from extra.npz files (no code execution needed).
"""

import json
import sqlite3
from pathlib import Path
from typing import Any

import numpy as np

# Paths
SHINKA_SOURCE = Path("/Users/aaditya/repos/circlepacking/ShinkaEvolve/results/shinka_circle_packing/2025.12.30193142_example")
OUTPUT_DIR = Path("/Users/aaditya/repos/circlepacking/frontend/public/data/shinka")


def process_shinka():
    """Main processing function."""

    # Create output directories
    (OUTPUT_DIR / "generations").mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "programs").mkdir(parents=True, exist_ok=True)

    all_programs: dict[str, Any] = {}
    metrics_timeline: list[dict] = []
    lineage_edges: list[dict] = []

    # Find generation directories
    gen_dirs = sorted(
        [d for d in SHINKA_SOURCE.iterdir() if d.is_dir() and d.name.startswith("gen_")],
        key=lambda x: int(x.name.split("_")[1])
    )

    print(f"Found {len(gen_dirs)} generations")

    # Read from SQLite for parent relationships
    db_path = SHINKA_SOURCE / "evolution_db.sqlite"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all programs from DB
    cursor.execute("""
        SELECT id, code, parent_id, generation, combined_score, public_metrics, private_metrics
        FROM programs
        ORDER BY generation
    """)
    db_programs = {row['id']: dict(row) for row in cursor.fetchall()}
    conn.close()

    print(f"Found {len(db_programs)} programs in database")

    # Process each generation directory
    for gen_dir in gen_dirs:
        gen_num = int(gen_dir.name.split("_")[1])
        print(f"\nProcessing generation {gen_num}...")

        # Read code
        main_py = gen_dir / "main.py"
        code = main_py.read_text() if main_py.exists() else ""

        # Read metrics
        metrics_path = gen_dir / "results" / "metrics.json"
        metrics = {}
        if metrics_path.exists():
            metrics = json.loads(metrics_path.read_text())

        # Load circle data from npz
        npz_path = gen_dir / "results" / "extra.npz"
        circles = None
        if npz_path.exists():
            try:
                data = np.load(npz_path)
                circles = {
                    "centers": data["centers"].tolist(),
                    "radii": data["radii"].tolist()
                }
            except Exception as e:
                print(f"  Warning: Could not load {npz_path}: {e}")

        # Find matching program in DB by generation
        # Match by looking at combined_score
        combined_score = metrics.get("combined_score", 0)
        prog_id = None
        parent_id = None

        for pid, prog in db_programs.items():
            if prog["generation"] == gen_num:
                # Use score matching or just take first match
                if abs((prog["combined_score"] or 0) - combined_score) < 0.001:
                    prog_id = pid
                    parent_id = prog["parent_id"]
                    break

        if not prog_id:
            # Generate ID if not found
            prog_id = f"gen_{gen_num}"

        program_entry = {
            "id": prog_id,
            "code": code,
            "parent_id": parent_id,
            "generation": gen_num,
            "iteration_found": gen_num,
            "metrics": {
                "validity": 1.0 if metrics.get("num_invalid_runs", 0) == 0 else 0.0,
                "sum_radii": metrics.get("combined_score", 0),
                "target_ratio": metrics.get("combined_score", 0) / 2.635 if metrics.get("combined_score") else 0,
                "combined_score": metrics.get("combined_score", 0) / 2.635 if metrics.get("combined_score") else 0,
            },
            "island": 0,
            "changes": "",
            "parent_metrics": None,
            "first_seen_checkpoint": gen_num,
            "circles": circles
        }

        all_programs[prog_id] = program_entry

        if parent_id and parent_id in all_programs:
            program_entry["parent_metrics"] = all_programs[parent_id]["metrics"]

        if parent_id:
            lineage_edges.append({
                "source": parent_id,
                "target": prog_id,
                "checkpoint": gen_num
            })

        # Add to timeline
        metrics_timeline.append({
            "checkpoint": gen_num,
            "iteration": gen_num,
            "validity": program_entry["metrics"]["validity"],
            "sum_radii": program_entry["metrics"]["sum_radii"],
            "target_ratio": program_entry["metrics"]["target_ratio"],
            "combined_score": program_entry["metrics"]["combined_score"]
        })

    # Process best solution
    best_dir = SHINKA_SOURCE / "best"
    best_prog_id = None
    best_score = 0

    if best_dir.exists():
        print("\nProcessing best solution...")
        main_py = best_dir / "main.py"
        code = main_py.read_text() if main_py.exists() else ""

        metrics_path = best_dir / "results" / "metrics.json"
        metrics = {}
        if metrics_path.exists():
            metrics = json.loads(metrics_path.read_text())

        npz_path = best_dir / "results" / "extra.npz"
        circles = None
        if npz_path.exists():
            try:
                data = np.load(npz_path)
                circles = {
                    "centers": data["centers"].tolist(),
                    "radii": data["radii"].tolist()
                }
            except Exception as e:
                print(f"  Warning: Could not load {npz_path}: {e}")

        best_prog_id = "best"
        best_score = metrics.get("combined_score", 0)

        program_entry = {
            "id": best_prog_id,
            "code": code,
            "parent_id": None,
            "generation": max(int(d.name.split("_")[1]) for d in gen_dirs),
            "iteration_found": 0,
            "metrics": {
                "validity": 1.0,
                "sum_radii": best_score,
                "target_ratio": best_score / 2.635 if best_score else 0,
                "combined_score": best_score / 2.635 if best_score else 0,
            },
            "island": 0,
            "changes": "Best solution",
            "parent_metrics": None,
            "first_seen_checkpoint": 0,
            "circles": circles
        }
        all_programs[best_prog_id] = program_entry

    # Save program files
    print(f"\nSaving {len(all_programs)} program files...")
    for prog_id, prog_data in all_programs.items():
        prog_output = OUTPUT_DIR / "programs" / f"{prog_id}.json"
        prog_output.write_text(json.dumps(prog_data, indent=2))

    # Create generation summaries (similar to checkpoint summaries)
    for gen_dir in gen_dirs:
        gen_num = int(gen_dir.name.split("_")[1])
        # Include ALL programs discovered up to and including this generation
        gen_programs = [pid for pid, p in all_programs.items()
                       if p["generation"] <= gen_num and pid != "best"]

        # Find best program at this generation
        best_at_gen = max(
            [(pid, p["metrics"]["sum_radii"]) for pid, p in all_programs.items() if p["generation"] <= gen_num],
            key=lambda x: x[1],
            default=(None, 0)
        )

        gen_data = {
            "checkpoint": gen_num,  # Keep same field name for compatibility
            "iteration": gen_num,
            "best_program_id": best_at_gen[0],
            "best_metrics": all_programs[best_at_gen[0]]["metrics"] if best_at_gen[0] else {},
            "feature_map": {},
            "islands": [],
            "archive": gen_programs,  # All programs up to this generation
            "island_generations": [],
            "program_count": len(gen_programs),
            "program_ids": gen_programs
        }

        gen_output = OUTPUT_DIR / "generations" / f"checkpoint_{gen_num}.json"
        gen_output.write_text(json.dumps(gen_data, indent=2))

    # Deduplicate lineage edges
    unique_edges = list({(e["source"], e["target"]): e for e in lineage_edges}.values())

    # Build lineage graph
    lineage_nodes = []
    for prog_id, prog_data in all_programs.items():
        lineage_nodes.append({
            "id": prog_id,
            "generation": prog_data["generation"],
            "island": prog_data["island"],
            "metrics": prog_data["metrics"],
            "has_children": any(e["source"] == prog_id for e in unique_edges),
            "has_circles": prog_data.get("circles") is not None
        })

    lineage_data = {
        "nodes": lineage_nodes,
        "edges": unique_edges
    }
    (OUTPUT_DIR / "lineage.json").write_text(json.dumps(lineage_data, indent=2))
    print(f"Saved lineage graph ({len(lineage_nodes)} nodes, {len(unique_edges)} edges)")

    # Sort timeline by generation
    metrics_timeline.sort(key=lambda x: x["checkpoint"])
    (OUTPUT_DIR / "metrics_timeline.json").write_text(json.dumps(metrics_timeline, indent=2))
    print(f"Saved metrics timeline ({len(metrics_timeline)} points)")

    # Create index
    index_data = {
        "checkpoints": sorted([int(d.name.split("_")[1]) for d in gen_dirs]),
        "total_programs": len(all_programs),
        "total_edges": len(unique_edges),
        "source": "shinka",
        "label": "ShinkaEvolve"
    }
    (OUTPUT_DIR / "index.json").write_text(json.dumps(index_data, indent=2))
    print(f"\nCreated index: {index_data}")

    print("\nPreprocessing complete!")


if __name__ == "__main__":
    process_shinka()
