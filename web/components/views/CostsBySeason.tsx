"use client";

// Tab 1, Mishap Costs by Season: the headline numbers, every mishap on the timeline, and
// the same mishaps as a table. Numbers come from the export; this only picks and formats.

import InfoTip from "@/components/InfoTip";
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
        <p className="hero-lede">What&apos;s the damage?!</p>
        <h1>Mishap Costs by Season</h1>
        <p className="lede">
          Each on-screen financial mishap across 12 seasons, priced at what it cost the year it aired.
        </p>
      </header>

      {k ? (
        <section className="kpis" aria-label={kpis.label}>
          <div className="hero">
            <span className="kpi-label">{label(kpis, "total_mishap_loss")}</span>
            <span className="hero-value">{usdCompact(k.total_mishap_loss)}</span>
            <span className="kpi-sub">
              {/* low – mid – high, like the timeline tooltip; the mid is the total we count */}
              Range {usdCompact(k.total_mishap_loss_low)} –{" "}
              <mark className="range-mid">{usdCompact(k.total_mishap_loss)}</mark> –{" "}
              {usdCompact(k.total_mishap_loss_high)}
            </span>
          </div>
          <div className="tile">
            <span className="kpi-label">Mishap Count</span>
            <span className="tile-value">{k.mishap_count}</span>
          </div>
          <div className="tile">
            <span className="kpi-label with-tip">
              Typical Mishap Cost
              <InfoTip term="Typical Mishap Cost">
                <strong>Lower median:</strong> the middle cost when every mishap is lined up from
                lowest to highest. With an even number of mishaps, the lower of the two middle
                mishaps is picked.
              </InfoTip>
            </span>
            <span className="tile-value">{usdCompact(k.median_mishap_cost)}</span>
          </div>
        </section>
      ) : (
        <section className="card empty">No mishaps match these filters.</section>
      )}

      <section className="card">
        <h2>Every Mishap, 2000–2024</h2>
        <p className="card-sub">
          <span className="hover-only">Hover over a dot to see what happened.</span>
          <span className="touch-only">Swipe sideways through all 12 seasons.</span>
        </p>
        <MishapTimeline mishaps={mishaps} />
        <MishapTable key={Object.values(filters).join("|")} mishaps={mishaps} />
      </section>
    </>
  );
}
