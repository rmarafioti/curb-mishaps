# CLAUDE.md — curb-mishaps

Read this, then `docs/PROJECT_BRIEF.md` (the why, the data rules, the metric list). Rich steers; you write the SQL and YAML.

## What this repo is

A portfolio project showing the dbt semantic layer (MetricFlow): **define a metric once, use it everywhere**. The data is the money Larry David's character loses through mishaps across 12 seasons of *Curb Your Enthusiasm* (2000–2024), compared with his real net worth.

```
Google Sheet (master, Rich edits)
  └─ BigQuery external table  curb_raw.mishaps        (dbt-external-tables, live)
seeds/ld_net_worth_cpi.csv  (the used columns of the "LD Net Worth" tab)
  └─ dbt: staging → dims/facts → MetricFlow semantic models + metrics
       └─ mf query → JSON/CSV exports → Next.js page (web/, later)
```

Stack: BigQuery · dbt Core 1.10+ · MetricFlow (`mf`) · SQLFluff · Next.js. Python 3.12 in `.venv` (MetricFlow does not support 3.15+).

## Hard rules (the project's thesis depends on these)

1. **Metrics live only in MetricFlow YAML.** No metric logic in marts, in the Next.js app, or in ad-hoc SQL. Charts and AI answers request metrics by name and slice by dimensions.
2. **No custom SQL behind a chart.** If a chart needs a query `mf query` can't express, stop and raise it with Rich; don't write a workaround.
3. **Never key anything on `row_id`.** It is renumbered after review (a past merge put 20 corrections on the wrong rows). The natural key is `episode_id` + `mishap_num` (Sheet column Y: 1, 2, 3... within an episode, 0 = no-mishap placeholder). `mishap_key` is the surrogate of those two and the mishap's unique identifier (count mishaps with it). Numbers are assigned once and never renumbered: a new mishap takes the next unused number in its episode, and gaps from deleted rows stay.
4. **Net worth is semi-additive.** Never `sum()` it across years or after joining to mishaps (fan-out). Aggregate mishaps to the year first, or let MetricFlow do it via `non_additive_dimension`.
5. **Nominal dollars are the default.** `mishap_cost` is in dollars of the year the episode aired. `mishap_cost_2026` (CPI-adjusted) is only for the cost trend and the forecast.
6. **One divorce.** The 2011 show divorce (row with `is_catastrophic`) is the only divorce; net worth already has the real 2007 divorce added back (`net_worth_adj_*`).
7. **Don't edit the Google Sheet from code** unless Rich asks. The Sheet is the source of truth; the warehouse reads it.

## Layout

```
models/
  staging/      stg_<source>.sql, views, 1:1 with source rows, cast + rename only
                + stg_<source>.yml each; _sources.yml (external table def)
  intermediate/ int_<thing>.sql + .yml, only when a step is reused or too big for one model
  core/         shared dims: dim_date (calendar + MetricFlow time spine) + dim_date.yml
  marts/        dim_episode, dim_net_worth, fct_mishap, each with its own .yml;
                _semantic_models.yml, _metrics.yml
seeds/          ld_net_worth_cpi.csv + ld_net_worth_cpi.yml
DEFINITIONS.md  column definitions as {% docs %} blocks (top level; see .dbtignore)
macros/         small helpers (clean_usd)
docs/           PROJECT_BRIEF.md, SETUP.md, mockups
web/            Next.js app (later)
```

## Commands

```bash
source .venv/bin/activate
dbt deps                                    # packages
dbt run-operation stage_external_sources    # (re)create curb_raw.mishaps from the Sheet
dbt run-operation stage_external_sources --vars "ext_full_refresh: true"   # after Sheet column changes
dbt seed                                    # load ld_net_worth_cpi
dbt build                                   # run + test everything
dbt build -s +fct_mishap                    # one model and its parents
sqlfluff lint models/                       # lint; `sqlfluff fix models/` to autofix
mf validate-configs                         # semantic layer checks
mf query --metrics total_mishap_loss --group-by metric_time__year
```

Definition of done for any change: `sqlfluff lint` clean, `dbt build` green, `mf validate-configs` green (once metrics exist).

## SQL conventions

