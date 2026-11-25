"use client";

// The "show all mishaps" table under the timeline: collapsed by default, 10 rows a page when
// open. On wider screens Aired and Episode stay frozen while the rest (what happened, cost,
// how we priced it, led by the price range on estimates) scrolls sideways; phones stack each
// mishap as a small card. The pager sits on the toggle's line, so it stays put whatever the rows' height (a
// native <details> can't hold buttons in its summary without them toggling it too). It
// always opens on page 1: closing it resets the page, and so does a refresh, coming back
// to the tab, or a filter change (the parent re-keys it).

import { useState } from "react";
import InfoTip from "@/components/InfoTip";
import { type Mishap, dateOf, episodeCode, splitBasis, titleCase, usdCompact, usdFull } from "@/lib/data";

const PAGE_SIZE = 10;

// the four pricing methods, A to Z (the same wording as the Top 10 legend), behind the "i"
const PRICING_KEY = (
  <>
    <strong>Assumption:</strong> a reasoned best guess<br />
    <strong>Category default:</strong> a typical price for that kind of item<br />
    <strong>Reference:</strong> a real price for the same thing<br />
    <strong>Stated:</strong> said in the episode
  </>
);

export default function MishapTable({ mishaps }: { mishaps: Mishap[] }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [scrolled, setScrolled] = useState(false); // shows the frozen columns' shadow once rows slide under them
  const pageCount = Math.max(1, Math.ceil(mishaps.length / PAGE_SIZE));
  const first = page * PAGE_SIZE;
  const rows = mishaps.slice(first, first + PAGE_SIZE);

  return (
    <div className="table-view">
      <div className="table-bar">
        <button type="button" className="disclosure-toggle" aria-expanded={open} aria-controls="mishap-table"
                onClick={() => { setOpen(!open); setPage(0); }}>
          {open ? `Hide all ${mishaps.length} mishaps` : `Show all ${mishaps.length} mishaps and see how each was priced`}
        </button>
        {open && pageCount > 1 && (
          <nav className="pager" aria-label="Table pages">
            <button type="button" onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="Previous 10 mishaps">
              Prev
            </button>
            <span className="pager-status">
              {first + 1}–{first + rows.length} of {mishaps.length}
            </span>
            <button type="button" onClick={() => setPage(page + 1)} disabled={page === pageCount - 1} aria-label="Next 10 mishaps">
              Next
            </button>
          </nav>
        )}
      </div>
      {/* phones hide the column headers (each mishap is a card), so the key sits above the list */}
      {open && (
        <p className="phone-only pricing-key">
          <span className="with-tip">How It Was Priced<InfoTip term="How It Was Priced">{PRICING_KEY}</InfoTip></span>
        </p>
      )}
      {open && (
        <div id="mishap-table" className={`table-scroll${scrolled ? " is-scrolled" : ""}`}
             onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 0)}>
          <table className="mishap-table">
            <thead>
              <tr>
                <th className="m-date">Aired</th>
                <th className="m-episode">Episode</th>
                <th>What Happened</th>
                <th className="num">Cost</th>
                <th className="th-tip">
                  <span className="with-tip">How It Was Priced<InfoTip term="How It Was Priced">{PRICING_KEY}</InfoTip></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const basis = m.mishap__estimate_basis ? splitBasis(m.mishap__estimate_basis) : null;
                // estimates get their low – mid – high range above the note (some notes refer to
                // "the low end" or "the high end"); a stated price has no range (low = high)
                const estimated = m.total_mishap_loss_low !== m.total_mishap_loss_high;
                return (
                  <tr key={m.mishap}>
                    <td className="nowrap m-date">{dateOf(m.metric_time__day)}</td>
                    <td className="nowrap m-episode">{episodeCode(m)} · {m.episode__episode_title}</td>
                    <td className="m-what">{m.mishap__description}</td>
                    <td className="num m-cost">{usdFull(m.total_mishap_loss)}</td>
                    <td className="m-basis">
                      {estimated && (
                        <span className="m-range">
                          <span className="phone-label">Price range </span>
                          {usdCompact(m.total_mishap_loss_low)} –{" "}
                          <mark className="range-mid">{usdCompact(m.total_mishap_loss)}</mark> –{" "}
                          {usdCompact(m.total_mishap_loss_high)}
                        </span>
                      )}
                      {basis && (
                        <>
                          <span className="phone-label">How it was priced: </span>
                          <span className="m-note">
                            {basis.kind && <strong>{titleCase(basis.kind)}.</strong>} {basis.note}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
