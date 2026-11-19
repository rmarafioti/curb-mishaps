with

source_net_worth as (

    select * from {{ ref('ld_net_worth_cpi') }}

),

renamed as (

    select
        year,
        net_worth_low_musd,
        net_worth_mid_musd,
        net_worth_high_musd,
        net_worth_adj_low_musd,
        net_worth_adj_mid_musd,
        net_worth_adj_high_musd,
        real_divorce_addback_mid_musd,
        basis as net_worth_basis,
        event as net_worth_event,
        source as net_worth_source,
        cpi_u_annual_avg,
        cpi_basis,
        to_2026_dollars_multiplier

    from source_net_worth

)

select * from renamed
