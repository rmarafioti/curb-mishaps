"use client";

// The forecast at the end of the real history, one point per season. Seasons 1-12: what each
// real season cost (solid sky blue). Seasons 13-14: the forecast's expected cost (dashed
// amber, carrying on from Season 12) inside a box from that year's low to its high end,
// both ends labelled. Log scale ($1K to $1B): a $2K
// season and the $250M divorce season fit on one chart. Hover a season for its figures.
// Positions only; every value comes from the exports (losses_by_season, season_forecast).

import { useRef, useState } from "react";
import { type ForecastRow, type SeasonRow, usdCompact, usdFull } from "@/lib/data";

const WIDTH = 960;
const HEIGHT = 360;
const PAD = { top: 28, right: 64, bottom: 40, left: 64 }; // right: room for the last season's label
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
const FIRST = 1;
const LAST = 14;
const REAL_LAST = 12;

const Y_MIN = 3; // log10($1K)
const Y_MAX = 9; // log10($1B)
const Y_TICKS = [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];
const TICK_LABELS = ["$1K", "$10K", "$100K", "$1M", "$10M", "$100M", "$1B"];

// half a step of room at each end, so the first dot clears the axis and the band fits
const x = (season: number) => PAD.left + ((season - FIRST + 0.5) / (LAST - FIRST + 1)) * PLOT_W;
const STEP_W = PLOT_W / (LAST - FIRST + 1);
const y = (usd: number) =>
  PAD.top + (1 - (Math.log10(Math.max(usd, 10 ** Y_MIN)) - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;

type Props = {
  history: SeasonRow[];        // the real seasons (everyday only, or all mishaps)
  forecast: ForecastRow[];     // the forecast seasons, in the matching version
  yearOf: Map<string, number>; // season -> the year it aired
  withCatastrophe: boolean;
  historyLabel: string;        // metric labels, from the YAML via the export
  forecastLabel: string;
};

export default function ForecastChart({ history, forecast, yearOf, withCatastrophe, historyLabel, forecastLabel }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // "Total Mishap Loss" without "Total": true with or without catastrophes ("mishap loss")
  const lossLabel = historyLabel.replace(/^Total\s+/i, "").toLowerCase();

  const real = history
    .map((r) => ({ season: Number(r.episode__season), cost: r.total_mishap_loss }))
    .sort((a, b) => a.season - b.season);
  const ahead = forecast.map((r) => ({
    season: Number(r.season_forecast__season),
    year: Number(r.metric_time__year.slice(0, 4)),
    median: r.forecast_loss_median,
    low: r.forecast_loss_p10,
    high: r.forecast_loss_p90,
  }));

  const path = (points: { season: number; value: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.season)},${y(p.value)}`).join(" ");
  const realLine = path(real.map((p) => ({ season: p.season, value: p.cost })));
  // the forecast picks up where the real seasons end: dashed from the last real season on
  const lastReal = real[real.length - 1];
  const forecastLine = path([
    ...(lastReal ? [{ season: lastReal.season, value: lastReal.cost }] : []),
    ...ahead.map((p) => ({ season: p.season, value: p.median })),
  ]);
  // each forecast year's range: a box from its low end to its high end, around its season
  const boxHalf = STEP_W / 3;

  const onPointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    if (event.pointerType !== "mouse") return; // touch screens don't hover: no tooltip
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const svgX = ((event.clientX - box.left) / box.width) * WIDTH;
    const season = Math.round(FIRST - 0.5 + ((svgX - PAD.left) / PLOT_W) * (LAST - FIRST + 1));
    setActive(Math.min(LAST, Math.max(FIRST, season)));
  };
  // every real season's cost is labelled (the log axis jumps tenfold per gridline): above a
  // peak, below a dip, so the label sits clear of the line; a dip too near the axis goes above
  const realLabels = real.map((p, i) => {
    const before = real[i - 1]?.cost ?? ahead[0]?.median;
    const after = real[i + 1]?.cost ?? ahead[0]?.median;
    const dip = (before === undefined || p.cost < before) && (after === undefined || p.cost < after);
    const below = dip && y(p.cost) + 18 < HEIGHT - PAD.bottom - 4;
    return { ...p, labelY: below ? y(p.cost) + 18 : y(p.cost) - 10 };
  });
  const realPoint = real.find((p) => p.season === active);
  const aheadPoint = ahead.find((p) => p.season === active);
  const share = active !== null ? x(active) / WIDTH : 0;
  const dividerX = (x(REAL_LAST) + x(REAL_LAST + 1)) / 2;

  return (
    <figure className="chart">
      <div className="legend" aria-hidden="true">
        <span className="legend-item"><span className="legend-line after" />Real Seasons, {lossLabel}</span>
        <span className="legend-item"><span className="legend-line forecast" />Future Flops, {forecastLabel.toLowerCase()}</span>
        <span className="legend-item"><span className="legend-swatch forecast-band" />Range, low to high</span>
      </div>

      <div className="plot-scroll">
        <div className="plot plot-wide">
          <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img"
               aria-label={`What each real season cost, and the forecast for Seasons 13 and 14${withCatastrophe ? " with a catastrophe" : ""}`}>
            {Y_TICKS.map((tick, i) => (
              <g key={tick}>
                <line className={i === 0 ? "axis" : "grid"} x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} />
                <text className="tick" x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">{TICK_LABELS[i]}</text>
              </g>
            ))}

            {/* the forecast side: a faint panel and a divider, labelled above the plot */}
            <rect className="forecast-zone" x={dividerX} y={PAD.top} width={WIDTH - PAD.right - dividerX} height={PLOT_H} />
            <line className="forecast-divider" x1={dividerX} x2={dividerX} y1={PAD.top} y2={HEIGHT - PAD.bottom} />

            {Array.from({ length: LAST }, (_, i) => i + 1).map((season) => (
              <text key={season} className="tick" x={x(season)} y={HEIGHT - PAD.bottom + 20} textAnchor="middle">S{season}</text>
            ))}

            {ahead.map((p) => (
              <g key={p.season}>
                <rect className="forecast-band" x={x(p.season) - boxHalf} y={y(p.high)}
                      width={boxHalf * 2} height={y(p.low) - y(p.high)} rx={4} />
                {/* both ends labelled: the high above the box, the low below it */}
                <text className="range-label" x={x(p.season)} y={y(p.high) - 8} textAnchor="middle">{usdCompact(p.high)}</text>
                <text className="range-label" x={x(p.season)} y={y(p.low) + 16} textAnchor="middle">{usdCompact(p.low)}</text>
              </g>
            ))}
            <path className="forecast-real" d={realLine} />
            <path className="forecast-line" d={forecastLine} />

            {real.map((p) => (
              <circle key={p.season} className="dot" cx={x(p.season)} cy={y(p.cost)} r={active === p.season ? 6 : 4} fill="var(--series-1)" />
            ))}
            {realLabels.map((p) => (
              <text key={p.season} className="range-label" x={x(p.season)} y={p.labelY} textAnchor="middle">{usdCompact(p.cost)}</text>
            ))}
            {ahead.map((p) => (
              <g key={p.season}>
                <circle className="dot" cx={x(p.season)} cy={y(p.median)} r={active === p.season ? 7 : 5} fill="var(--series-2)" />
                {/* the forecast is the point of the chart: its expected cost is labelled beside its
                    dot (the first season's to the left, the last's to the right), never above it,
                    where it would meet the high-end label when the two are close */}
                <text className="forecast-value" x={x(p.season) + (p.season === LAST ? 10 : -10)} y={y(p.median)}
                      textAnchor={p.season === LAST ? "start" : "end"} dominantBaseline="middle">
                  {usdCompact(p.median)}
                </text>
              </g>
            ))}

            {active !== null && (
              <line className="crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
            )}
            <rect className="hit" x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H}
                  onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)} />
          </svg>

          {active !== null && (realPoint || aheadPoint) && (
            <div className="tooltip" style={{
              left: `${share * 100}%`,
              top: `${(PAD.top / HEIGHT) * 100}%`,
              transform: `translate(${share > 0.6 ? "calc(-100% - 12px)" : "12px"}, 0)`,
            }}>
              {/* laid out like the mishap timeline's tooltip: the amount, what it is, then the range */}
              {realPoint && (
                <>
                  <strong className="tooltip-value">{usdFull(realPoint.cost)}</strong>
                  <span className="tooltip-title">Season {realPoint.season} · {yearOf.get(String(realPoint.season))}</span>
                  <span className="tooltip-meta">{withCatastrophe ? historyLabel : `${lossLabel}, everyday mishaps`}</span>
                </>
              )}
              {aheadPoint && (
                <>
                  <strong className="tooltip-value">{usdFull(aheadPoint.median)}</strong>
                  <span className="tooltip-title">Season {aheadPoint.season} · {aheadPoint.year} · forecast</span>
                  <span className="tooltip-meta">{forecastLabel}{withCatastrophe ? ", with a catastrophe" : ", everyday mishaps"}</span>
                  <span className="tooltip-range">
                    Range {usdCompact(aheadPoint.low)} –{" "}
                    <mark className="tooltip-mid">{usdCompact(aheadPoint.median)}</mark> –{" "}
                    {usdCompact(aheadPoint.high)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}
