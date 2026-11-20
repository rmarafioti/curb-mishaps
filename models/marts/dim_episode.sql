-- One row per episode, from every Sheet row regardless of review status, so
-- episodes with no mishap (has_mishap = 0 placeholders) are included.
-- Episode attributes repeat on each mishap row in the Sheet; the unique test on
-- episode_id catches it if two rows of the same episode ever disagree.

with

episode_list as (

    select distinct
        episode_id,
        season,
        episode_title,
        episode_date,
        episode_year,

    from {{ ref('stg_mishaps') }}

)

select * from episode_list
