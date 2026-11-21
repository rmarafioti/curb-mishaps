# CLAUDE.md — curb-mishaps

Read this, then `docs/PROJECT_BRIEF.md` (the why, the data rules, the metric list). Rich steers; you write the SQL and YAML.

## What this repo is

A portfolio project showing the dbt semantic layer (MetricFlow): **define a metric once, use it everywhere**. The data is the money Larry David's character loses through mishaps across 12 seasons of *Curb Your Enthusiasm* (2000–2024), compared with his real net worth.

```
Google Sheet (master, Rich edits)
  └─ BigQuery external table  curb_raw.mishaps        (dbt-external-tables, live)
seeds/ld_net_worth_cpi.csv  (the used columns of the "LD Net Worth" tab)
  └─ dbt: staging → dims/facts → MetricFlow semantic models + metrics
       └─ saved queries → scripts/export_metrics.py → web/data/*.json → Next.js dashboard (web/)
```

Stack: BigQuery · dbt Core 1.10+ · MetricFlow (`mf`) · SQLFluff · Next.js. Python 3.12 in `.venv` (MetricFlow does not support 3.15+).

## Hard rules (the project's thesis depends on these)

1. **Metrics live only in MetricFlow YAML.** No metric logic in marts, in the Next.js app, or in ad-hoc SQL. Charts and AI answers request metrics by name and slice by dimensions.
2. **No custom SQL behind a chart.** If a chart needs a query `mf query` can't express, stop and raise it with Rich; don't write a workaround.
3. **Never key anything on `row_id`.** It is renumbered after review (a past merge put 20 corrections on the wrong rows). The natural key is `episode_id` + `mishap_num` (Sheet column Y: 1, 2, 3... within an episode, 0 = no-mishap placeholder). `mishap_key` is the surrogate of those two and the mishap's unique identifier (count mishaps with it). Numbers are assigned once and never renumbered: a new mishap takes the next unused number in its episode, and gaps from deleted rows stay.
4. **Net worth is semi-additive.** Never `sum()` it across years or after joining to mishaps (fan-out). Aggregate mishaps to the year first, or let MetricFlow do it via `non_additive_dimension`.
5. **Nominal dollars on the dashboard, always.** `mishap_cost` is in dollars of the year the episode aired. `mishap_cost_2026` (CPI-adjusted) is only for the Season 13 forecast; never put a 2026-dollar KPI, column or chart on the dashboard.
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
                _semantic_models.yml, _metrics.yml, _saved_queries.yml (the chart list)
