"""Export every MetricFlow saved query to JSON for the dashboard.

Parses dbt against prod so MetricFlow reads curb_prod, runs `mf query --saved-query` for
each saved query in models/marts/_saved_queries.yml, and writes web/data/<name>.json:
the rows, plus each metric's label and description from the semantic manifest, so the
page shows names defined once in YAML. No numbers are computed here. Re-parses the
default (dev) target at the end so later mf queries point at dev again.

Run from the repo root with the venv active:  python scripts/export_metrics.py
"""

import csv
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "target" / "semantic_manifest.json"
OUT_DIR = ROOT / "web" / "data"
PROD_SCHEMA = "curb_prod"


def run(*args):
    """Run a command from the repo root; on failure print its output and stop."""
    result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"`{' '.join(args)}` failed:\n{result.stdout}\n{result.stderr}")


def load_manifest():
    manifest = json.loads(MANIFEST.read_text())
    schemas = {model["node_relation"]["schema_name"] for model in manifest["semantic_models"]}
    if schemas != {PROD_SCHEMA}:
        sys.exit(f"Semantic manifest points at {schemas}, not {PROD_SCHEMA}; not exporting.")
    return manifest


def to_number(value):
    """CSV gives text; metric values become numbers (blank becomes null)."""
    if value == "":
        return None
    number = float(value)
    return int(number) if number.is_integer() else number


def export(saved_query, metric_info, exported_at):
    metric_names = saved_query["query_params"]["metrics"]
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "out.csv"
        run("mf", "query", "--saved-query", saved_query["name"], "--csv", str(csv_path))
        with csv_path.open(newline="") as f:
            rows = list(csv.DictReader(f))

    # metric columns become numbers; dimension columns stay text, as MetricFlow returned them
    for row in rows:
        for name in metric_names:
            row[name] = to_number(row[name])

    output = {
        "name": saved_query["name"],
        "label": saved_query["label"],
        "description": saved_query["description"],
        "metrics": [metric_info[name] for name in metric_names],
        "rows": rows,
        "exported_at": exported_at,
        "source": PROD_SCHEMA,
    }
    path = OUT_DIR / f"{saved_query['name']}.json"
    path.write_text(json.dumps(output, indent=2) + "\n")
    print(f"{path.relative_to(ROOT)}: {len(rows)} rows")


def main():
    exported_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    run("dbt", "parse", "--target", "prod")
    try:
        manifest = load_manifest()
        metric_info = {
            metric["name"]: {
                "name": metric["name"],
                "label": metric["label"],
                "description": (metric["description"] or "").strip(),
            }
            for metric in manifest["metrics"]
        }
        for saved_query in manifest["saved_queries"]:
            export(saved_query, metric_info, exported_at)
    finally:
        run("dbt", "parse")


if __name__ == "__main__":
    main()
