"use client";

// Tab 3, Net Worth vs. Mishaps: his real net worth against what he'd have if every mishap
// so far were real. KPI tiles show one year's three figures (2024, or the filtered season's
// year); the season filter also highlights that year on the chart. Picks rows only.

import NetWorthDent from "@/components/NetWorthDent";
import { label, mishapList, netWorthDent, usdCompact, yearOf } from "@/lib/data";
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

      <section className="card">
        <h2>{netWorthDent.label}</h2>
        <NetWorthDent rows={netWorthDent.rows} seasonOf={SEASON_OF_YEAR} highlightYear={seasonYear} />
      </section>
    </>
  );
}