- Every SQL file (models, tests, analyses) opens with a short `--` comment header (regular SQL comments, not `{# #}`, so the editor highlights them): 2-4 lines on what the file does and why, enough for another engineer to understand its intent. Not a copy of the yml description; the yml carries the grain and detail.
- CTEs, never subqueries. Import CTEs first (`select * from {{ ref() }}` / `{{ source() }}`), then logic CTEs, then a final `select * from <last_cte>`.
- **Never name a CTE the same as one of its own output columns** (BigQuery resolves the name as a STRUCT). Use suffixes: `source_mishaps`, `mishap_counts`, `year_summary`.
- Staging: the source CTE (`source_<thing>`) selects only the columns used downstream, renamed, straight from `{{ source() }}` / `{{ ref() }}`. No `select *` import CTE. The Sheet keeps every column (unused external-table columns are dropped here); a seed we write ourselves holds only the columns the models use.
- Lowercase keywords and functions, 4-space indent, explicit `as` for aliases.
- Trailing comma after the last column in every column list (including the one before `from`); the final `select * from <cte>` has none. A convention, not linted (CV03 is off).
- Aliases are padded out by hand and lined up in one column per select, far enough right to read cleanly, e.g. `basis                                   as net_worth_basis`. Not linted (LT01 is off); keep it tidy yourself.
- Sheet columns arrive as text, so staging casts every non-text column with plain `cast`, never `safe_cast`: a bad cell should fail the build with the value in the error, not turn into a silent null. Money columns use `{{ clean_usd() }}`, which strips `$` and `,` and keeps `safe_cast` inside the macro.
- `safe_divide(numerator, denominator)`: check the argument order every time.
- Wrap multi-condition `case` / `and` / `or` logic in parentheses; don't rely on precedence.
- **No booleans.** Flags are `int64` 1/0, `is_` / `has_` prefixed, so they can be summed and averaged (`sum(mishap_cost * is_catastrophic)`). The Sheet stores them as 1/0 too; staging only casts. Labels like Yes/True belong in the dashboard. Money columns end in `_usd` (or `_musd` for millions). Dates end in `_date`.
- Staging: views, one per source, no joins, no filters except dropping fully blank rows.
- Keys: `dbt_utils.generate_surrogate_key`.

## YAML conventions

- Every `.sql` model and every seed `.csv` gets its own `.yml` with the same name, next to it (`fct_mishap.sql` + `fct_mishap.yml`). Never combine models in one file. `_sources.yml` for sources.
- Give every column a `data_type`.
- **Model, seed and source descriptions are inline in their .yml** and start with the grain (`Grain: one row per ...`), so a reviewer sees what the model is without leaving the file.
- **Column descriptions are never inline.** Each is a `{% docs %}` block in the top-level `DEFINITIONS.md`, referenced as `description: '{{ doc("name") }}'`. Name blocks after the column; prefix when the same name means different things (e.g. `net_worth_year_start_date`). `docs-paths` is the repo root and `.dbtignore` excludes every other `.md`, so don't put `{% docs %}` blocks anywhere else.
- Generic tests use `data_tests:` with `arguments:` (dbt 1.10+ syntax).
- Lists in model YAML are block style (one `- item` per line), never inline `['a', 'b']`.
- **Test the grain, not every column.** A single-column grain gets `unique` + `not_null` on that column; a multi-column grain gets one model-level `dbt_utils.unique_combination_of_columns` (never use it for one column). No blanket `unique` / `not_null` / `relationships` / `accepted_values` per column. Add a column test only when it catches a Sheet error that would otherwise silently change a number (e.g. a typo in `review_status = 'keep'` dropping a row). Put it on the column the metrics actually use (`fct_mishap.mishap_cost`, not the staging inputs behind it). No comments on tests; they should read as self-explanatory. Generated tables with no human input (`dim_date`, built by `dbt_utils.date_spine`) get no tests.
- Every model and every column used by a metric gets a description. `persist_docs` is on, so descriptions show up in BigQuery.

## Data rules you'll need when modeling

