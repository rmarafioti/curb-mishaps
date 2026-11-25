"use client";

// Tab 2, Top 10 Disasters: the ten most expensive mishaps matching the filters, with how
// each was priced. Sorting and picking only.

import { type Mishap, byNumber, episodeCode, pickMishaps, splitBasis, titleCase, usdCompact, usdFull } from "@/lib/data";
import { useFilters } from "@/lib/filters";

// The pricing note's lead word (splitBasis) is the pricing method, bolded at the start of the
// note and defined once in the legend above the table. Catastrophic is a separate flag after
// the title, from the data's is_catastrophic flag.

export default function TopDisasters() {
  const { filters } = useFilters();
  // most expensive first; ties in the order they aired
  const top10 = pickMishaps(filters)
    .sort((a, b) =>
      byNumber((m: Mishap) => m.total_mishap_loss, true)(a, b) || a.metric_time__day.localeCompare(b.metric_time__day))
    .slice(0, 10);

  return (
    <>
      <header className="masthead">
        <p className="hero-lede">The biggest losers.</p>
        <h1>Top 10 Disasters</h1>
        <p className="lede">The ten most expensive mishaps, and how each one was priced.</p>
      </header>

      {/* the key, in its own box above the list: the four pricing methods (each note leads with
          one) and the catastrophic mark */}
      {top10.length > 0 && (
        <section className="card legend-card" aria-labelledby="legend-title">
          <h2 id="legend-title" className="legend-title">Legend</h2>
          <dl className="method-legend">
            {/* pricing methods A to Z, then the catastrophic mark */}
            <div><dt>Assumption:</dt> <dd>a reasoned best guess</dd></div>
            <div><dt>Category default:</dt> <dd>a typical price for that kind of item</dd></div>
            <div><dt>Reference:</dt> <dd>a real price for the same thing</dd></div>
            <div><dt>Stated:</dt> <dd>said in the episode</dd></div>
            <div>
              <dt><span className="cat-star" aria-hidden="true">*</span> Catastrophic:</dt>{" "}
              <dd>a life-changing loss</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="card">
        {top10.length === 0 ? (
          <p className="card-sub">No mishaps match these filters.</p>
        ) : (
          <>
          <div className="table-scroll">
            <table className="top10">
              <thead>
                <tr>
                  <th><span className="sr-only">Rank</span></th><th>What Happened</th>
                  <th>Episode</th><th className="num">Cost</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((m, i) => {
                  const basis = splitBasis(m.mishap__estimate_basis);
                  // estimates show their low – mid – high range (the notes refer to the low,
                  // mid and high ends); a stated price has none (low = high)
                  const estimated = m.total_mishap_loss_low !== m.total_mishap_loss_high;
                  return (
                    <tr key={m.mishap}>
                      <td className="rank">{i + 1}</td>
                      <td className="t-title">
                        <span className="mishap-title">
                          {m.mishap__description}
                          {/* the flag comes from the data, not the note's wording */}
                          {m.mishap__is_catastrophic === "1" && (
                            <span className="cat-star" title="Catastrophic">
                              <span aria-hidden="true">*</span><span className="sr-only">Catastrophic</span>
                            </span>
                          )}
                        </span>
                        {estimated && (
                          <span className="t-range">
                            {usdCompact(m.total_mishap_loss_low)} –{" "}
                            <mark className="range-mid">{usdCompact(m.total_mishap_loss)}</mark> –{" "}
                            {usdCompact(m.total_mishap_loss_high)}
                          </span>
                        )}
                        {(basis.kind || basis.note) && (
                          <span className="basis">
                            {basis.kind && <strong>{titleCase(basis.kind)}.</strong>} {basis.note}
                          </span>
                        )}
                      </td>
                      <td className="nowrap t-episode">{episodeCode(m)} · {m.episode__episode_title}</td>
                      <td className="num top-cost">{usdFull(m.total_mishap_loss)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </>
  );
}
