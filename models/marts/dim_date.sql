{#
    One row per day from the show's start through 2028 (covers the 2025-2027
    forecast). Doubles as MetricFlow's time spine (see _marts_models.yml).
#}

with

date_spine as (

    {{ dbt_utils.date_spine(
        datepart="day",
        start_date="cast('2000-01-01' as date)",
        end_date="cast('2029-01-01' as date)"
    ) }}

),

date_parts as (

    select
        cast(date_day as date) as date_day,
        extract(year from date_day) as date_year,
        extract(quarter from date_day) as date_quarter,
        extract(month from date_day) as date_month,
        date_trunc(cast(date_day as date), year) as year_start_date,
        date_trunc(cast(date_day as date), month) as month_start_date

    from date_spine

)

select * from date_parts
