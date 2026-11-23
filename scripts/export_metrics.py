"""Export every MetricFlow saved query to JSON for the dashboard.

Parses dbt against prod so MetricFlow reads curb_prod, runs `mf query --saved-query` for
each saved query in models/marts/_saved_queries.yml, and writes web/data/<name>.json:
the rows, plus each metric's label and description from the semantic manifest, so the
page shows names defined once in YAML. No numbers are computed here. Re-parses the
default (dev) target at the end so later mf queries point at dev again.

Filters: for each saved query that shows totals, also runs it once per combination of
the dashboard's filter dimensions (FILTER_DIMENSIONS) it doesn't already group by, and
stores those rows under "slices". The page shows the slice matching the active filters,
so every filtered number is still computed by MetricFlow. Only metrics built purely from
the mishaps semantic model can be sliced (net worth and episodes have no category or
loss kind); the rest are listed as not filterable and the page shows them unfiltered.

Run from the repo root with the venv active:  python scripts/export_metrics.py
"""

import csv
import json
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "target" / "semantic_manifest.json"
OUT_DIR = ROOT / "web" / "data"
PROD_SCHEMA = "curb_prod"

# the dashboard's filters, in the order the page shows them
FILTER_DIMENSIONS = [
    "episode__season",
    "mishap__loss_kind_category",
    "mishap__loss_kind",
    "mishap__is_catastrophic",  # "Everyday only": the totals without the divorce, fire and Latte Larry's
]
SLICEABLE_MODEL = "mishaps"
# saved queries whose page never filters them: export the rows only, no slices (the dent
# chart's slices were ~1.4 MB that every visitor downloaded for nothing). Remove a name here
# to make that chart filterable again.
UNSLICED_QUERIES = {"net_worth_dent"}


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


def query(metric_names, mf_args):
    """Run one mf query to CSV and return its rows, metric columns as numbers."""
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "out.csv"
        run("mf", "query", *mf_args, "--csv", str(csv_path))
        with csv_path.open(newline="") as f:
            rows = list(csv.DictReader(f))
    # dimension columns stay text, as MetricFlow returned them
    for row in rows:
        for name in metric_names:
            row[name] = to_number(row[name])
    return rows


def cli_name(group_by):
    """TimeDimension('metric_time', 'year') -> metric_time__year; Dimension('a') -> a."""
    names = re.findall(r"'([^']+)'", group_by)
    return "__".join(names)


def sliceable_metrics(manifest):
    """Metrics whose every input measure lives in the mishaps semantic model."""
    mishap_measures = {
        measure["name"]
        for model in manifest["semantic_models"] if model["name"] == SLICEABLE_MODEL
        for measure in model["measures"]
    }
    return {
        metric["name"]
        for metric in manifest["metrics"]
        if {m["name"] for m in metric["type_params"]["input_measures"]} <= mishap_measures
    }


def slices(saved_query, sliceable):
    """Rows for every combination of filter dimensions the saved query doesn't group by."""
    params = saved_query["query_params"]
    group_by = [cli_name(g) for g in params["group_by"]]
    if "mishap" in group_by:
        return [], {}  # one row per mishap: the page filters these rows directly
    if saved_query["name"] in UNSLICED_QUERIES:
        return [], {}
    metric_names = [m for m in params["metrics"] if m in sliceable]
    if not metric_names:
        return [], {}  # nothing the filters can slice (e.g. the forecast)
    extra = [d for d in FILTER_DIMENSIONS if d not in group_by]
    wheres = [w["where_sql_template"] for w in (params["where"] or {}).get("where_filters", [])]
    result = {}
    for size in range(1, len(extra) + 1):
        for dims in combinations(extra, size):
            mf_args = ["--metrics", ",".join(metric_names), "--group-by", ",".join(group_by + list(dims))]
            for where in wheres:
                mf_args += ["--where", where]
            result["+".join(dims)] = query(metric_names, mf_args)
    return metric_names, result


def export(saved_query, metric_info, sliceable, exported_at):
    metric_names = saved_query["query_params"]["metrics"]
    rows = query(metric_names, ["--saved-query", saved_query["name"]])
    filterable, sliced = slices(saved_query, sliceable)

    output = {
        "name": saved_query["name"],
        "label": saved_query["label"],
        "description": saved_query["description"],
        "metrics": [metric_info[name] for name in metric_names],
        "rows": rows,
        "filterable_metrics": filterable,
        "slices": sliced,
        "exported_at": exported_at,
        "source": PROD_SCHEMA,
    }
    path = OUT_DIR / f"{saved_query['name']}.json"
    path.write_text(json.dumps(output, indent=2) + "\n")
    print(f"{path.relative_to(ROOT)}: {len(rows)} rows, {len(sliced)} filter slices")


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
        sliceable = sliceable_metrics(manifest)
        for saved_query in manifest["saved_queries"]:
            export(saved_query, metric_info, sliceable, exported_at)
    finally:
        run("dbt", "parse")


if __name__ == "__main__":
    main()
