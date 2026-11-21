"use client";

// Every mishap in the order it aired, one evenly spaced point each, joined by a line so the
// ups and downs read as a timeline (cost on a log scale, $10 to $1B). Season dividers mark
// where each season starts. Hover or tab to a point to see what happened, the episode and
// how it was priced. Positions only; every value comes from mishap_list.json.

import { useState } from "react";
import { type Mishap, dateOf, episodeCode, titleCase, usdFull, yearOf } from "@/lib/data";

const MIN_WIDTH = 960;
const STEP = 16; // px between points at full width; the chart scrolls sideways past MIN_WIDTH
const HEIGHT = 400;
const PAD = { top: 40, right: 32, bottom: 24, left: 64 };
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

const Y_MIN = 1; // log10($10)
const Y_MAX = 9; // log10($1B)
const Y_TICKS = [10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];
const TICK_LABELS = ["$10", "$100", "$1K", "$10K", "$100K", "$1M", "$10M", "$100M", "$1B"];
const y = (cost: number) =>
  PAD.top + (1 - (Math.log10(Math.max(cost, 10)) - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;

const KINDS = [
  { key: "realized", label: "Realized (money or property lost)", color: "var(--series-1)" },
  { key: "hypothetical", label: "Hypothetical (missed income)", color: "var(--series-2)" },
];
const colorOf = (kind: string) => KINDS.find((k) => k.key === kind)?.color ?? "var(--ink-muted)";

export default function MishapTimeline({ mishaps }: { mishaps: Mishap[] }) {
  const [active, setActive] = useState<number | null>(null);

  const n = mishaps.length;
  const width = Math.max(MIN_WIDTH, PAD.left + PAD.right + (n - 1) * STEP);
  const plotW = width - PAD.left - PAD.right;
  const x = (i: number) => (n === 1 ? PAD.left + plotW / 2 : PAD.left + (i / (n - 1)) * plotW);

  // first point of each season: a divider and a "S1 · 2000" label
  const seasonStarts = mishaps
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => i === 0 || m.episode__season !== mishaps[i - 1].episode__season);

  // the two biggest get a direct label; the rest are in the tooltip and the table
  const labeled = mishaps
    .map((m, i) => ({ m, i }))
    .sort((a, b) => b.m.total_mishap_loss - a.m.total_mishap_loss)
    .slice(0, 2);

  const path = mishaps.map((m, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(m.total_mishap_loss)}`).join(" ");

  const current = active !== null ? mishaps[active] : null;
  const across = active !== null ? x(active) / width : 0;
  const down = current ? y(current.total_mishap_loss) / HEIGHT : 0;
  // the tooltip opens beside the dot: to the right, or to the left near the right edge; it
  // shifts up or down near the top and bottom so the scroll container doesn't clip it
  const side = across > 0.6 ? "calc(-100% - 16px)" : "16px";
  const lift = down < 0.35 ? "-12%" : down > 0.65 ? "-88%" : "-50%";

  if (n === 0) return <p className="card-sub">No mishaps match these filters.</p>;

  return (
    <figure className="chart">
      <div className="legend" aria-hidden="true">
        {KINDS.map((kind) => (
          <span key={kind.key} className="legend-item">
            <span className="legend-dot" style={{ background: kind.color }} />
            {kind.label}
          </span>
        ))}
      </div>

      <div className="plot-scroll">
        <div className="plot" style={{ minWidth: width > MIN_WIDTH ? width : undefined }}>
          <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label="Every mishap in the order it aired, by cost">
            {Y_TICKS.map((tick, i) => (
              <g key={tick}>
                <line className="grid" x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} />
                <text className="tick" x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                  {TICK_LABELS[i]}
                </text>
              </g>
            ))}

            {seasonStarts.map(({ m, i }, s) => {
              // a season's cell runs from its divider to the next season's (or the chart's end)
              const dividerAt = (index: number) => (index === 0 ? PAD.left : (x(index - 1) + x(index)) / 2);
              const left = dividerAt(i);
              const right = s + 1 < seasonStarts.length ? dividerAt(seasonStarts[s + 1].i) : width - PAD.right;
              return (
                <g key={`season-${m.episode__season}`}>
                  {i > 0 && <line className="axis" x1={left} x2={left} y1={PAD.top - 8} y2={HEIGHT - PAD.bottom} />}
                  <text className="tick" x={(left + right) / 2} y={PAD.top - 14} textAnchor="middle">
                    S{m.episode__season} · {yearOf(m.metric_time__year)}
                  </text>
                </g>
              );
            })}

            <path className="timeline-line" d={path} />

            {mishaps.map((m, i) => (
              <circle
                key={m.mishap}
                className="dot"
                cx={x(i)}
                cy={y(m.total_mishap_loss)}
                r={active === i ? 7 : 4.5}
                fill={colorOf(m.mishap__loss_kind)}
              />
            ))}

            {labeled.map(({ m, i }) => {
              // near the right edge the title goes on the dot's left so it stays in the chart
              const leftSide = x(i) > width * 0.75;
              return (
                <text
                  key={`label-${m.mishap}`}
                  className="direct-label"
                  x={leftSide ? x(i) - 10 : x(i) + 10}
                  y={y(m.total_mishap_loss) + 4}
                  textAnchor={leftSide ? "end" : "start"}
                >
                  {m.episode__episode_title}
                </text>
              );
            })}

            {/* hit targets: a bit bigger than each dot (easier to land on), focusable for
                keyboard users; the details show only while one is hovered or focused */}
            {mishaps.map((m, i) => (
              <circle
                key={`hit-${m.mishap}`}
                className="hit"
                cx={x(i)}
                cy={y(m.total_mishap_loss)}
                r={STEP / 2}
                tabIndex={0}
                aria-label={`${m.mishap__description}, ${usdFull(m.total_mishap_loss)}, ${episodeCode(m)} ${m.episode__episode_title}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            ))}
          </svg>

          {current && active !== null && (
            <div
              className="tooltip"
              style={{
                left: `${across * 100}%`,
                top: `${down * 100}%`,
                transform: `translate(${side}, ${lift})`,
              }}
            >
              <strong className="tooltip-value">{usdFull(current.total_mishap_loss)}</strong>
              <span className="tooltip-title">{current.mishap__description}</span>
              <span className="tooltip-meta">
                {episodeCode(current)} · “{current.episode__episode_title}” · {dateOf(current.metric_time__day)}
              </span>
              <span className="tooltip-meta">
                {titleCase(current.mishap__loss_kind)} · {titleCase(current.mishap__loss_kind_category)}
                {current.mishap__is_catastrophic === "1" ? " · Catastrophic" : ""}
              </span>
              {current.mishap__estimate_basis && (
                <span className="tooltip-basis">How we priced it: {current.mishap__estimate_basis}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <figcaption className="note">
        Mishaps in the order they aired, evenly spaced. Cost is on a log scale (each gridline is
        10× the one below) so a $20 parking ticket and the $250M divorce fit on one chart.
      </figcaption>
    </figure>
  );
}
