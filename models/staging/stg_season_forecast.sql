-- The forecast seasons from the season_forecast seed, written by scripts/forecast.py.
-- The seed is typed in its yml and holds only the columns the models use, so this
-- only names them; the numbers are the script's Monte Carlo results.

select
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

from {{ ref('season_forecast') }}
