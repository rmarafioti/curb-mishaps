"use client";

// Tab 3, Net Worth to Mishaps by Year: his real net worth against what he'd have if every
// mishap so far were real. The season filter highlights that season's year.

import NetWorthDent from "@/components/NetWorthDent";
import { mishapList, netWorthDent, yearOf } from "@/lib/data";
import { useFilters } from "@/lib/filters";

// each season aired in one year
const SEASON_YEAR = new Map(mishapList.rows.map((m) => [m.episode__season, Number(yearOf(m.metric_time__year))]));
const SHOW_YEARS = new Set(SEASON_YEAR.values());

export default function NetWorthByYear() {
  const { filters } = useFilters();
  const seasonYear = filters.episode__season ? SEASON_YEAR.get(filters.episode__season) : undefined;

  return (
    <>
      <header className="masthead">
        <h1>Net worth to mishaps by year</h1>
        <p className="lede">His real net worth, and what he&apos;d have if every mishap so far came out of it.</p>
      </header>

      <section className="card">
        <h2>{netWorthDent.label}</h2>
        <NetWorthDent rows={netWorthDent.rows} showYears={SHOW_YEARS} highlightYear={seasonYear} />
      </section>
    </>
  );
}
