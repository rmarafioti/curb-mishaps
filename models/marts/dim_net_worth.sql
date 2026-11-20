-- One row per year (2000-2027): net worth in dollars, the 2026-dollars multiplier, and
-- whether the show aired. Net worth is semi-additive, so it is never summed across years
-- or pre-joined to mishaps; the date MetricFlow needs for it is defined in the semantic
-- layer, not here.

with

net_worth_years as (

    select
        year,
        is_show_airing,
        to_2026_dollars_multiplier,

        -- dollars, not $M, so ratios against mishap_cost come out as true fractions
        net_worth_adj_mid_musd * 1000000                        as net_worth_adj_mid_usd,

    from {{ ref('stg_ld_net_worth') }}

)

select * from net_worth_years
