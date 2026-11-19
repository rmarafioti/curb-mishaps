# CLAUDE.md — curb-mishaps

Read this, then `docs/PROJECT_BRIEF.md` (the why, the data rules, the metric list). Rich steers; you write the SQL and YAML.

## What this repo is

A portfolio project showing the dbt semantic layer (MetricFlow): **define a metric once, use it everywhere**. The data is the money Larry David's character loses through mishaps across 12 seasons of *Curb Your Enthusiasm* (2000–2024), compared with his real net worth.

```
Google Sheet (master, Rich edits)
  └─ BigQuery external table  curb_raw.mishaps        (dbt-external-tables, live)
seeds/ld_net_worth_cpi.csv  (copy of the "LD Net Worth" tab)
  └─ dbt: staging → dims/facts → MetricFlow semantic models + metrics
       └─ mf query → JSON/CSV exports → Next.js page (web/, later)
```

Stack: BigQuery · dbt Core 1.10+ · MetricFlow (`mf`) · SQLFluff · Next.js. Python 3.12 in `.venv` (MetricFlow does not support 3.15+).

## Hard rules (the project's thesis depends on these)

1. **Metrics live only in MetricFlow YAML.** No metric logic in marts, in the Next.js app, or in ad-hoc SQL. Charts and AI answers request metrics by name and slice by dimensions.
2. **No custom SQL behind a chart.** If a chart needs a query `mf query` can't express, stop and raise it with Rich; don't write a workaround.
3. **Never key anything on `row_id`.** It is renumbered after review (a past merge put 20 corrections on the wrong rows). The natural key is `episode_id` + `mishap_num` (Sheet column Y: 1, 2, 3... within an episode, 0 = no-mishap placeholder). `mishap_id` is the surrogate of those two. Numbers are assigned once and never renumbered: a new mishap takes the next unused number in its episode, and gaps from deleted rows stay.
4. **Net worth is semi-additive.** Never `sum()` it across years or after joining to mishaps (fan-out). Aggregate mishaps to the year first, or let MetricFlow do it via `non_additive_dimension`.
5. **Nominal dollars are the default.** `mishap_cost` is in the air year's dollars. `mishap_cost_2026` (CPI-adjusted) is only for the cost trend and the forecast.
6. **One divorce.** The 2011 show divorce (row with `is_catastrophic`) is the only divorce; net worth already has the real 2007 divorce added back (`net_worth_adj_*`).
7. **Don't edit the Google Sheet from code** unless Rich asks. The Sheet is the source of truth; the warehouse reads it.

## Layout

