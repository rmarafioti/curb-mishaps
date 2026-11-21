"use client";

// How the mishaps dent his net worth, one point per year 2000-2024: his real net worth, and
// what he'd have if every mishap so far came out of it. The shaded gap is the running total
// lost. Linear scale (a dent only looks its size on one). Positions only; every value comes
// from net_worth_dent.json.

import { useRef, useState } from "react";
import { type DentRow, label, netWorthDent, usdCompact, usdFull, yearOf } from "@/lib/data";

// labels come from the metric YAML (via the export), defined once
const NET_WORTH = label(netWorthDent, "net_worth_mid");
const AFTER = label(netWorthDent, "net_worth_after_mishaps_to_date");
const LOSS = label(netWorthDent, "cumulative_mishap_loss");

const WIDTH = 960;
const HEIGHT = 340;
const PAD = { top: 16, right: 148, bottom: 32, left: 64 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
const FIRST = 2000;
const LAST = 2024;
const Y_MAX = 700e6;
const Y_TICKS = [0, 100e6, 200e6, 300e6, 400e6, 500e6, 600e6, 700e6];
const X_TICKS = [2000, 2004, 2008, 2012, 2016, 2020, 2024];

const x = (year: number) => PAD.left + ((year - FIRST) / (LAST - FIRST)) * PLOT_W;
const y = (usd: number) => PAD.top + (1 - usd / Y_MAX) * PLOT_H;

type Props = { rows: DentRow[]; showYears: Set<number>; highlightYear?: number };

export default function NetWorthDent({ rows, showYears, highlightYear }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = rows
    .map((r) => ({ ...r, year: Number(yearOf(r.metric_time__year)) }))
    .sort((a, b) => a.year - b.year);
  const line = (value: (p: (typeof points)[number]) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year)},${y(value(p))}`).join(" ");
  const real = line((p) => p.net_worth_mid);
  const after = line((p) => p.net_worth_after_mishaps_to_date);
  // the gap: along the real line, then back along the after line
  const gap = `${real} ${[...points].reverse().map((p) => `L${x(p.year)},${y(p.net_worth_after_mishaps_to_date)}`).join(" ")} Z`;
  const last = points[points.length - 1];

  const onPointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const svgX = ((event.clientX - box.left) / box.width) * WIDTH;
    const year = Math.round(FIRST + ((svgX - PAD.left) / PLOT_W) * (LAST - FIRST));
    setActive(Math.min(LAST, Math.max(FIRST, year)));
  };
  const current = points.find((p) => p.year === active);
  const share = current ? x(current.year) / WIDTH : 0;

  return (
    <figure className="chart">
      <div className="legend" aria-hidden="true">
        <span className="legend-item"><span className="legend-line real" />{NET_WORTH}</span>
        <span className="legend-item"><span className="legend-swatch gap" />{LOSS}</span>
        <span className="legend-item"><span className="legend-line after" />{AFTER}</span>
      </div>

      <div className="plot">
        <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img"
             aria-label="Larry David's net worth each year, and what he'd have if every mishap so far were real">
          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line className={tick === 0 ? "axis" : "grid"} x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} />
              <text className="tick" x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                {tick === 0 ? "$0" : `$${tick / 1e6}M`}
              </text>
            </g>
          ))}
          {X_TICKS.map((year) => (
            <text key={year} className="tick" x={x(year)} y={HEIGHT - PAD.bottom + 20} textAnchor="middle">{year}</text>
          ))}

          {highlightYear !== undefined && (
            <rect className="year-band" x={x(highlightYear) - PLOT_W / (LAST - FIRST) / 2} y={PAD.top}
                  width={PLOT_W / (LAST - FIRST)} height={PLOT_H} />
          )}

          {/* the loss band: translucent Curb yellow at LD's Net Worth, fading out toward the
              Net Worth After Mishaps line */}
          <defs>
            <linearGradient id="loss-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="loss-fade-top" />
              <stop offset="100%" className="loss-fade-bottom" />
            </linearGradient>
          </defs>
          <path className="dent-gap" d={gap} fill="url(#loss-fade)" />
          <path className="dent-real" d={real} />
          <path className="dent-after" d={after} />

          {/* a dot on each year a season aired: where the mishaps come from */}
          {points.filter((p) => showYears.has(p.year)).map((p) => (
            <circle key={p.year} className="dot" cx={x(p.year)} cy={y(p.net_worth_after_mishaps_to_date)} r={4} fill="var(--series-1)" />
          ))}

          {last && (
            <>
              {/* two lines each (name, then amount) so they fit in the right margin */}
              <text className="direct-label" x={x(LAST) + 10} y={y(last.net_worth_mid) - 3}>
                <tspan>{NET_WORTH}</tspan>
                <tspan x={x(LAST) + 10} dy="15">{usdCompact(last.net_worth_mid)}</tspan>
              </text>
              <text className="direct-label" x={x(LAST) + 10} y={y(last.net_worth_after_mishaps_to_date) - 3}>
                <tspan>{AFTER}</tspan>
                <tspan x={x(LAST) + 10} dy="15">{usdCompact(last.net_worth_after_mishaps_to_date)}</tspan>
              </text>
            </>
          )}

          {current && <line className="crosshair" x1={x(current.year)} x2={x(current.year)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />}

          <rect className="hit" x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H}
                onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)} />
        </svg>

        {current && (
          <div className="tooltip" style={{
            left: `${share * 100}%`,
            top: `${(PAD.top / HEIGHT) * 100}%`,
            transform: `translate(${share > 0.6 ? "calc(-100% - 12px)" : "12px"}, 0)`,
          }}>
            <span className="tooltip-meta">{current.year}{showYears.has(current.year) ? "" : " · no season aired"}</span>
            <span className="tooltip-row"><span className="legend-line real" />{NET_WORTH}<strong>{usdFull(current.net_worth_mid)}</strong></span>
            <span className="tooltip-row"><span className="legend-swatch gap" />{LOSS}<strong>{usdFull(current.cumulative_mishap_loss)}</strong></span>
            <span className="tooltip-row"><span className="legend-line after" />{AFTER}<strong>{usdFull(current.net_worth_after_mishaps_to_date)}</strong></span>
          </div>
        )}
      </div>
      <figcaption className="note">
        Each year&apos;s real net worth minus every mishap up to that year. Losses are added up in the
        dollars of the year each one happened. This is the character&apos;s bill, not Larry David&apos;s
        actual bank account.
      </figcaption>
    </figure>
  );
}