seeds/          ld_net_worth_cpi.csv + ld_net_worth_cpi.yml
DEFINITIONS.md  column definitions as {% docs %} blocks (top level; see .dbtignore)
macros/         small helpers (clean_usd)
scripts/        export_metrics.py: every saved query → web/data/<name>.json (from prod)
docs/           PROJECT_BRIEF.md, SETUP.md, mockups
web/            Next.js dashboard (static; reads web/data/*.json at build time). See "Web dashboard" below.
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
mf query --saved-query losses_by_year         # one chart's request, as defined in YAML
python scripts/export_metrics.py            # all saved queries → web/data/*.json, from prod
```

Definition of done for any change: `sqlfluff lint` clean, `dbt build` green, `mf validate-configs` green (once metrics exist).

## SQL conventions

- Every SQL file (models, tests, analyses) opens with a short `--` comment header (regular SQL comments, not `{# #}`, so the editor highlights them): 2-4 lines on what the file does and why, enough for another engineer to understand its intent. Not a copy of the yml description; the yml carries the grain and detail.
- CTEs, never subqueries. Import CTEs first (`select * from {{ ref() }}` / `{{ source() }}`), then logic CTEs, then a final `select * from <last_cte>`.
- **Never name a CTE the same as one of its own output columns** (BigQuery resolves the name as a STRUCT). Use suffixes: `source_mishaps`, `mishap_counts`, `year_summary`.
- Staging: the source CTE (`source_<thing>`) selects only the columns used downstream, renamed, straight from `{{ source() }}` / `{{ ref() }}`. No `select *` import CTE. The Sheet keeps every column (unused external-table columns are dropped here); a seed we write ourselves holds only the columns the models use.
- Lowercase keywords and functions, 4-space indent, explicit `as` for aliases.
- Trailing comma after the last column in every column list (including the one before `from`); the final `select * from <cte>` has none. A convention, not linted (CV03 is off).
- Aliases are padded out by hand and lined up in one column per select, far enough right to read cleanly, e.g. `cast(season as int64)                                   as season`. Not linted (LT01 is off); keep it tidy yourself.
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
- **Column descriptions are never inline.** Each is a `{% docs %}` block in the top-level `DEFINITIONS.md`, referenced as `description: '{{ doc("name") }}'`. Name blocks after the column; prefix when the same name means different things (e.g. `net_worth_year`). `docs-paths` is the repo root and `.dbtignore` excludes every other `.md`, so don't put `{% docs %}` blocks anywhere else.
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
- In the semantic layer, don't pre-join net worth onto mishap rows. The net worth semantic model defines a `year_start_date` time dimension with `expr: date(year, 1, 1)` (year grain, `non_additive_dimension`; the column is not in `dim_net_worth`) and MetricFlow aligns it with mishaps on `metric_time__year`.
- Stated rows have only `amount_stated_usd`; estimated rows have only `est_low/mid/high_usd` (tested on `fct_mishap`). `mishap_cost_low` / `mishap_cost_high` give the range: the stated price on stated rows, else the low / high estimate.

## Gotchas

- The external table reads Sheet columns **by position** (A–X). Adding, removing or moving a Sheet column means updating `_sources.yml` and running `stage_external_sources` with `ext_full_refresh: true`.
- BigQuery reads every Sheet row that has **anything** in it, including just a number format. Formatting cells below the data (e.g. currency on R:T) shows up as blank rows and fails the `not_null` tests on `stg_mishaps`. Fix it in the Sheet (delete those rows or clear their formatting), not with a filter. Don't trim the grid's other empty rows either: the `Losses by Year` tab's formulas read fixed ranges (`Mishaps!$X$2:$X$296`), and new rows past row 296 would fall outside them.
- The Sheet must be shared (Viewer) with the dbt service account email, and the profile needs the Drive scope, or queries fail with "Permission denied while getting Drive credentials".
- `dim_date` is registered as MetricFlow's time spine (`time_spine:` in `models/core/dim_date.yml`). Keep its range covering every date a metric or forecast uses (now 2000–2028).
- BigQuery has no exact median aggregate (`percentile_cont` is window-only). For the Median metrics use `agg: percentile` with `use_approximate_percentile: true`. MetricFlow renders it as `APPROX_QUANTILES(x, 2)[OFFSET(1)]`, which returns the **lower median**: with an even count, the lower of the middle two values, not their average (Season 8 routine 2026 $: $441.60 vs. a true median of $7,580.80). Accepted 2026-11-20 and stated in the metric descriptions; to check by hand, use the same function, not `percentile_cont`.
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

## Web dashboard (`web/`)

Next.js 16 App Router, static (every page prerenders). `web/AGENTS.md` (generated by Next) says this version has breaking changes: read `web/node_modules/next/dist/docs/` before using an unfamiliar API. Node runs fine inside the `.venv` shell.

```bash
cd web && npm run dev      # http://localhost:3000
npm run lint && npm run build
```

- **Data flow:** `_saved_queries.yml` → `python scripts/export_metrics.py` (parses prod, refuses to run unless MetricFlow reads `curb_prod`, writes `web/data/<saved query>.json` with metric labels from the YAML, then re-parses dev) → the page imports the JSON. A data refresh = prod build → export → commit the JSON diff. Only YAML-only changes (metrics, labels, saved queries) can be exported without a prod build; a new or changed column needs merge + `dbt build --target prod` first.
- **Filters are pre-computed, not calculated.** For each totals saved query the export also runs every combination of `FILTER_DIMENSIONS` (in the script) it doesn't group by, stored under `slices`; only metrics whose inputs are all in the `mishaps` model are sliced. `pick()` in `web/lib/data.ts` chooses the slice and rows. `mishap_list` (one row per mishap) is filtered by picking rows. The page never adds, divides or aggregates a number (hard rule 1); sorting, picking rows and formatting only.
- **Tabs** (`web/lib/pages.ts` `PAGES`; a plain module so server pages can read it): `/` home (intro + a card per tab; the navbar's "Curb Mishaps" brand links here), `/costs-by-season` Mishap Costs by Season (KPIs, mishap timeline, table paged 10 rows at a time; season + loss kind), `/top-10` Top 10 Disasters (season + loss kind), `/net-worth` Net Worth vs. Mishaps (dent chart with a label at each net worth change; season only), `/forecast` Forecast (placeholder), `/faq` We've Got Answers (accordion; answers pick figures from the JSON, forecast questions are placeholders until the forecast exists), `/about`. Open/close rows use the `.disclosure` class (yellow chevron). Links off the site get `target="_blank" rel="noopener noreferrer"`; links within it use `next/link`. Views live in `web/components/views/`, charts in `web/components/` (`MishapTimeline`, `NetWorthDent`), the navbar in `SiteHeader.tsx`.
- **Navbar:** two rows, fixed. The tabs row (incl. its bottom gap) slides away on scroll down and returns on scroll up; the filter row always stays. Filters reset when the tab changes.
- **Look:** one dark theme from the Curb final-season poster; all colors are tokens at the top of `web/app/globals.css` (navy page/surface, Curb yellow `--heading` for titles, KPI hero and tooltip amounts, sky blue / amber gold chart series validated for colorblind safety). Libre Franklin (Franklin Gothic revival, `next/font/google`) 900/800 for titles and KPI figures only; everything else system sans.
- **Charts:** timeline = one evenly spaced point per mishap in air order, log scale, season dividers, tooltip only on a dot (opens beside it). Dent chart = linear, LD's Net Worth vs Net Worth After Mishaps with the Financial Loss band (yellow fade); labels come from the metric YAML.
- **Removing something from the dashboard:** take it off the page; leave the saved queries / metrics / export slices until the end-of-development cleanup pass (Rich may bring things back).

## Current task list

1. ~~Sources: external table on the Mishaps tab; seed for net worth; `dim_date`~~ (done)
2. ~~`dim_net_worth`, `dim_episode`, `fct_mishap`; reconciled to $262,024,688 (101 rows)~~ (done, PR #1)
3. ~~`_semantic_models.yml`, `_metrics.yml`: 3 semantic models, 15 metrics~~ (done, PR #3)
4. ~~Reconcile `mf query` output to BigQuery and the Sheet's `Losses by Year` tab~~ (done 2026-11-20, every metric matched by hand; total $262,024,688)
5. ~~Export script: saved queries (`_saved_queries.yml`) → `scripts/export_metrics.py` → `web/data/*.json`~~ (done)
6. `web/` dashboard: merged (PR #7) and deployed on Vercel from `main` (Root Directory `web`, builds skipped when `web/` is unchanged; branches get preview deploys). `feat/home-faq` (2026-11-21) adds the home page, FAQ, About rewrite and the phone layout. Keep refining with Rich.
7. Forecast (Python → seed → semantic model → Forecast tab), after the Sheet is finished. Scope: one season a year after 2024, Season 13 (2025) and Season 14 (2026), stop at 2026; fit in 2026 dollars, report each season in its own year's dollars via the seed's real CPI multipliers (see brief §5) (remaining `unsure` rows incl. unwatched S12; then retire the temporary `fct_mishap_amounts_match_stated_flag` test).
8. End-of-development cleanup: remove the semantic-layer pieces the dashboard and forecast don't use (saved queries, metrics, export slices, category filter dim), then update docs. Check each against the page and forecast first.