```
models/
  staging/      stg_<source>.sql, views, 1:1 with source rows, cast + rename only
                _sources.yml (external table def), _stg_models.yml (docs + tests)
  intermediate/ int_<thing>.sql, only when a step is reused or too big for one model
  marts/        dim_date (calendar + MetricFlow time spine), dim_episode, dim_net_worth,
                fct_mishap; _marts_models.yml, _semantic_models.yml, _metrics.yml
seeds/          ld_net_worth_cpi.csv + _seeds.yml
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

- CTEs, never subqueries. Import CTEs first (`select * from {{ ref() }}` / `{{ source() }}`), then logic CTEs, then a final `select * from <last_cte>`.
- **Never name a CTE the same as one of its own output columns** (BigQuery resolves the name as a STRUCT). Use suffixes: `source_mishaps`, `mishap_counts`, `year_summary`.
- Lowercase keywords and functions, 4-space indent, trailing commas, explicit `as` for aliases.
- `safe_cast` for anything coming from the Sheet; it arrives as text. Use `{{ clean_usd() }}` for money columns.
- `safe_divide(numerator, denominator)`: check the argument order every time.
- Wrap multi-condition `case` / `and` / `or` logic in parentheses; don't rely on precedence.
- Booleans are `is_` / `has_` prefixed. Money columns end in `_usd` (or `_musd` for millions). Dates end in `_date`.
- Staging: views, one per source, no joins, no filters except dropping fully blank rows.
- Keys: `dbt_utils.generate_surrogate_key`. Every model's primary key gets `unique` + `not_null`.

## YAML conventions

- One `_<folder>_models.yml` per folder; `_sources.yml` for sources.
- Generic tests use `data_tests:` with `arguments:` (dbt 1.10+ syntax).
- Every model and every column used by a metric gets a description. `persist_docs` is on, so descriptions show up in BigQuery.

## Data rules you'll need when modeling

- Only `review_status = 'keep'` and `has_mishap` rows reach `fct_mishap`. `has_mishap = false` rows still feed `dim_episode`.
- Cost rule: `mishap_cost = case when amount_stated = 1 then amount_usd else est_mid_usd end`. Low/high estimates stay for ranges and the forecast.
- `is_catastrophic` comes from Sheet column X (blank = false). Today: house fire, 2011 divorce, Latte Larry's.
- Dates: `episode_date` (Sheet `air_date`) joins `fct_mishap` to `dim_date.date_day`; `episode_year` is parsed from it and joins to `dim_net_worth.year`. The Sheet's `air_year` column is not used.
- `review_status = 'unsure'` rows (incl. unwatched S12 episodes) stay out of the fact table until Rich reviews them; they flow in on the next build once marked `keep`.
- `loss_kind` (realized | hypothetical) → `loss_kind_category` (12 categories; see `_stg_models.yml`).
- `needs_verification` and `estimate_source` are Sheet-only working columns; they never leave staging.
- Each season aired within one calendar year, so `episode_year` is safe as the join to net worth.
- In the semantic layer, don't pre-join net worth onto mishap rows. Give `dim_net_worth` a `year_start_date` time dimension (year grain, `non_additive_dimension`) and let MetricFlow align it with mishaps on `metric_time__year`.

## Gotchas

- The external table reads Sheet columns **by position** (A–X). Adding, removing or moving a Sheet column means updating `_sources.yml` and running `stage_external_sources` with `ext_full_refresh: true`.
- The Sheet must be shared (Viewer) with the dbt service account email, and the profile needs the Drive scope, or queries fail with "Permission denied while getting Drive credentials".
- `dim_date` is registered as MetricFlow's time spine (`time_spine:` in `_marts_models.yml`). Keep its range covering every date a metric or forecast uses (now 2000–2028).
- BigQuery has no exact median aggregate (`percentile_cont` is window-only). For the Median metrics use `agg: percentile` with `use_approximate_percentile: true`; on ~100 rows it is effectively exact. Confirm with `mf validate-configs`.
- `profiles.yml` lives at the repo root (copied from `profiles.example.yml`, gitignored). dbt and SQLFluff read it from there. The key lives in `~/.gcp/`. Never commit either, or `.env`.

## Git

- `main` is always green. Work on a branch (`feat/fct-mishap`, `fix/stg-casts`), open a PR, merge.
- Commit messages: imperative, short subject (`add stg_mishaps with casts and tests`).
- Ask before pushing or opening a PR.

## Current task list

1. ~~Sources: external table on the Mishaps tab; seed for net worth; `dim_date`~~ (done)
2. `dim_net_worth` (from `stg_ld_net_worth`: `year_start_date`, `net_worth_adj_*_usd = musd * 1e6`, `is_show_airing`), `dim_episode`, `fct_mishap` (+ `mishap_cost`, `mishap_cost_2026`)
3. `_semantic_models.yml`, `_metrics.yml` per `docs/losses_by_year_mockup.md` (rename its `yearly_net_worth` / `dim_year` to `dim_net_worth`)
4. Reconcile `mf query` output to the Sheet's `Losses by Year` tab (total $262.02M as of 2026-11-19)
5. Export script (`mf query --csv`) → `web/` Next.js page (after all data is in)