- Only `review_status = 'keep'` and `has_mishap = 1` rows reach `fct_mishap`. `has_mishap = 0` rows still feed `dim_episode`.
- Cost rule: `mishap_cost = if(amount_stated = 1, amount_stated_usd, est_mid_usd)`. Low/high estimates stay for ranges and the forecast.
- **Hypothetical losses always count toward the total.** Never filter `loss_kind` out of `fct_mishap` or `total_mishap_loss`; `realized` / `hypothetical` is only a slice. Reconciling to the Sheet's `Losses by Year` tab shows it if they ever go missing.
- `is_catastrophic` comes from Sheet column X (1/0 on every row). Today: house fire, 2011 divorce, Latte Larry's.
- Dates: `episode_date` (Sheet `air_date`) joins `fct_mishap` to `dim_date.date_day`; `episode_year` is parsed from it and joins to `dim_net_worth.year`. The Sheet's `air_year` column is not used.
- `review_status = 'unsure'` rows (incl. unwatched S12 episodes) stay out of the fact table until Rich reviews them; they flow in on the next build once marked `keep`.
- `loss_kind` (realized | hypothetical) → `loss_kind_category` (12 categories; see `stg_mishaps.yml`).
- `needs_verification` and `estimate_source` are Sheet-only working columns; they never leave staging.
- Each season aired within one calendar year, so `episode_year` is safe as the join to net worth.
- In the semantic layer, don't pre-join net worth onto mishap rows. Give `dim_net_worth` a `year_start_date` time dimension (year grain, `non_additive_dimension`) and let MetricFlow align it with mishaps on `metric_time__year`.

## Gotchas

- The external table reads Sheet columns **by position** (A–X). Adding, removing or moving a Sheet column means updating `_sources.yml` and running `stage_external_sources` with `ext_full_refresh: true`.
- BigQuery reads every Sheet row that has **anything** in it, including just a number format. Formatting cells below the data (e.g. currency on R:T) shows up as blank rows and fails the `not_null` tests on `stg_mishaps`. Fix it in the Sheet (delete those rows or clear their formatting), not with a filter. Don't trim the grid's other empty rows either: the `Losses by Year` tab's formulas read fixed ranges (`Mishaps!$X$2:$X$296`), and new rows past row 296 would fall outside them.
- The Sheet must be shared (Viewer) with the dbt service account email, and the profile needs the Drive scope, or queries fail with "Permission denied while getting Drive credentials".
- `dim_date` is registered as MetricFlow's time spine (`time_spine:` in `models/core/dim_date.yml`). Keep its range covering every date a metric or forecast uses (now 2000–2028).
- BigQuery has no exact median aggregate (`percentile_cont` is window-only). For the Median metrics use `agg: percentile` with `use_approximate_percentile: true`; on ~100 rows it is effectively exact. Confirm with `mf validate-configs`.
- `profiles.yml` lives at the repo root (copied from `profiles.example.yml`, gitignored). dbt and SQLFluff read it from there. The key lives in `~/.gcp/`. Never commit either, or `.env`.

## Dev → prod

- All work builds in `curb_dev` (the default target). Never run `--target prod` on a branch.
- Promote only after the change is merged to `main` and dev is green:
  `dbt build` passes, `sqlfluff lint models/` is clean, `mf validate-configs` passes.
- Promote with `dbt build --target prod`, then reconcile: prod total `mishap_cost`
  must equal dev's (and the Sheet's `Losses by Year` tab).
- The dashboard and every export read `curb_prod` only. The export script runs
  `dbt parse --target prod` before any `mf query`, so MetricFlow points at prod.
- Ask Rich before any prod build.

## Git

- `main` is always green. Work on a branch (`feat/fct-mishap`, `fix/stg-casts`), open a PR, merge.
- Commit messages: imperative, short subject (`add stg_mishaps with casts and tests`).
- Ask before pushing or opening a PR.

## Current task list

1. ~~Sources: external table on the Mishaps tab; seed for net worth; `dim_date`~~ (done)
2. ~~`dim_net_worth`, `dim_episode`, `fct_mishap`; reconciled to $262,024,688 (101 rows)~~ (done, PR #1)
3. `_semantic_models.yml`, `_metrics.yml` per `docs/losses_by_year_mockup.md` (names already match the built models)
4. Reconcile `mf query` output to the Sheet's `Losses by Year` tab (total $262.02M as of 2026-11-19)
5. Export script (`mf query --csv`) → `web/` Next.js page (after all data is in)
