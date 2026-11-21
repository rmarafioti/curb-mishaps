"use client";

// Tab 1, Mishap Costs by Season: the headline numbers, every mishap on the timeline, and
// the same mishaps as a table. Numbers come from the export; this only picks and formats.

import MishapTable from "@/components/MishapTable";
import MishapTimeline from "@/components/MishapTimeline";
import { kpis, label, pick, pickMishaps, usdCompact } from "@/lib/data";
import { useFilters } from "@/lib/filters";

export default function CostsBySeason() {
  const { filters } = useFilters();
  const k = pick(kpis, filters)[0];
  const mishaps = pickMishaps(filters);

  return (
    <>
      <header className="masthead">
        <h1>Mishap costs by season</h1>
        <p className="lede">
          Every on-screen financial mishap across 12 seasons, priced in the dollars of the year it aired.
        </p>
      </header>

      {k ? (
        <section className="kpis" aria-label={kpis.label}>
          <div className="hero">
            <span className="kpi-label">{label(kpis, "total_mishap_loss")}</span>
            <span className="hero-value">{usdCompact(k.total_mishap_loss)}</span>
            <span className="kpi-sub">
              Range {usdCompact(k.total_mishap_loss_low)} – {usdCompact(k.total_mishap_loss_high)}
            </span>
          </div>
          <div className="tile">
            <span className="kpi-label">Mishaps</span>
            <span className="tile-value">{k.mishap_count}</span>
          </div>
          <div className="tile">
            <span className="kpi-label">Typical mishap</span>
            <span className="tile-value">{usdCompact(k.median_mishap_cost)}</span>
            <span className="kpi-sub">lower median</span>
          </div>
        </section>
      ) : (
        <section className="card empty">No mishaps match these filters.</section>
      )}

      <section className="card">
        <h2>Every mishap, 2000–2024</h2>
        <p className="card-sub">
          <span className="hover-only">Hover or tab to a dot to see what happened and how it was priced.</span>
          <span className="touch-only">Swipe sideways through all 12 seasons; every mishap is listed below.</span>
        </p>
        <MishapTimeline mishaps={mishaps} />
        <MishapTable key={`${filters.episode__season}|${filters.mishap__loss_kind}`} mishaps={mishaps} />
      </section>
    </>
  );
}
