"use client";

// Tab 3, Net Worth vs. Mishaps: his real net worth against what he'd have if every mishap
// so far were real. KPI tiles show one year's three figures (2024, or the filtered season's
// year). A season tile shows what the picked season cost him (from the year table), or a
// prompt to pick one; picking a season also highlights its year on the chart. Picks rows only.

import NetWorthDent from "@/components/NetWorthDent";
import { label, lossesByYear, mishapList, netWorthDent, percent, usdCompact, usdFull, yearOf } from "@/lib/data";
import { useFilters } from "@/lib/filters";

// each season aired in one year
const SEASON_YEAR = new Map(mishapList.rows.map((m) => [m.episode__season, Number(yearOf(m.metric_time__year))]));
const SEASON_OF_YEAR = new Map([...SEASON_YEAR].map(([season, year]) => [year, season]));
const LAST_YEAR = Math.max(...netWorthDent.rows.map((r) => Number(yearOf(r.metric_time__year))));

export default function NetWorthByYear() {
  const { filters } = useFilters();
  const seasonYear = filters.episode__season ? SEASON_YEAR.get(filters.episode__season) : undefined;
  const kpiYear = seasonYear ?? LAST_YEAR;
  const row = netWorthDent.rows.find((r) => Number(yearOf(r.metric_time__year)) === kpiYear);
  // the picked season's own year, from the year table: what that season cost him
  const seasonRow = seasonYear === undefined
    ? undefined
    : lossesByYear.rows.find((r) => Number(yearOf(r.metric_time__year)) === seasonYear);

  return (
    <>
      <header className="masthead">
        <h1>Net worth to mishaps by year</h1>
        {/* the final-season joke: the J.G. Wentworth commercial */}
        <p className="hero-lede">&ldquo;I have a structured settlement and I need cash nooowwww!&rdquo;</p>
        <p className="lede">His real net worth, and what he&apos;d have if every mishap so far came out of it.</p>
      </header>

      {row && (
        <section className="kpis" aria-label={`Net worth in ${kpiYear}`}>
          <div className="hero">
            <span className="kpi-label">{label(netWorthDent, "net_worth_after_mishaps_to_date")}, {kpiYear}</span>
            <span className="hero-value">{usdCompact(row.net_worth_after_mishaps_to_date)}</span>
            <span className="kpi-sub">His real net worth minus every mishap up to {kpiYear}</span>
          </div>
          <div className="tile">
            <span className="kpi-label">{label(netWorthDent, "net_worth_mid")}</span>
            <span className="tile-value">{usdCompact(row.net_worth_mid)}</span>
            <span className="kpi-sub">reported, {kpiYear}</span>
          </div>
          <div className="tile">
            <span className="kpi-label">{label(netWorthDent, "cumulative_mishap_loss")}</span>
            <span className="tile-value">{usdCompact(row.cumulative_mishap_loss)}</span>
            <span className="kpi-sub">every mishap through {kpiYear}</span>
          </div>
        </section>
      )}

      {/* always there: what the picked season cost him, or a prompt to pick one */}
      <section className="card season-callout" aria-label="What one season cost him">
        {seasonRow ? (
          <>
            <span className="kpi-label">
              Season {filters.episode__season} ({seasonYear}): {label(lossesByYear, "total_mishap_loss")}
            </span>
            <span className="tile-value">{usdFull(seasonRow.total_mishap_loss)}</span>
            <span className="kpi-sub">
              {percent(seasonRow.pct_mishap_to_net_worth)}{" "}
              {/* the metric label is "% of Net Worth"; the figure already carries the % */}
              {label(lossesByYear, "pct_mishap_to_net_worth").replace(/^%\s*/, "").toLowerCase()} that year
            </span>
          </>
        ) : (
          <>
            <span className="kpi-label">What did one season cost him?</span>
            <span className="kpi-sub">Pick a season above to see its total and its share of his net worth that year.</span>
          </>
        )}
      </section>

      <section className="card">
        <h2>{netWorthDent.label}</h2>
        <NetWorthDent rows={netWorthDent.rows} seasonOf={SEASON_OF_YEAR} highlightYear={seasonYear} />
      </section>
    </>
  );
}
