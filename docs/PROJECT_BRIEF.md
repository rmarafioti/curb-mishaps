# Curb Your Enthusiasm: Larry's Mishaps — Project Brief

Handoff document for any agent or session working on this repo. Read this first, then `CLAUDE.md` (code conventions).

---

## 1. Thesis (stay the course)

> **Define a metric once. Use it everywhere — in dashboards, in reports, in AI answers. Always the same, always traceable to the warehouse.**

- **The hook:** how much money Larry David's TV character loses through his mishaps across all 12 seasons (2000–2024). Funny, fun to explore.
- **The point:** the dbt semantic layer (MetricFlow). Once metrics are defined and wired to the dashboard, the page practically builds itself and every number is true to the warehouse — no hand-written queries.
- **The AI angle:** an AI that writes its own SQL can be confidently wrong. An AI that asks a governed semantic layer can only give answers the business already agreed on. Showcase: the dashboard assembled by AI querying MetricFlow.

### Rules for the build
1. Metrics live **only** in MetricFlow YAML. Dashboards and AI request metrics by name, sliced by dimensions.
2. No one-off SQL behind a chart. If a chart needs a custom query, the story breaks.
3. The page includes a **"How this was built"** section: lineage (seeds → models → semantic layer → dashboard) and one metric's YAML next to the chart it powers.
4. Demonstrate **one metric, many views** (e.g. `total_realized_loss` driving the KPI tile, by-season chart and by-category chart — all reconcile).

### Scope
Portfolio/showcase, **1–2 weeks**. Minimum version first: clean data, ~5 governed metrics, one dashboard page (KPIs, losses by season, losses by category, top disasters), one simple forecast with a confidence band. Extras only if time allows ("TV Larry" net worth line, multiple forecast scenarios, AI/MCP-built page).

---

## 2. Source of truth

**Google Sheet (master, human-editable):**
https://docs.google.com/spreadsheets/d/1-SbV6CB3GlgIQJPgsCssc2eStrgImUCeB2eXOGwokMo/edit

