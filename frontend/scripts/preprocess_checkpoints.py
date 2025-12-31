#!/usr/bin/env python3
"""
Preprocess OpenEvolve checkpoint data into static JSON for React frontend.
Generates visualizations for each program.
"""

import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

# Paths
CHECKPOINT_SOURCE = Path("/Users/aaditya/repos/circlepacking/MyOpenEvolve/examples/circle_packing/openevolve_output/checkpoints")
EXAMPLE_DIR = Path("/Users/aaditya/repos/circlepacking/MyOpenEvolve/examples/circle_packing")
OUTPUT_DIR = Path("/Users/aaditya/repos/circlepacking/frontend/public/data")
SCRIPT_DIR = Path(__file__).parent


def extract_circle_data(code: str) -> dict | None:
    """Extract circle positions and radii from program code."""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            extract_code = f'''
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend - prevents window opening
import matplotlib.pyplot as plt
plt.ioff()  # Turn off interactive mode

import json
import numpy as np

{code}

try:
    result = None
    try:
        result = run_packing()
    except NameError:
        try:
            result = construct_packing()
        except NameError:
            try:
                result = solve()
            except NameError:
                pass

    if result is not None:
        if len(result) == 3:
            centers, radii, _ = result
        else:
            centers, radii = result

        # Convert to JSON-serializable format
        data = {{
            "centers": centers.tolist() if hasattr(centers, 'tolist') else list(centers),
            "radii": radii.tolist() if hasattr(radii, 'tolist') else list(radii)
        }}
        print("SUCCESS:" + json.dumps(data))
    else:
        print("ERROR: No valid function found")
except Exception as e:
    print(f"ERROR: {{e}}")
'''
            f.write(extract_code)
            temp_file = f.name

        venv_python = SCRIPT_DIR / ".venv" / "bin" / "python"
        result = subprocess.run(
            [str(venv_python), temp_file],
            capture_output=True,
            text=True,
            timeout=60
        )

        os.unlink(temp_file)

        if "SUCCESS:" in result.stdout:
            json_str = result.stdout.split("SUCCESS:")[1].strip()
            return json.loads(json_str)
        return None

    except subprocess.TimeoutExpired:
        return None
    except Exception as e:
        return None


def process_checkpoints():
    """Main processing function."""

    # Create output directories
    (OUTPUT_DIR / "checkpoints").mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "programs").mkdir(parents=True, exist_ok=True)

    all_programs: dict[str, Any] = {}
    metrics_timeline: list[dict] = []
    lineage_edges: list[dict] = []

    # Find checkpoint directories
    checkpoint_dirs = sorted(
        [d for d in CHECKPOINT_SOURCE.iterdir() if d.is_dir() and d.name.startswith("checkpoint_")],
        key=lambda x: int(x.name.split("_")[1])
    )

    print(f"Found {len(checkpoint_dirs)} checkpoints")

    # First pass: collect all programs
    for checkpoint_dir in checkpoint_dirs:
        checkpoint_num = int(checkpoint_dir.name.split("_")[1])
        print(f"\nReading checkpoint {checkpoint_num}...")

        metadata_path = checkpoint_dir / "metadata.json"
        best_info_path = checkpoint_dir / "best_program_info.json"

        metadata = json.loads(metadata_path.read_text()) if metadata_path.exists() else {}
        best_info = json.loads(best_info_path.read_text()) if best_info_path.exists() else {}

        programs_dir = checkpoint_dir / "programs"
        checkpoint_programs = []

        if programs_dir.exists():
            for prog_file in programs_dir.glob("*.json"):
                prog_data = json.loads(prog_file.read_text())
                prog_id = prog_data.get("id", prog_file.stem)

                program_entry = {
                    "id": prog_id,
                    "code": prog_data.get("code", ""),
                    "parent_id": prog_data.get("parent_id"),
                    "generation": prog_data.get("generation", 0),
                    "iteration_found": prog_data.get("iteration_found", 0),
                    "metrics": prog_data.get("metrics", {}),
                    "island": prog_data.get("metadata", {}).get("island", 0),
                    "changes": prog_data.get("metadata", {}).get("changes", ""),
                    "parent_metrics": prog_data.get("metadata", {}).get("parent_metrics"),
                    "first_seen_checkpoint": checkpoint_num
                }

                if prog_id not in all_programs:
                    all_programs[prog_id] = program_entry

                if prog_data.get("parent_id"):
                    lineage_edges.append({
                        "source": prog_data["parent_id"],
                        "target": prog_id,
                        "checkpoint": checkpoint_num
                    })

                checkpoint_programs.append(prog_id)

        # Create checkpoint summary
        checkpoint_data = {
            "checkpoint": checkpoint_num,
            "iteration": metadata.get("last_iteration", checkpoint_num),
            "best_program_id": metadata.get("best_program_id"),
            "best_metrics": best_info.get("metrics", {}),
            "feature_map": metadata.get("feature_map", {}),
            "islands": metadata.get("islands", []),
            "archive": metadata.get("archive", []),
            "island_generations": metadata.get("island_generations", []),
            "program_count": len(checkpoint_programs),
            "program_ids": checkpoint_programs
        }

        checkpoint_output = OUTPUT_DIR / "checkpoints" / f"checkpoint_{checkpoint_num}.json"
        checkpoint_output.write_text(json.dumps(checkpoint_data, indent=2))

        if best_info.get("metrics"):
            metrics_timeline.append({
                "checkpoint": checkpoint_num,
                "iteration": best_info.get("iteration", checkpoint_num),
                **best_info["metrics"]
            })

    # Second pass: extract circle data for each program
    print(f"\n\nExtracting circle data for {len(all_programs)} programs...")

    success_count = 0
    fail_count = 0

    for i, (prog_id, prog_data) in enumerate(all_programs.items()):
        code = prog_data.get("code", "")
        if not code:
            fail_count += 1
            continue

        # Check for any valid function
        has_func = any(f in code for f in ["def run_packing", "def construct_packing", "def solve"])
        if not has_func:
            fail_count += 1
            continue

        print(f"  [{i+1}/{len(all_programs)}] Extracting {prog_id[:8]}...", end=" ")

        circle_data = extract_circle_data(code)
        if circle_data:
            prog_data["circles"] = circle_data
            print("OK")
            success_count += 1
        else:
            prog_data["circles"] = None
            print("FAILED")
            fail_count += 1

    print(f"\nExtraction complete: {success_count} succeeded, {fail_count} failed")

    # Save program files with circle data
    print(f"\nSaving {len(all_programs)} program files...")
    for prog_id, prog_data in all_programs.items():
        prog_output = OUTPUT_DIR / "programs" / f"{prog_id}.json"
        prog_output.write_text(json.dumps(prog_data, indent=2))

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

    (OUTPUT_DIR / "metrics_timeline.json").write_text(json.dumps(metrics_timeline, indent=2))
    print(f"Saved metrics timeline ({len(metrics_timeline)} points)")

    index_data = {
        "checkpoints": [int(d.name.split("_")[1]) for d in checkpoint_dirs],
        "total_programs": len(all_programs),
        "total_edges": len(unique_edges)
    }
    (OUTPUT_DIR / "index.json").write_text(json.dumps(index_data, indent=2))
    print(f"\nCreated index: {index_data}")

    print("\nPreprocessing complete!")


if __name__ == "__main__":
    process_checkpoints()
