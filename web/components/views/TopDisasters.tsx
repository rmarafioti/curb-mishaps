"use client";

// Tab 2, Top 10 Disasters: the ten most expensive mishaps matching the filters, with how
// each was priced. Sorting and picking only.

import { type Mishap, byNumber, episodeCode, pickMishaps, splitBasis, usdFull } from "@/lib/data";
import { useFilters } from "@/lib/filters";

// The pricing note's lead word (splitBasis) becomes the pricing-method pill. Catastrophic is
// a separate flag after the title (text, not a pill, so it doesn't read as a pricing
// method), from the data's is_catastrophic flag.

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
        <h1>Top 10 disasters</h1>
        <p className="lede">The ten most expensive mishaps, and how each one was priced.</p>
      </header>

      <section className="card">
        {top10.length === 0 ? (
          <p className="card-sub">No mishaps match these filters.</p>
        ) : (
          <div className="table-scroll">
            <table className="top10">
              <thead>
                <tr>
                  <th><span className="sr-only">Rank</span></th><th>What happened</th><th className="nowrap t-pill">Pricing method</th>
                  <th>Episode</th><th className="num">Cost</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((m, i) => {
                  const basis = splitBasis(m.mishap__estimate_basis);
                  return (
                    <tr key={m.mishap}>
                      <td className="rank">{i + 1}</td>
                      <td className="t-title">
                        <span className="mishap-title">
                          {m.mishap__description}
                          {/* the flag comes from the data, not the note's wording */}
                          {m.mishap__is_catastrophic === "1" && <span className="cat-flag">Catastrophic</span>}
                        </span>
                        {basis.note && <span className="basis">{basis.note}</span>}
                      </td>
                      <td className="t-pill">
                        {basis.kind && (
                          <span className={`pill pill-${basis.kind.replace(" ", "-")}`}>{basis.kind}</span>
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
        )}
      </section>
    </>
  );
}
