// The exported MetricFlow results (web/data/*.json, written by scripts/export_metrics.py)
// and display helpers. Nothing here computes a metric: every number comes from the JSON;
// this file only types, sorts, picks rows and formats.

import kpisJson from "@/data/kpis.json";
import mishapJson from "@/data/mishap_list.json";
import dentJson from "@/data/net_worth_dent.json";
import seasonJson from "@/data/losses_by_season.json";
import yearJson from "@/data/losses_by_year.json";
import forecastJson from "@/data/season_forecast.json";

export type MetricInfo = { name: string; label: string; description: string };

// --- filters ---------------------------------------------------------------------------

/** The dashboard's filters; same names and order as FILTER_DIMENSIONS in the export script. */
export const FILTER_DIMS = ["episode__season", "mishap__loss_kind", "mishap__is_catastrophic"] as const;
export type FilterDim = (typeof FILTER_DIMS)[number];
/** The Forecast tab's switch: "" = everyday mishaps only, "1" = add a catastrophe. It picks
 *  between the forecast's two rows per season, so it isn't in FILTER_DIMS (no slices). */
export const FORECAST_DIM = "season_forecast__has_forecast_catastrophe";
export type PageFilterDim = FilterDim | typeof FORECAST_DIM;
export type Filters = Record<PageFilterDim, string>; // "" = all (or, for the forecast, everyday only)
export const NO_FILTERS: Filters = {
  episode__season: "", mishap__loss_kind: "", mishap__is_catastrophic: "", [FORECAST_DIM]: "",
};
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

export const isFiltered = (filters: Filters) => FILTER_DIMS.some((dim) => filters[dim]) || filters[FORECAST_DIM] !== "";

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
  total_mishap_loss_low: number;
  total_mishap_loss_high: number;
};

// Each pricing note opens with how it was priced ("assumption:", "reference:", "category
// default:", "stated"); that lead word becomes the pricing method and the rest stays as the
// note. Older notes that open with "catastrophic." get no method (the flag comes from
// is_catastrophic). Text splitting only.
const BASIS_KINDS = ["catastrophic", "assumption", "reference", "category default", "stated"];

export function splitBasis(basis: string): { kind?: string; note: string } {
  const kind = BASIS_KINDS.find((k) => basis.toLowerCase().startsWith(k));
  if (!kind) return { note: basis };
  const note = basis.slice(kind.length).replace(/^[.:]\s*/, "");
  return { kind: kind === "catastrophic" ? undefined : kind, note: note.charAt(0).toUpperCase() + note.slice(1) };
}

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

/** One forecast season, one version (everyday only, or with a catastrophe). */
export type ForecastRow = {
  metric_time__year: string;
  season_forecast__season: string;
  season_forecast__has_forecast_catastrophe: string;
  forecast_loss_median: number;
  forecast_loss_p10: number;
  forecast_loss_p90: number;
  forecast_mishaps_median: number;
  forecast_mishaps_p10: number;
  forecast_mishaps_p90: number;
  forecast_realized_loss_median: number;
  forecast_hypothetical_loss_median: number;
  forecast_catastrophe_chance: number;
  forecast_episodes: number;
};

export const kpis = kpisJson as unknown as Export<KpiRow>;
export const mishapList = mishapJson as unknown as Export<Mishap>;
export const netWorthDent = dentJson as unknown as Export<DentRow>;
export const lossesBySeason = seasonJson as unknown as Export<SeasonRow>;
export const lossesByYear = yearJson as unknown as Export<YearRow>;
export const seasonForecast = forecastJson as unknown as Export<ForecastRow>;

/** The forecast seasons for one version, in season order. Picks rows only. */
export const pickForecast = (withCatastrophe: boolean) =>
  seasonForecast.rows
    .filter((row) => row.season_forecast__has_forecast_catastrophe === (withCatastrophe ? "1" : "0"))
    .sort(byNumber((row) => Number(row.season_forecast__season)));

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

/** a share (0.1667) as a whole percent: 17% */
export const percentWhole = (share: number) => `${Math.round(share * 100)}%`;

/** S8 E1 */
export const episodeCode = (row: Mishap) =>
  `S${row.episode__season} E${row.episode__episode_in_season}`;

/** property_damage -> Property damage */
export const titleCase = (snake: string) =>
  snake.charAt(0).toUpperCase() + snake.slice(1).replaceAll("_", " ");
