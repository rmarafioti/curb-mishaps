-- One row per year (2000-2027): net worth in dollars plus the year_start_date that
-- MetricFlow uses to line net worth up with mishaps on metric_time__year. Net worth
-- is semi-additive, so it is never summed across years or pre-joined to mishaps.

with

net_worth_years as (

    select
        year,
        is_show_airing,
        net_worth_basis,
        net_worth_event,
        cpi_index,
        to_2026_dollars_multiplier,
        -- MetricFlow needs a real date (not an int year) to put net worth on metric_time.
        -- Jan 1 because MetricFlow rolls every date to the start of its year, so this
        -- matches mishaps grouped by metric_time__year in the same query
        date(year, 1, 1)                                        as year_start_date,

        -- dollars, not $M, so ratios against mishap_cost come out as true fractions
        net_worth_adj_low_musd * 1000000                        as net_worth_adj_low_usd,
        net_worth_adj_mid_musd * 1000000                        as net_worth_adj_mid_usd,
        net_worth_adj_high_musd * 1000000                       as net_worth_adj_high_usd,

    from {{ ref('stg_ld_net_worth') }}

)

select * from net_worth_years
