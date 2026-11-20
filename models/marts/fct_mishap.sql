-- One row per kept mishap (review_status = 'keep' and has_mishap = 1); 'unsure' rows
-- flow in on the next build once Rich marks them 'keep'. mishap_cost is in dollars of
-- the year the episode aired (the default); mishap_cost_2026 converts it with that
-- year's CPI multiplier, for the cost trend and the forecast.

with

kept_mishaps as (

    select
        episode_id,
        mishap_num,
        episode_date,
        episode_year,
        description,
        loss_kind,
        loss_kind_category,
        is_catastrophic,
        mishap_source,
        amount_stated,
        amount_usd,
        est_low_usd,
        est_mid_usd,
        est_high_usd,
        estimate_basis,
        confidence,
        if(amount_stated = 1, amount_usd, est_mid_usd)          as mishap_cost,

    from {{ ref('stg_mishaps') }}
    where (review_status = 'keep' and has_mishap = 1)

),

dollar_multipliers as (

    select
        year,
        to_2026_dollars_multiplier,

    from {{ ref('dim_net_worth') }}

),

mishap_costs as (

    select
        {{ dbt_utils.generate_surrogate_key([
            'kept_mishaps.episode_id',
            'kept_mishaps.mishap_num',
        ]) }}                                                   as mishap_key,
        kept_mishaps.episode_id,
        kept_mishaps.mishap_num,
        kept_mishaps.episode_date,
        kept_mishaps.episode_year,
        kept_mishaps.description,
        kept_mishaps.loss_kind,
        kept_mishaps.loss_kind_category,
        kept_mishaps.is_catastrophic,
        kept_mishaps.mishap_source,
        kept_mishaps.amount_stated,
        kept_mishaps.amount_usd,
        kept_mishaps.est_low_usd,
        kept_mishaps.est_mid_usd,
        kept_mishaps.est_high_usd,
        kept_mishaps.estimate_basis,
        kept_mishaps.confidence,
        kept_mishaps.mishap_cost,
        round(
            kept_mishaps.mishap_cost * dollar_multipliers.to_2026_dollars_multiplier, 2
        )                                                       as mishap_cost_2026,

    from kept_mishaps
    left join dollar_multipliers
        on kept_mishaps.episode_year = dollar_multipliers.year

)

select * from mishap_costs
