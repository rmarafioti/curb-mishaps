-- Every kept mishap in the Sheet reaches fct_mishap, for each loss_kind.
-- Hypothetical losses always count toward the total; if any kept row
-- (realized or hypothetical) is dropped, or its cost changes, this returns
-- the mismatched loss_kind and the build fails.

with

source_mishaps as (

    select * from {{ ref('stg_mishaps') }}

),

source_fct as (

    select * from {{ ref('fct_mishap') }}

),

sheet_by_kind as (

    select
        loss_kind,
        count(*) as sheet_rows,
        sum(
            case
                when amount_stated = 1 then amount_usd
                else est_mid_usd
            end
        ) as sheet_cost

    from source_mishaps
    where (review_status = 'keep' and has_mishap = 1)
    group by loss_kind

),

fct_by_kind as (

    select
        loss_kind,
        count(*) as fct_rows,
        sum(mishap_cost) as fct_cost

    from source_fct
    group by loss_kind

),

mismatches as (

    select
        sheet_by_kind.sheet_rows,
        fct_by_kind.fct_rows,
        sheet_by_kind.sheet_cost,
        fct_by_kind.fct_cost,
        coalesce(sheet_by_kind.loss_kind, fct_by_kind.loss_kind) as loss_kind

    from sheet_by_kind
    full outer join fct_by_kind
        on sheet_by_kind.loss_kind = fct_by_kind.loss_kind
    where (
        sheet_by_kind.loss_kind is null
        or fct_by_kind.loss_kind is null
        or sheet_by_kind.sheet_rows != fct_by_kind.fct_rows
        -- costs are float64, so allow a cent of rounding noise from summing in a different order
        or abs(sheet_by_kind.sheet_cost - fct_by_kind.fct_cost) > 0.01
    )

)

select * from mismatches
