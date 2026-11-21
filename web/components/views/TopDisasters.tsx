"use client";

// Tab 2, Top 10 Disasters: the ten most expensive mishaps matching the filters, with how
// each was priced. Sorting and picking only.

import { type Mishap, byNumber, episodeCode, pickMishaps, usdFull } from "@/lib/data";
import { useFilters } from "@/lib/filters";

// Each pricing note opens with how it was priced ("catastrophic.", "assumption:",
// "reference:", "category default:", "stated"); that lead word becomes a colored pill and
// the rest stays as the note. Text splitting only.
const BASIS_KINDS = ["catastrophic", "assumption", "reference", "category default", "stated"];

function splitBasis(basis: string): { kind?: string; note: string } {
  const kind = BASIS_KINDS.find((k) => basis.toLowerCase().startsWith(k));
  if (!kind) return { note: basis };
  const note = basis.slice(kind.length).replace(/^[.:]\s*/, "");
  return { kind, note: note.charAt(0).toUpperCase() + note.slice(1) };
}

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
                        <span className="mishap-title">{m.mishap__description}</span>
                        {basis.note && <span className="basis">{basis.note}</span>}
                      </td>
                      <td className="t-pill">
                        {basis.kind && <span className={`pill pill-${basis.kind.replace(" ", "-")}`}>{basis.kind}</span>}
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
