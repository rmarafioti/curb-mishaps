-- Two rows per forecast season (13 in 2025, 14 in 2026): what another season would likely
-- have cost with everyday mishaps only, and if a catastrophe hits. From scripts/forecast.py
-- by way of the seed; adds only the key the semantic layer needs. Medians and percentiles
-- are never summed across seasons or versions.

select
    {{ dbt_utils.generate_surrogate_key(['season', 'has_forecast_catastrophe']) }}  as season_forecast_key,
    season,
    air_year,
    has_forecast_catastrophe,
    episodes,
    mishaps_p10,
    mishaps_median,
    mishaps_p90,
    loss_p10_usd,
    loss_median_usd,
    loss_p90_usd,
    catastrophe_chance,

from {{ ref('stg_season_forecast') }}
