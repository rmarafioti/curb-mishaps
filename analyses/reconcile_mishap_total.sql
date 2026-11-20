-- Reconciliation: fct_mishap total mishap_cost vs. the kept rows in staging
-- (the Sheet). Compare `fct_total` with the Sheet's `Losses by Year` tab
-- ($262,024,688 as of 2026-11-19). Run with:
-- dbt show -s reconcile_mishap_total

with

source_mishaps as (

    select * from {{ ref('stg_mishaps') }}

),

source_fct as (

    select * from {{ ref('fct_mishap') }}

),

sheet_summary as (

    select
        count(*) as sheet_rows,
        sum(
            case
                when amount_stated = 1 then amount_usd
                else est_mid_usd
            end
        ) as sheet_total

    from source_mishaps
    where (review_status = 'keep' and has_mishap = 1)

),

fct_summary as (

    select
        count(*) as fct_rows,
        sum(mishap_cost) as fct_total,
        sum(if(loss_kind = 'realized' and is_catastrophic = 0, mishap_cost, 0)) as realized_total,
        sum(if(loss_kind = 'hypothetical', mishap_cost, 0)) as hypothetical_total,
        sum(mishap_cost * is_catastrophic) as catastrophic_total,
        sum(mishap_cost_2026) as fct_total_2026

    from source_fct

),

reconciliation as (

    select
        sheet_summary.sheet_rows,
        fct_summary.fct_rows,
        sheet_summary.sheet_total,
        fct_summary.fct_total,
        fct_summary.realized_total,
        fct_summary.hypothetical_total,
        fct_summary.catastrophic_total,
        fct_summary.fct_total_2026,
        (fct_summary.fct_total = sheet_summary.sheet_total) as is_reconciled

    from sheet_summary
    cross join fct_summary

)

select * from reconciliation
