-- One row per day from the show's start through 2028 (covers the 2025-2027
-- forecast). It is MetricFlow's time spine; MetricFlow builds year, quarter and
-- month from date_day itself, so no other date parts are needed here.

with

date_spine as (

    {{ dbt_utils.date_spine(
        datepart="day",
        start_date="cast('2000-01-01' as date)",
        end_date="cast('2029-01-01' as date)"
    ) }}

),

calendar_days as (

    select cast(date_day as date)                               as date_day,

    from date_spine

)

select * from calendar_days
