-- One row per Sheet row of the Mishaps tab (live external table), typed and cleaned.
-- Keeps every review status and the no-mishap placeholder rows, since dim_episode needs
-- them; fct_mishap filters to kept mishaps. Sheet-only working columns are left out.

with

source_mishaps as (

    select
        cast(episode_id as int64)                               as episode_id,
        cast(mishap_num as int64)                               as mishap_num,

        -- episode
        cast(season as int64)                                   as season,
        trim(title)                                             as episode_title,
        cast(trim(air_date) as date)                            as episode_date,
        extract(year from cast(trim(air_date) as date))         as episode_year,

        -- mishap
        cast(has_mishap as int64)                               as has_mishap,
        nullif(trim(description), '')                           as description,
        nullif(lower(trim(loss_kind)), '')                      as loss_kind,
        nullif(lower(trim(loss_kind_category)), '')             as loss_kind_category,
        cast(is_catastrophic as int64)                          as is_catastrophic,
        nullif(lower(trim(review_status)), '')                  as review_status,

        -- amounts, in dollars of the year the episode aired (not inflation-adjusted)
        {{ clean_usd('amount_usd') }}                           as amount_stated_usd,
        cast(amount_stated as int64)                            as amount_stated,
        {{ clean_usd('est_low_usd') }}                          as est_low_usd,
        {{ clean_usd('est_mid_usd') }}                          as est_mid_usd,
        {{ clean_usd('est_high_usd') }}                         as est_high_usd,
        nullif(trim(estimate_basis), '')                        as estimate_basis,
        nullif(lower(trim(confidence)), '')                     as confidence,

    from {{ source('sheets', 'mishaps') }}

)

select * from source_mishaps
