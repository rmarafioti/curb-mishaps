with

source_mishaps as (

    select * from {{ source('sheets', 'mishaps') }}

),

renamed as (

    select
        -- keys: episode_id + mishap_num is the natural key (both assigned once in the Sheet)
        {{ dbt_utils.generate_surrogate_key(['episode_id', 'mishap_num']) }} as mishap_id,
        safe_cast(episode_id as int64) as episode_id,
        safe_cast(mishap_num as int64) as mishap_num,
        safe_cast(row_id as int64) as sheet_row_id,

        -- episode
        safe_cast(season as int64) as season,
        safe_cast(episode_in_season as int64) as episode_in_season,
        trim(title) as episode_title,
        safe_cast(trim(air_date) as date) as episode_date,

        -- mishap
        coalesce(safe_cast(has_mishap as int64) = 1, false) as has_mishap,
        nullif(trim(description), '') as description,
        nullif(lower(trim(loss_kind)), '') as loss_kind,
        nullif(lower(trim(loss_kind_category)), '') as loss_kind_category,
        coalesce(upper(trim(is_catastrophic)) = 'TRUE', false) as is_catastrophic,
        nullif(lower(trim(source)), '') as mishap_source,

        -- review
        nullif(lower(trim(review_status)), '') as review_status,
        nullif(trim(review_notes), '') as review_notes,

        -- amounts (year-of-event dollars)
        {{ clean_usd('amount_usd') }} as amount_usd,
        safe_cast(amount_stated as int64) as amount_stated,
        {{ clean_usd('est_low_usd') }} as est_low_usd,
        {{ clean_usd('est_mid_usd') }} as est_mid_usd,
        {{ clean_usd('est_high_usd') }} as est_high_usd,
        nullif(trim(estimate_basis), '') as estimate_basis,
        nullif(lower(trim(confidence)), '') as confidence

    from source_mishaps
    where episode_id is not null

),

with_year as (

    select
        *,
        extract(year from episode_date) as episode_year

    from renamed

)

select * from with_year