| Tab | Purpose | Becomes |
|---|---|---|
| `Mishaps` | One row per mishap (episodes with no mishap = one row, `has_mishap = 0`). Columns (restructured 2026-11-18): A–G episode (`row_id`, `episode_id`, `season`, `episode_in_season`, `title`, `air_date`, `air_year`; dbt uses neither `row_id` nor `air_year`, and parses `episode_year` from `air_date`); H `has_mishap` (1/0); I `description`; J `loss_kind` → K `loss_kind_category` (hierarchy); L `amount_usd` (only when stated); M `amount_stated` (1/0); N `needs_verification` (TRUE/FALSE, sheet-only, drop once review is done); O `source`; P–Q `review_status`, `review_notes`; **R–W `est_low_usd`, `est_mid_usd`, `est_high_usd`, `estimate_basis`, `confidence`, `estimate_source`** (filled by Claude for estimated `keep` rows; R–T stay blank on stated rows, set 2026-11-20; `estimate_source` optional, nice-to-have); **X `is_catastrophic`** (1 on catastrophic rows, 0 on every other row; added 2026-11-19 so the flag travels with the row instead of a hardcoded `row_id` list); **Y `mishap_num`** (1, 2, 3... within an episode, 0 = no-mishap placeholder; assigned once, never renumbered; added 2026-11-19). Removed: `mishap_seq`, `direction` (all rows are losses), `estimated_amount_usd`, `source_url`. Pre-restructure version is in the Sheet's version history (backup tab deleted). Sheet row = `row_id` + 1. | BigQuery external table `curb_raw.mishaps` (live) → `stg_mishaps` → `fct_mishap` + `dim_episode` |
| `Losses by Year` | Formula mockup of the year-by-year table (Realized / Hypothetical / Catastrophic / Total / net worth / %); each column labeled with its MetricFlow metric. Includes a reconciliation check. | — (reference for the semantic layer) |
| `LD Net Worth` | 2000–2027: reported net worth low/mid/high ($M), basis (anchor/interpolated/projection), event, source; CPI-U annual average, CPI basis, multiplier to 2026 dollars; **`net_worth_adj_low/mid/high_musd` = reported + real 2007 divorce added back ($200M/$250M/$300M from 2007 on). Use the adj columns in metrics.** | seed `ld_net_worth_cpi` (the tab's adj low/mid/high, basis, event, CPI and multiplier, plus `is_show_airing`; the models read only year, is_show_airing, the mid and the multiplier; the tab was the working record, the CSV is now the source and is edited directly) → `stg_ld_net_worth` → `dim_net_worth` |
| `README` | Thesis, review rules, data principles. | — |
| `Glossary` | Finance/insurance/stats terms with education-data equivalents. | — |

The Sheet is the source. **dbt reads the `Mishaps` tab live** through a BigQuery external table (defined in `models/staging/_sources.yml`, created by `dbt-external-tables`), so Rich's ongoing edits flow in on the next `dbt build` with no exporting. All external columns are declared STRING and cast in staging. The external table reads columns by position: any column change in the Sheet needs `_sources.yml` updated and a full refresh of the external table.

**Lesson learned (row-ID bug, fixed 2026-11-18):** an earlier merge applied corrections by `row_id` after rows had been renumbered, and 20 rows landed on the wrong mishaps. **Never match edits by `row_id` after any renumbering — match by `episode_id` + `mishap_num`** (column Y, added 2026-11-19 for exactly this).

**Blank rows:** BigQuery reads every Sheet row that has anything in it, including only a number format. Leftover currency formatting on rows 197–201 once showed up as 5 blank rows and failed the staging tests; the fix was deleting those rows in the Sheet, not filtering in dbt.

---

## 3. Data principles

- **Cite everything.** Every amount has a basis — `stated` (on screen / in synopsis) / reference price / category default — and a `source`; `estimate_source` links are a nice-to-have (it's fiction, the point is to show the research was done).
- **Rough is fine.** Unstated amounts get `est_low / est_mid / est_high` + confidence. Don't agonize over small items.
- **Price in the year it happened.** Estimates are in dollars of the year the episode aired (`mishap_cost`, nominal). When the reference price is current (e.g. a 2026 repair quote), deflate it by CPI to the year the episode aired before entering it. dbt also keeps a CPI-converted copy (`mishap_cost_2026`) — see "Two kinds of dollars" below.
- **Two kinds of dollars (decided 2026-11-18).**
  - **Nominal (`mishap_cost`) is the only kind on the dashboard.** Totals, by season, by category, top 10 and every net worth comparison use the year's own dollars. Net worth is also nominal, so same-year comparisons need no conversion. Net worth is never reduced by a cumulative total, with one labeled exception: the "dent" chart (below).
  - **2026 dollars (`mishap_cost_2026`) are for the forecast only** (projecting the seasons after the show ended; settled 2026-11-20). Converting removes inflation so the forecast projects real change. They never appear on the dashboard: no 2026-dollar KPI, column or chart.
  - **The forecast tab explains the inflation step** in its own write-up (frequency, cost in 2026 dollars, catastrophic risk); the other tabs need no inflation note.
- **Pricing workflow:** Rich marks a row `keep` and leaves a note on how to price it → Claude fills R–W with a cited range. `pass`/`drop` rows get no price; `unsure` rows wait for Rich to re-watch on HBO Max.
- **Hypothetical HBO show (row 23, "The Shrimp Incident"):** Rich's call — count it, priced as **1 full season (12 episodes)** at $50K/$150K/$500K per episode = **$600K / $1.8M / $6M** (2001 dollars), confidence low. It stays in the hypothetical bucket; even at the high end it's a small share of his net worth (that's part of the joke).
- **Be transparent.** Uncertainty is shown through each estimate's confidence and low/high range (stated prices have no range). A % Stated KPI was dropped 2026-11-20: weighted by dollars, the estimated divorce swamps it.
- **One divorce, counted once.** Curb's Larry *is* Larry David playing himself with his real money, so show losses can be applied to real net worth. To avoid double counting, the net worth series **adds back the real 2007 divorce** (`net_worth_adj_*` columns), and the show's **2011 Cheryl divorce is the only divorce**: a catastrophic mishap valued at the real settlement (low $200M / mid $250M / high $300M).
- **Net Worth After Mishaps is single-year only.** `net_worth_adj` (that year) − that year's mishaps. Required single-select year filter, no "All years" — the metric is not cumulative.
- **The dent chart (agreed 2026-11-20) is the one running subtraction.** `net_worth_after_mishaps_to_date` = that year's real net worth − `cumulative_mishap_loss` (every mishap up to that year), one point per year 2000–2024, shown under the mishap timeline beside the real net-worth line. It answers "how much did the mishaps dent him" and is labeled as what he'd have if the character's losses were real, never as his actual net worth. It adds up losses in each year's own dollars; the chart note says so.
- **Catastrophic losses separate.** Divorce, house fire (S6 "Meet the Blacks"), Latte Larry's burning down (S10) go in a catastrophic bucket so they don't distort everyday mishap stats.
- **Realized vs. hypothetical.** `loss_kind = realized` (money/property actually lost) vs. `hypothetical` (missed income: shelved musical, lost car-periscope investment, Prius sold under market).

---

## 4. Data model

```
sources: sheets.mishaps (external table over the Mishaps tab, live)
seeds:   ld_net_worth_cpi (the used columns of the LD Net Worth tab + is_show_airing)
staging: stg_mishaps, stg_ld_net_worth
core:    dim_date      (date_day only, 2000-01-01..2028-12-31; MetricFlow time spine)
dims:    dim_episode   (episode_id, season, episode_title, episode_date, episode_year)
         dim_net_worth (year, is_show_airing, to_2026_dollars_multiplier, net_worth_adj_mid_usd)
facts:   fct_mishap    (mishap_key, episode_id, mishap_num, episode_date, episode_year, description, loss_kind,
                        loss_kind_category, is_catastrophic, amount_stated, amount_stated_usd, est_low/mid/high_usd,
                        estimate_basis, confidence,
                        mishap_cost = if(amount_stated = 1, amount_stated_usd, est_mid_usd),
                        mishap_cost_low / mishap_cost_high = same rule with est_low_usd / est_high_usd,
                        mishap_cost_2026 = mishap_cost × that year's to_2026_dollars_multiplier)
later:   forecast seed (Python output: one row per forecast season) + its semantic model
```

- No losses-by-year or losses-by-season marts: those tables come from `mf query` on the semantic layer (metrics live only in MetricFlow YAML).
- Money and net worth columns are `float64`; flags are int64 1/0, never booleans.
- **Key: `episode_id` + `mishap_num`** (`mishap_key` = surrogate of the two, the mishap's unique identifier), not `row_id` (row_id renumbers after review; see the row-ID bug above). A new mishap takes the next unused number in its episode; gaps from deleted rows stay.
- **Dates:** `dim_date` (2000-01-01 to 2028-12-31, day grain, `date_day` only) is MetricFlow's time spine; MetricFlow builds year, quarter and month from it. Mishaps use `episode_date` and net worth uses `year_start_date` (Jan 1, defined in the semantic model as `expr: date(year, 1, 1)`, not a column), so both line up on `metric_time__year`. `fct_mishap.episode_year` joins to `dim_net_worth.year` for the 2026-dollar multiplier.
- An episodes semantic model (on `dim_episode`) is needed for Mishaps per Episode.
- **Median on BigQuery:** BigQuery has no exact median aggregate (`PERCENTILE_CONT` is window-only), so the Median metrics use `agg: percentile` with `use_approximate_percentile: true` (`APPROX_QUANTILES`). That returns the lower median (with an even count, the lower of the middle two values, not their average); accepted 2026-11-20 and labeled as such in the metric descriptions.
- Grain of `fct_mishap`: one row per mishap. `dim_net_worth` grain: one row per year. Join on `episode_year` (each season aired within one calendar year).
- **Fan-out warning:** net worth is non-additive. Never `SUM(net_worth)` after joining to mishaps. Either aggregate mishaps to year first then join, or compute `loss / net_worth_mid` per row and only sum losses.
- **Inflation:** `amount_2026 = amount × (cpi_2026 / cpi_year)`; the multiplier comes precomputed in the seed, and `fct_mishap` reads it from `dim_net_worth`. 2026 CPI is a Jan–Oct YTD average — swap in the official annual average after BLS publishes December 2026 (Jan 13, 2027).
- Staging keeps every Sheet row; `fct_mishap` filters to `review_status = 'keep'` and `has_mishap = 1`. `unsure` rows flow in on the next build once marked `keep`. `has_mishap = 0` placeholder rows still feed `dim_episode`.
- **Hypothetical losses always count toward the total.** `loss_kind` is only a slice; never filter on it in `fct_mishap` or `total_mishap_loss`. Reconciling to the `Losses by Year` tab shows it if any go missing.
- **Cost rule:** `amount_stated = 1` → use `amount_stated_usd`; `amount_stated = 0` → use `est_mid_usd` (low/high kept for ranges and the forecast). Test: `not_null` on `fct_mishap.mishap_cost`, so a kept row with no usable amount fails the build instead of dropping out of the total.
- **Not in the warehouse:** `row_id`, `air_year`, `needs_verification` (sheet-only working flag), `review_notes`, `estimate_source` (optional; shown on the page as "we did the research", not modeled).
- Hierarchy: `loss_kind` (realized / hypothetical) → `loss_kind_category`: purchase, payment, gift, donation, investment, bet, loan_unrepaid, fine_fee, cash_lost, property_damage, property_lost, lost_opportunity. (`money_received` rows were all dropped; every row is a loss, so `direction` was removed.)

### Metrics (MetricFlow) — Rich's list, refined
| Metric | Definition | Notes |
|---|---|---|
| Total Mishap Loss | `sum(mishap_cost)` (stated, else est_mid; **year-of-event dollars**) | dashboard default; slice by `loss_kind` (realized / hypothetical). Running total by year; never subtracted from net worth |
| Total Mishap Loss (2026 $) | `sum(mishap_cost_2026)` | forecast input only; not shown on the dashboard |
| Median Routine Mishap Cost (2026 $) | `percentile(mishap_cost_2026, 0.5)` where `is_catastrophic = 0`, by season | forecast severity input (inflation removed); catastrophic rows excluded in the metric itself; not shown on the dashboard |
| Median Mishap Cost | `percentile(mishap_cost, 0.5)` | replaces Average (no outlier trimming needed); check percentile support on chosen warehouse |
| Net Worth After Mishaps | `net_worth_adj − total_loss` | **single year only**, both sides nominal (same year, no conversion); `net_worth` is semi-additive (`non_additive_dimension` on `metric_time`) |
| % Mishap to Net Worth | `total_loss / net_worth_adj` | both sides nominal; semi-additive denominator, never summed |
| Mishaps per Episode | `mishap_count / episode_count` | frequency trend (no dollars, unaffected by inflation); forecast frequency input |

Dimensions: year, season, episode, `loss_kind` → `loss_kind_category`, `is_catastrophic`.

Cut 2026-11-20 (slicing covers them): Most Costly Mishap (the Top 10 table is `total_mishap_loss` grouped by the `mishap` entity), # Routine Mishaps and # Big Losses (`mishap_count` grouped by `mishap__is_catastrophic`), and net worth low/high (the dashboard uses the mid estimate; the sources page shows the reported range). The built list is `models/marts/_metrics.yml`.

**Forecast inputs (not dashboard views):** mishaps per episode by season (frequency, no dollars); the routine median in 2026 dollars by season (severity, inflation removed; mostly estimated, see the caveat); catastrophic odds per season.

**Caveat (estimates have no built-in real trend):** many estimates were made by taking a current price and deflating it to the air year. Converted back to 2026 dollars, those rows return today's price, so their real cost is flat across seasons by construction. Only `stated` amounts carry a real cost signal; slice the severity input by `mishap__amount_stated` to see it on stated rows alone.

Forecast output is a seed CSV written by the Python script (one row per forecast season: season, year, median, p10, p90, in that year's dollars), loaded with `dbt seed`; a semantic model exposes simple metrics on it and a saved query feeds the Forecast tab.

**Built and audited with Rich 2026-11-23 (`scripts/forecast.py`).** Inputs come from `mf query` (`routine_mishap_count` + `episode_count` by episode; `total_mishap_loss_2026` by mishap), so the forecast reads the same governed numbers as the dashboard. What the data said and what was decided:
- **Frequency:** everyday mishaps per episode have mean 0.90 and variance 0.90, so no overdispersion: the negative binomial collapses to a Poisson (alpha about 0). Season trend p = 0.66, not significant, so the 12 seasons are pooled. Parameter uncertainty is carried into the simulation.
- **Severity:** log cost in 2026 dollars has no season trend (p = 0.64 on all 108 everyday mishaps, p = 0.23 on the 42 stated ones), so pooled. **Each forecast mishap's cost is a real one of its kind (realized or hypothetical), drawn at random.** A lognormal was tried and dropped: on realized costs it made $100K+ mishaps half as common as on the show (2.7% vs 5.1%), so the typical everyday season came out at $100K against a real $318K (resampling: $177K); on the 10 hypothetical costs it put the 90th percentile at about $50M. Tradeoff: no forecast mishap can cost more than the biggest real one.
- **Catastrophic, a separate switch (`has_forecast_catastrophe`):** the seed has two rows per season, everyday mishaps only (0) and the same season if a catastrophe hits (1); the page lets the reader add it in. **The divorce is left out** (`NOT_REPEATABLE` in the script): it was the show's one divorce and Larry ends the series unmarried. So the chance is **2 of 12 seasons = 17%** (house fire, Latte Larry's), and if one hits it is one of those two.
- **Seasons rolled separately:** one season's luck doesn't carry into the next, so 13 and 14 differ by inflation plus a little chance.
- A trend is used automatically if one ever becomes significant (p < 0.05), and the script prints a note to update the page copy.
- 200,000 simulations, fixed seed. Output per season and version: mishaps p10/median/p90, total loss p10/median/p90, catastrophe chance, in the air year's dollars. Medians don't add up across seasons or versions, so no metric sums them. (The everyday realized / hypothetical medians were dropped 2026-11-28; nothing used them.)
- **Audit (2026-11-23):** inputs reconcile (120 episodes, 108 everyday + 3 catastrophic = 111 mishaps, 2026-dollar total $387,401,198 matches the metric); simulated counts average 9.04 against 9.0 expected, variance 9.8 against 10.0 across the real seasons; CPI step checked to the dollar.
- **Final rerun and audit (2026-11-28, every Sheet row reviewed; `python scripts/audit_forecast.py`, 13 of 13 checks pass):** 120 episodes, 109 everyday + 3 catastrophic = 112 mishaps, 2026-dollar total $387,404,366 matches the metric. Frequency mean 0.908, variance 0.891, alpha about 0; the negative binomial's trend p-value can't be computed with alpha at 0 (prints `nan`), so the audit also fits a Poisson: p = 0.77, pooled. Severity p = 0.62 (all), 0.35 (stated only), pooled. Simulated count mean 9.12 against 9.08 expected; 10 of the 12 real seasons fall inside the simulated 80% everyday range (about 10 expected). CPI step checked to the dollar.
- Result: Season 13 (2025 dollars) everyday only $170,845 (80% range $12,479 to $3,581,111), if a catastrophe hits $7,760,264 ($269,115 to $9,361,922); 9 mishaps (5 to 13). Season 14 (2026 dollars) everyday only $178,473, with a catastrophe $7,985,676.
- **The Forecast tab explains all this in plain English** (every real mishap is a card in a hat; draw a season's worth 200,000 times), not in statistics terms.

---

## 5. Statistics plan (Phase 5)

Frequency–severity model, insurance style:
- **Frequency:** mishaps per episode — negative binomial (overdispersed counts); test for a trend across seasons. Forecast the **total** count per season (enough data for a real trend).
- **Category mix:** too sparse to trend per category (~100 mishaps / 12 seasons / 13 categories = under 1 per category per season; most cells 0 or 1). Instead, split the forecast total by each category's historical share (e.g. property damage 25% of all mishaps → 25% of forecast count). To test whether the mix is shifting, group the 13 categories into 4–5 buckets (e.g. damage/loss, payments/fees, gifts/donations, bets/investments, missed opportunities) so each has enough rows. Report category forecasts as ranges ("3–7 property damage, most likely 5"), not single numbers.
- **Severity (routine mishaps):** cost per mishap — lognormal; summarize with the **median**, which ignores how big the outliers are (a $250M loss counts the same as a $300 one, as one value above the middle). Test whether costs grow over seasons **in 2026 dollars** (nominal would show a false upward trend from inflation alone). Run the trend test on `stated` rows, or report it as mostly estimated (see caveat in section 4).
- **Catastrophic:** modeled separately as rare events with a per-season probability. This is where the tails go: a forecast of total dollars can't ignore big losses, so routine (median cost × count) and catastrophic (probability × size) are added together. Nothing is double counted or dropped.
- **Decomposition for the dashboard note:** growth in nominal loss per season = frequency change × real cost change × inflation. Report each piece so the reader sees how much is "more mishaps" vs. "pricier mishaps" vs. "prices rising."
- **Forecast (scope settled 2026-11-21):** "if the show had kept going": **one season a year** after Season 12 (2024), so **Season 13 = 2025 and Season 14 = 2026, stopping at 2026** (the real show had gaps; one a year is the stated what-if assumption and the page says so). Fit the trends in 2026 dollars (inflation removed), Monte Carlo each forecast season (median + 80% band), then convert each season to **its own air year's dollars** with the real CPI multipliers already in the seed (2025 full-year CPI; 2026 Jan–Oct average until BLS publishes the annual figure). No CPI is assumed: nothing past 2026. Realized and hypothetical modeled separately. Possible tie-in: extend the dent chart's Net Worth After Mishaps through 2025–2026 with the forecast band (net worth is in the seed through 2027).
- Keep it modest and honest; the semantic layer is the star.

---

## 6. Status (as of 2026-11-19)

**2026-11-19 dbt update:** `dim_episode`, `dim_net_worth` and `fct_mishap` built and merged (PR #1). `fct_mishap` reconciles to the `Losses by Year` tab: 101 kept rows = **$262,024,688** (realized $1,669,358, hypothetical $5,160,330, catastrophic $255,195,000). Next: the semantic layer (`_semantic_models.yml`, `_metrics.yml`).

**2026-11-19 update:** Sheet now has 195 rows (row 187, the $650 sports coat in "The Lawn Jockey", was added). Rows 16 (sunglasses for Jeff's mom, $100/$200/$350), 186 (lawn jockey, $300/$600/$2,400) and 187 ($650 stated) priced. Column X `is_catastrophic` added. Running mid total: **$262,024,688** (`Losses by Year` tab, reconciles). Review covers all rows except the `unsure` rows (23 plus S12 episodes 3–10, which Rich is still watching) and rows 7 and 34 (RE-REVIEW). Row 187 source set to `user`. Stack decided (section 7); repo scaffolded with the external source, net worth seed and staging models. The table below is the 2026-11-18 snapshot.

| Phase | Status |
|---|---|
| 1. Clean list (keep/drop review) | **In progress — Rich.** 194 rows, 170 mishaps, 120 episodes. First ~37 rows reviewed. Row-ID bug fixed (20 rows rewritten). **Rows 7 and 34 marked RE-REVIEW** (their reviews moved to rows 10 and 37). Reviewed through row 119 and rows 161–185; rows 120–160 and 186 still to review. Several rows `unsure` (Rich to check on HBO Max). After review: delete `drop` rows, apply notes, renumber `row_id` (`mishap_seq` removed 2026-11-18). |
| 2. Price unstated mishaps | **In progress.** Estimate columns R–W. All reviewed `keep` rows priced (76 rows). Running mid total (year-of-event dollars): **$1.67M realized + $5.16M hypothetical + $255.2M catastrophic = $262.0M** (as of 2026-11-18 evening) (see `Losses by Year` tab). Restaurant (rows 35 + 46, Bobo's is a wash) and hospital wing ($1M) dominate everyday realized; HBO show + golf club = most of hypothetical; divorce = 97% of everything. Decisions: row 113 (house in divorce) dropped, counted once; row 149 (Latte Larry's lease) folded into row 167; row 166 priced as the old Prius given away; rows 86 and 158 dropped; row 126 counts only the $75 haircut difference; row 147 only the $500 overpayment; car periscope (row 122, $2.5M mid) and Fatwa! musical (row 146, $750K mid) are the big new hypotheticals. Rule: if a row already has a stated amount, use it over Rich's guess. Row 61 `amount_usd` changed 30 → 10 (only the extra tip counts). Rows 76+ await review. 27 rows still flagged `needs_verification` (incl. $20K Mantle ball, $10K MJF donation, $4K charity lunch). |
| 3. Dashboard spec (plain English → KPIs/charts) | **Metrics agreed** (table in section 4). Charts/layout not started. |
| 4. Net worth by year | **Done** (`LD Net Worth` tab) — anchors 2000, 2006, 2007, 2015, 2019, 2026; CPI added; real 2007 divorce added back (`net_worth_adj_*`). |
| 5. Statistics / forecast | Not started. **Waits until all data is in.** |

### Sequencing (agreed)
1. **Start dbt modeling at ~50–60 priced rows** (in VS Code): sources on the live Sheet, staging, `dim_net_worth`, `dim_episode`, `fct_mishap`, tests, MetricFlow YAML. The model doesn't depend on the data being finished.
2. Rich keeps reviewing in the Sheet; new rows flow through on each `dbt build`; Claude prices new `keep` rows.
3. **BI build (dashboard) and forecast start only after all data is in.**

**Data sources used so far:** Wikipedia episode lists, IMDb plot synopses (read via the browser extension; Seasons 11–12 have no IMDb synopses), Rich's own recollection (`source = user`), price references cited per row in `estimate_source`.

---

## 7. Decisions (settled 2026-11-19)

1. **Warehouse: BigQuery.** New GCP project `curb-mishaps`, datasets `curb_raw` / `curb_dev` / `curb_prod` (US), dbt service account with a JSON key. Billing linked (sandbox tables expire after 60 days).
2. **Transform + metrics: dbt Core + MetricFlow (`mf`), self-hosted.** No dbt platform account needed.
3. **Dashboard: Next.js static page, built by Claude from MetricFlow output.** Each chart is one `mf query` (ideally a `saved_query` in YAML) exported with `--csv` to `web/data/`; the page reads those files at build time and deploys statically (Vercel). No warehouse credentials in the web app, no SQL behind any chart. Rebuild the data with one script after `dbt build`. Lightdash is dropped from the minimum version.
4. **AI route: Claude Code calling `mf query` directly.** No paid `dbt-mcp`; a small MCP wrapper stays an optional extra.
5. **Linting: SQLFluff** (dbt templater, BigQuery dialect). **Version control:** GitHub repo `curb-mishaps`, branch per task.

---

## 8. Conventions

See `CLAUDE.md` (SQL and YAML conventions, testing rules, layout). Column definitions live as doc blocks in the top-level `DEFINITIONS.md`. Rich steers; the agent writes the SQL.
