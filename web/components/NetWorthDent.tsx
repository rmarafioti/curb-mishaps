"use client";

// How the mishaps dent his net worth, one point per year 2000-2024: his real net worth, and
// what he'd have if every mishap so far came out of it. The shaded gap is the running total
// lost. Linear scale (a dent only looks its size on one). Positions only; every value comes
// from net_worth_dent.json.

import { useRef, useState } from "react";
import { type DentRow, label, netWorthDent, usdFull, usdMillions, yearOf } from "@/lib/data";

// labels come from the metric YAML (via the export), defined once
const NET_WORTH = label(netWorthDent, "net_worth_mid");
const AFTER = label(netWorthDent, "net_worth_after_mishaps_to_date");
const LOSS = label(netWorthDent, "cumulative_mishap_loss");

const WIDTH = 960;
const HEIGHT = 340;
const PAD = { top: 16, right: 20, bottom: 32, left: 64 }; // right: room for the last dot (the end values are KPI tiles above)
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
const FIRST = 2000;
const LAST = 2024;
const Y_MAX = 700e6;
const Y_TICKS = [0, 100e6, 200e6, 300e6, 400e6, 500e6, 600e6, 700e6];
const X_TICKS = [2000, 2004, 2008, 2012, 2016, 2020, 2024];

const x = (year: number) => PAD.left + ((year - FIRST) / (LAST - FIRST)) * PLOT_W;
const y = (usd: number) => PAD.top + (1 - usd / Y_MAX) * PLOT_H;

// seasonOf: the season that aired each year (years without one have no entry)
type Props = { rows: DentRow[]; seasonOf: Map<number, string>; highlightYear?: number };

// Net worth changes on LD's Net Worth line, as {year, value} marks; every change gets a mark,
// and a label ($280M, $333M, ...) where there's room. A label sits above its point (a dip,
// lower than the year before, goes underneath); one that would crowd the last label shown
// is skipped, its value still in the tooltip. The first and last changes are always labelled.
const LABEL_CHAR_W = 6.4; // approx. width of one 11px character
const LABEL_LINE_H = 13;
const LABEL_GAP = 8; // minimum clear space between neighbouring labels

type ChangeLabel = { year: number; value: number; text: string; x: number; y: number; anchor?: "start" };
type Box = { left: number; right: number; top: number; bottom: number };

function boxOf(label: ChangeLabel): Box {
  const width = label.text.length * LABEL_CHAR_W;
  const left = label.anchor === "start" ? label.x : label.x - width / 2;
  return { left, right: left + width, top: label.y - LABEL_LINE_H, bottom: label.y };
}
const crowds = (a: Box, b: Box) =>
  a.left < b.right + LABEL_GAP && b.left < a.right + LABEL_GAP && a.top < b.bottom && b.top < a.bottom;

function netWorthChanges(points: { year: number; net_worth_mid: number }[]) {
  const changes: ChangeLabel[] = [];
  points.forEach((p, i) => {
    const before = points[i - 1];
    if (before && before.net_worth_mid === p.net_worth_mid) return;
    const text = usdMillions(p.net_worth_mid);
    const px = x(p.year);
    const py = y(p.net_worth_mid);
    const base = { year: p.year, value: p.net_worth_mid, text };
    if (!before) changes.push({ ...base, x: px + 7, y: py + 14, anchor: "start" }); // clear of the y-axis ticks
    else if (p.net_worth_mid < before.net_worth_mid) changes.push({ ...base, x: px, y: py + 18 });
    else changes.push({ ...base, x: px, y: py - 9 });
  });

  const lastChange = changes[changes.length - 1];
  const shown: ChangeLabel[] = [];
  for (const change of changes) {
    const previous = shown[shown.length - 1];
    if (!previous || !crowds(boxOf(previous), boxOf(change))) shown.push(change);
    else if (change === lastChange) shown[shown.length - 1] = change; // keep the final level, drop its neighbour
  }
  return { marks: changes, labels: shown };
}

export default function NetWorthDent({ rows, seasonOf, highlightYear }: Props) {
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
  const { marks, labels } = netWorthChanges(points);

  const onPointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    if (event.pointerType !== "mouse") return; // touch screens don't hover: no tooltip
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
        {/* where each line's points come from, so readers know why they don't line up: net worth
            changes when a new report turns up, the after line has a point per season */}
        <span className="legend-item"><span className="legend-line real" />{NET_WORTH}<span className="legend-note">as reported online</span></span>
        <span className="legend-item"><span className="legend-swatch gap" />{LOSS}</span>
        <span className="legend-item"><span className="legend-line after" />{AFTER}<span className="legend-note">by Curb season</span></span>
      </div>

      {/* on narrow screens the chart keeps a readable width and scrolls sideways, like the timeline */}
      <div className="plot-scroll">
      <div className="plot plot-wide">
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
          {/* axis years; one too close to a highlighted season's year makes way for its label */}
          {X_TICKS.filter((year) => highlightYear === undefined || Math.abs(year - highlightYear) > 1).map((year) => (
            <text key={year} className="tick" x={x(year)} y={HEIGHT - PAD.bottom + 20} textAnchor="middle">{year}</text>
          ))}

          {/* the filtered season's year: an outlined band and its year in yellow on the axis */}
          {highlightYear !== undefined && (
            <>
              <rect className="year-band" x={x(highlightYear) - PLOT_W / (LAST - FIRST) / 2} y={PAD.top}
                    width={PLOT_W / (LAST - FIRST)} height={PLOT_H} />
              <text className="year-band-label" x={x(highlightYear)} y={HEIGHT - PAD.bottom + 20} textAnchor="middle">
                {highlightYear}
              </text>
            </>
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

          {/* LD's Net Worth as we tracked it: a mark at each change, a label where there's room */}
          {marks.map((m) => <circle key={m.year} className="nw-mark" cx={x(m.year)} cy={y(m.value)} r={2.5} />)}
          {labels.map((l) => (
            <text key={l.year} className="nw-label" x={l.x} y={l.y} textAnchor={l.anchor ?? "middle"}>{l.text}</text>
          ))}

          {/* a dot on each year a season aired: where the mishaps come from */}
          {points.filter((p) => seasonOf.has(p.year)).map((p) => (
            <circle key={p.year} className="dot" cx={x(p.year)} cy={y(p.net_worth_after_mishaps_to_date)} r={4} fill="var(--series-1)" />
          ))}

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
            <span className="tooltip-meta">
              {current.year} · {seasonOf.has(current.year) ? `Season ${seasonOf.get(current.year)}` : "no season aired"}
            </span>
            <span className="tooltip-row"><span className="legend-line real" />{NET_WORTH}<strong>{usdFull(current.net_worth_mid)}</strong></span>
            <span className="tooltip-row"><span className="legend-swatch gap" />{LOSS}<strong>{usdFull(current.cumulative_mishap_loss)}</strong></span>
            <span className="tooltip-row"><span className="legend-line after" />{AFTER}<strong>{usdFull(current.net_worth_after_mishaps_to_date)}</strong></span>
          </div>
        )}
      </div>
      </div>
    </figure>
  );
}
