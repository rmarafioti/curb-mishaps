-- Net worth and CPI by year, from the ld_net_worth_cpi seed (the columns of the
-- Sheet's LD Net Worth tab that the models use). Renames them to model names;
-- dim_net_worth converts $M to dollars and adds the time dimension.

with

source_net_worth as (

    select
        year,
        is_show_airing,
        net_worth_adj_low_musd,
        net_worth_adj_mid_musd,
        net_worth_adj_high_musd,
        basis                                   as net_worth_basis,
        event                                   as net_worth_event,
        cpi_u_annual_avg                        as cpi_index,
        to_2026_dollars_multiplier,

    from {{ ref('ld_net_worth_cpi') }}

)

select * from source_net_worth
