"use client";

// The "show all mishaps" table under the timeline: collapsed by default, 10 rows a page when
// open. The pager sits on the toggle's line, so it stays put whatever the rows' height (a
// native <details> can't hold buttons in its summary without them toggling it too). It
// always opens on page 1: closing it resets the page, and so does a refresh, coming back
// to the tab, or a filter change (the parent re-keys it).

import { useState } from "react";
import { type Mishap, dateOf, episodeCode, usdFull } from "@/lib/data";

const PAGE_SIZE = 10;

export default function MishapTable({ mishaps }: { mishaps: Mishap[] }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(mishaps.length / PAGE_SIZE));
  const first = page * PAGE_SIZE;
  const rows = mishaps.slice(first, first + PAGE_SIZE);

  return (
    <div className="table-view">
      <div className="table-bar">
        <button type="button" className="disclosure-toggle" aria-expanded={open} aria-controls="mishap-table"
                onClick={() => { setOpen(!open); setPage(0); }}>
          {open ? "Hide" : "Show"} all {mishaps.length} mishaps
        </button>
        {open && pageCount > 1 && (
          <nav className="pager" aria-label="Table pages">
            <button type="button" onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="Previous 10 mishaps">
              <span className="pager-arrow" aria-hidden="true">‹</span> Prev
            </button>
            <span className="pager-status">
              {first + 1}–{first + rows.length} of {mishaps.length}
            </span>
            <button type="button" onClick={() => setPage(page + 1)} disabled={page === pageCount - 1} aria-label="Next 10 mishaps">
              Next <span className="pager-arrow" aria-hidden="true">›</span>
            </button>
          </nav>
        )}
      </div>
      {open && (
        <div id="mishap-table" className="table-scroll">
          <table className="mishap-table">
            <thead>
              <tr><th>Aired</th><th>Episode</th><th>What happened</th><th className="num">Cost</th></tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.mishap}>
                  <td className="nowrap m-date">{dateOf(m.metric_time__day)}</td>
                  <td className="nowrap m-episode">{episodeCode(m)} · {m.episode__episode_title}</td>
                  <td className="m-what">{m.mishap__description}</td>
                  <td className="num m-cost">{usdFull(m.total_mishap_loss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
