-- Net worth and the 2026-dollars multiplier by year, from the ld_net_worth_cpi seed.
-- Selects only the columns the models use; the seed's reference columns (low/high,
-- basis, event, CPI) stay in the seed. dim_net_worth converts $M to dollars.

with

source_net_worth as (

    select
        year,
        is_show_airing,
        net_worth_adj_mid_musd,
        to_2026_dollars_multiplier,

    from {{ ref('ld_net_worth_cpi') }}

)

select * from source_net_worth
