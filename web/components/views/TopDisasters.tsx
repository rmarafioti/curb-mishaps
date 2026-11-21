"use client";

// Tab 2, Top 10 Disasters: the ten most expensive mishaps matching the filters, with how
// each was priced. Sorting and picking only.

import { byNumber, episodeCode, pickMishaps, usdFull } from "@/lib/data";
import { useFilters } from "@/lib/filters";

export default function TopDisasters() {
  const { filters } = useFilters();
  const top10 = pickMishaps(filters).sort(byNumber((m) => m.total_mishap_loss, true)).slice(0, 10);

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
            <table>
              <thead>
                <tr><th>#</th><th>What happened</th><th>Episode</th><th className="num">Cost</th></tr>
              </thead>
              <tbody>
                {top10.map((m, i) => (
                  <tr key={m.mishap}>
                    <td>{i + 1}</td>
                    <td>
                      {m.mishap__description}
                      {m.mishap__estimate_basis && <span className="basis">{m.mishap__estimate_basis}</span>}
                    </td>
                    <td className="nowrap">{episodeCode(m)} · {m.episode__episode_title}</td>
                    <td className="num">{usdFull(m.total_mishap_loss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
