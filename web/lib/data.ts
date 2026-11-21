// The exported MetricFlow results (web/data/*.json, written by scripts/export_metrics.py)
// and display helpers. Nothing here computes a metric: every number comes from the JSON;
// this file only types, sorts, picks rows and formats.

import kpisJson from "@/data/kpis.json";
import mishapJson from "@/data/mishap_list.json";
import dentJson from "@/data/net_worth_dent.json";
import seasonJson from "@/data/losses_by_season.json";
import yearJson from "@/data/losses_by_year.json";

export type MetricInfo = { name: string; label: string; description: string };

// --- filters ---------------------------------------------------------------------------

/** The dashboard's filters; same names and order as FILTER_DIMENSIONS in the export script. */
export const FILTER_DIMS = ["episode__season", "mishap__loss_kind"] as const;
export type FilterDim = (typeof FILTER_DIMS)[number];
export type Filters = Record<FilterDim, string>; // "" = all
export const NO_FILTERS: Filters = { episode__season: "", mishap__loss_kind: "" };
type Dims = Partial<Record<FilterDim, string>>;

type Export<Row> = {
  name: string;
  label: string;
  description: string;
  metrics: MetricInfo[];
  rows: (Row & Dims)[];
  filterable_metrics: string[]; // metrics MetricFlow can slice by the filters
  slices: Record<string, (Row & Dims)[]>; // "dimA+dimB" -> rows grouped by those too
  exported_at: string;
  source: string;
};

/**
 * The rows for the active filters: the pre-computed slice for the filter dimensions the
 * export didn't already group by, then only the rows whose values match. Picks rows only.
 */
export function pick<Row>(data: Export<Row>, filters: Filters): (Row & Dims)[] {
  const active = FILTER_DIMS.filter((dim) => filters[dim]);
  const base = data.rows[0] ?? {};
  const sliceKey = active.filter((dim) => !(dim in base)).join("+");
  const rows = sliceKey ? (data.slices[sliceKey] ?? []) : data.rows;
  return rows.filter((row) => active.every((dim) => !(dim in row) || row[dim] === filters[dim]));
}

export const isFiltered = (filters: Filters) => FILTER_DIMS.some((dim) => filters[dim]);

/** The mishaps (one row each) matching the filters, in air order. Picks rows only. */
export const pickMishaps = (filters: Filters) =>
  mishapList.rows
    .filter((m) => FILTER_DIMS.every((dim) => !filters[dim] || m[dim] === filters[dim]))
    .sort((a, b) => a.metric_time__day.localeCompare(b.metric_time__day));

export type Mishap = {
  metric_time__day: string;
  metric_time__year: string;
  mishap: string;
  mishap__description: string;
  mishap__loss_kind: string;
  mishap__loss_kind_category: string;
  mishap__is_catastrophic: string;
  mishap__estimate_basis: string;
  episode__season: string;
  episode__episode_in_season: string;
  episode__episode_title: string;
  total_mishap_loss: number;
};

export type DentRow = {
  metric_time__year: string;
  net_worth_mid: number;
  cumulative_mishap_loss: number;
  net_worth_after_mishaps_to_date: number;
};

export type KpiRow = {
  total_mishap_loss: number;
  total_mishap_loss_low: number;
  total_mishap_loss_high: number;
  mishap_count: number;
  median_mishap_cost: number;
};

export type SeasonRow = {
  episode__season: string;
  total_mishap_loss: number;
  mishap_count: number;
  episode_count: number;
  mishaps_per_episode: number;
};

export type YearRow = {
  metric_time__year: string;
  total_mishap_loss: number;
  net_worth_mid: number;
  pct_mishap_to_net_worth: number;
};

export const kpis = kpisJson as unknown as Export<KpiRow>;
export const mishapList = mishapJson as unknown as Export<Mishap>;
export const netWorthDent = dentJson as unknown as Export<DentRow>;
export const lossesBySeason = seasonJson as unknown as Export<SeasonRow>;
export const lossesByYear = yearJson as unknown as Export<YearRow>;

// --- row picking and sorting (presentation only) --------------------------------------

export const yearOf = (timestamp: string) => timestamp.slice(0, 4);
export const dateOf = (timestamp: string) => timestamp.slice(0, 10);

export const byNumber = <T,>(key: (row: T) => number, descending = false) =>
  (a: T, b: T) => (descending ? key(b) - key(a) : key(a) - key(b));

export const label = (data: { metrics: MetricInfo[] }, name: string) =>
  data.metrics.find((metric) => metric.name === name)?.label ?? name;

// --- formatting -------------------------------------------------------------------------

/** $262.0M, $1.8M, $25.1K, $600 */
export function usdCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e4) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** $262,024,688 */
export const usdFull = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

/** $333M (whole millions, for chart labels) */
export const usdMillions = (value: number) => `$${Math.round(value / 1e6).toLocaleString("en-US")}M`;

/** a share (0.42085) as a percent: 42.1% */
export const percent = (share: number) => `${(share * 100).toFixed(1)}%`;

/** S8 E1 */
export const episodeCode = (row: Mishap) =>
  `S${row.episode__season} E${row.episode__episode_in_season}`;

/** property_damage -> Property damage */
export const titleCase = (snake: string) =>
  snake.charAt(0).toUpperCase() + snake.slice(1).replaceAll("_", " ");
