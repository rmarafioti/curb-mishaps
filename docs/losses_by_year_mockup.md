# Mockup: "Losses by Year vs. Net Worth" table from the semantic layer

Shows how the year-by-year table is built: **no custom SQL**. Two semantic models, six metrics, one `mf query`. All amounts are in each year's own dollars (`mishap_cost`, mid estimate).

---

## 1. The table we want

| Column | Metric | Type |
|---|---|---|
| Year | `metric_time__year` (dimension) | — |
| Realized | `realized_loss` | simple, filtered |
| Hypothetical | `hypothetical_loss` | simple, filtered |
| Catastrophic | `catastrophic_loss` | simple, filtered |
| Total | `total_mishap_loss` | simple |
| LD net worth | `net_worth_mid` | simple, semi-additive |
| % of net worth | `pct_mishap_to_net_worth` | ratio |

---

## 2. Semantic models

```yaml
# models/marts/_semantic_models.yml
semantic_models:

  - name: mishaps
    description: One row per kept mishap. Costs in dollars of the year the episode aired.
    model: ref('fct_mishap')
    defaults:
      agg_time_dimension: episode_date
    entities:
      - name: mishap
        type: primary
        expr: mishap_key
      - name: year
        type: foreign
        expr: episode_year
    dimensions:
      - name: episode_date
        type: time
        type_params:
          time_granularity: day
      - name: loss_kind          # realized | hypothetical
        type: categorical
      - name: is_catastrophic    # int64 1/0, not a boolean
        type: categorical
      - name: loss_kind_category # child of loss_kind
        type: categorical
    measures:
      - name: mishap_cost        # amount_stated_usd if amount_stated = 1, else est_mid_usd
        agg: sum
      - name: mishap_count
        agg: count
        expr: mishap_key

  - name: dim_net_worth
    description: One row per year. Net worth with the real 2007 divorce added back.
    model: ref('dim_net_worth')
    defaults:
      agg_time_dimension: year_start_date
    entities:
      - name: year
        type: primary
        expr: year
    dimensions:
      - name: year_start_date    # date(year, 1, 1), built in dim_net_worth
        type: time
        type_params:
          time_granularity: year
      - name: is_show_airing     # int64 1/0, from the seed
        type: categorical
    measures:
      - name: net_worth_adj_mid  # dollars, not $M: dim_net_worth multiplies by 1e6
        agg: sum
        expr: net_worth_adj_mid_usd
        non_additive_dimension:  # semi-additive: never summed across years
          name: year_start_date
          window_choice: max
```

**Why two models:** net worth is one row per year; mishaps are many rows per year. MetricFlow aggregates each to the year **before** joining them on `metric_time`, so net worth is never multiplied by the number of mishaps (the fan-out trap in the brief).

---

## 3. Metrics

```yaml
# models/marts/_metrics.yml
metrics:

  - name: total_mishap_loss
    label: Total Mishap Loss
    description: All kept mishaps, realized + hypothetical + catastrophic.
    type: simple
    type_params:
      measure: mishap_cost

  - name: realized_loss
    label: Realized
    description: Everyday money or property actually lost (catastrophic excluded).
    type: simple
    type_params:
      measure: mishap_cost
    filter: |
      {{ Dimension('mishap__loss_kind') }} = 'realized'
      and {{ Dimension('mishap__is_catastrophic') }} = 0

  - name: hypothetical_loss
    label: Hypothetical
    description: Missed income (HBO show, golf club, Prius sold low).
    type: simple
    type_params:
      measure: mishap_cost
    filter: |
      {{ Dimension('mishap__loss_kind') }} = 'hypothetical'

  - name: catastrophic_loss
    label: Catastrophic
    description: Divorce, house fire, Latte Larry's.
    type: simple
    type_params:
      measure: mishap_cost
    filter: |
      {{ Dimension('mishap__is_catastrophic') }} = 1

  - name: net_worth_mid
    label: LD Net Worth
    type: simple
    type_params:
      measure: net_worth_adj_mid

  - name: pct_mishap_to_net_worth
    label: "% of Net Worth"
    description: That year's total mishap loss / that year's net worth. Single-year only.
    type: ratio
    type_params:
      numerator: total_mishap_loss
      denominator: net_worth_mid
```

`total_mishap_loss` always includes every kept mishap, hypothetical included; `loss_kind` is only a slice, never a filter on the total.

---

## 4. The query (what the dashboard / AI asks for)

```bash
mf query \
  --metrics realized_loss,hypothetical_loss,catastrophic_loss,total_mishap_loss,net_worth_mid,pct_mishap_to_net_worth \
  --group-by metric_time__year \
  --where "{{ Dimension('year__is_show_airing') }} = 1" \
  --order metric_time__year
```

The `where` keeps the table to years the show aired (otherwise gap years like 2003 would show net worth with no losses).

---

## 5. Expected result (mid estimates, as of 2026-11-18)

| Year | Realized | Hypothetical | Catastrophic | Total | LD net worth | % of net worth |
|---|---|---|---|---|---|---|
| 2000 | $7.7K | $180 | — | $7.8K | $280M | 0.003% |
| 2001 | $15.8K | $1.8M | — | $1.82M | $333M | 0.55% |
| 2002 | $301K | $1.9K | — | $303K | $387M | 0.08% |
| 2004 | $7.1K | $100K | — | $107K | $493M | 0.02% |
| 2005 | $25.1K | $5K | — | $30.1K | $547M | 0.005% |
| 2007 | $1.02M | — | $5M | $6.02M | $550M | 1.1% |
| 2009 | $28.4K | — | — | $28.4K | $575M | 0.005% |
| 2011 | $360 | — | $250M | $250M | $600M | 41.7% |
| 2017 | *(rows 120–160 not reviewed yet)* | | | | $650M | |
| 2020 | $136.5K | — | $195K | $332K | $650M | 0.05% |
| 2021 | $10.2K | — | — | $10.2K | $650M | 0.002% |
| 2024 | $610 | — | — | $610 | $650M | <0.001% |

---

## 6. One metric, many views

The same `total_mishap_loss` that fills the Total column also drives the KPI tile (no `group-by`), the by-season chart (`--group-by mishap__season` once season is a dimension) and the by-category chart (`--group-by mishap__loss_kind_category`). All of them add up to the same number, which is the point of the build.

## 7. Notes for the build

- `dim_net_worth` has `year_start_date` (date) and net worth in dollars (`net_worth_adj_mid_usd = net_worth_adj_mid_musd * 1e6`), so the ratio comes out as a true fraction.
- `is_catastrophic` comes from Sheet column X (1/0 on every row, added 2026-11-19), not a hardcoded `row_id` list. Today it's the house fire, the 2011 divorce and Latte Larry's. Flags are int64 1/0, so filters compare to `1` / `0`, not `true` / `false`.
- Section 5 is a 2026-11-18 snapshot and is now stale (2017 is reviewed; 2011 realized includes rows 116–125). The current reference is the Sheet's `Losses by Year` tab, which `fct_mishap` reconciles to: **$262,024,688** across 101 kept rows as of 2026-11-19.
- Time spine: `dim_date` in `models/core/` (`date_day` only).
- `% of net worth` is meaningful **per year only**. Without `--group-by metric_time__year`, the semi-additive net worth takes the latest year, so a no-group-by query would divide all-time losses by 2024 net worth. Lock the dashboard to the yearly view (matches the brief's single-year rule).
- Season is on `dim_episode`, not `fct_mishap`, so the by-season view needs an episodes semantic model joined on an `episode` entity.
- Field names match the built models (`CLAUDE.md` conventions).
