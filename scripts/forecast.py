"""Forecast two more seasons of mishaps: "if the show had kept going", one season a year.

Season 13 airs in 2025 and Season 14 in 2026; nothing past 2026. Frequency-severity model,
insurance style (docs/PROJECT_BRIEF.md section 5):

- How often: everyday mishaps per episode, negative binomial, 10 episodes a season.
- How costly: each everyday mishap's cost in 2026 dollars (inflation removed), realized and
  hypothetical separately. Each forecast mishap costs what a real one of its kind did,
  picked at random. A fitted curve (lognormal) was tried and dropped: on realized costs it
  made $100K+ mishaps half as common as on the show, so a typical forecast season came out
  about a third of a real one; on the 10 hypothetical costs it invented lost opportunities
  far bigger than any on the show. Resampling keeps big mishaps exactly as common as they
  were; no forecast mishap can cost more than the biggest real one.
- How catastrophic: a fire or Latte Larry's-sized loss is a rare event, kept apart so the
  page can show a season with or without one (has_forecast_catastrophe). Only catastrophes
  that could happen again count: the divorce is the show's one divorce and Larry ends the
  series unmarried, so it is left out (NOT_REPEATABLE). Chance per season = the share of
  real seasons that had a repeatable one; if one hits, it is one of those, picked at random.

Each piece is tested for a trend across seasons. A trend is used only when it is
statistically significant (p < 0.05); otherwise the 12 real seasons are pooled. A Monte
Carlo run gives each forecast season's median and 80% range (10th to 90th percentile),
twice: everyday mishaps only, and the same season if a catastrophe hits. Each season is
rolled on its own (one season's luck doesn't carry into the next). Each is converted from 2026 dollars to the dollars of the year it airs with
the seed's CPI multipliers. Writes seeds/season_forecast.csv; nothing on the page is
computed, the seed goes through dbt and MetricFlow like every other number.

Inputs come from MetricFlow (`mf query`), against whatever target dbt last parsed (dev by
default). Run after dev is built and matches the Sheet:
    python scripts/forecast.py && dbt build -s season_forecast+
"""

import csv
import subprocess
import sys
import tempfile
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf

ROOT = Path(__file__).resolve().parent.parent
CPI_SEED = ROOT / "seeds" / "ld_net_worth_cpi.csv"
OUT = ROOT / "seeds" / "season_forecast.csv"

FORECAST = {13: 2025, 14: 2026}  # season -> air year (one a year after Season 12, 2024)
EPISODES_PER_SEASON = 10  # every real season had 10
SIMULATIONS = 200_000
SEED = 20261123  # fixed, so a rerun on the same data gives the same numbers
SIGNIFICANCE = 0.05
# catastrophes that can't happen again, by their Sheet description (must match exactly one)
NOT_REPEATABLE = {"Divorce settlement with Cheryl"}


def mf_query(metrics, group_by):
    """One MetricFlow query, returned as a DataFrame."""
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "out.csv"
        args = ["mf", "query", "--metrics", ",".join(metrics), "--group-by", ",".join(group_by), "--csv", str(path)]
        result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
        if result.returncode != 0:
            sys.exit(f"`{' '.join(args)}` failed:\n{result.stdout}\n{result.stderr}")
        return pd.read_csv(path)


def frequency_model(episodes):
    """Everyday mishaps per episode: negative binomial, with a season trend if significant."""
    trend = smf.negativebinomial("routine_mishap_count ~ season", episodes).fit(disp=0)
    p_value = trend.pvalues["season"]
    model = trend if p_value < SIGNIFICANCE else smf.negativebinomial("routine_mishap_count ~ 1", episodes).fit(disp=0)
    return model, p_value


def severity_model(mishaps):
    """The real log costs (2026 $) of everyday mishaps by kind, to resample, with a season
    trend if significant."""
    trend = smf.ols("log_cost ~ season", mishaps).fit()
    p_value = trend.pvalues["season"]
    slope = trend.params["season"] if p_value < SIGNIFICANCE else 0.0
    # with a trend, each mishap's cost is moved to a common season before fitting each kind
    mishaps = mishaps.assign(log_cost_now=mishaps.log_cost - slope * mishaps.season)
    log_costs = {kind: group.log_cost_now.to_numpy() for kind, group in mishaps.groupby("loss_kind")}
    hypothetical_share = len(log_costs["hypothetical"]) / len(mishaps)
    return log_costs, slope, hypothetical_share, p_value


def simulate_season(season, rng, freq_model, log_costs, slope, hypothetical_share, catastrophes):
    """SIMULATIONS draws of one season in 2026 dollars: its mishap count, its everyday
    realized and hypothetical losses, and the catastrophe it would have if one hit."""
    # how often: parameter uncertainty from the fit, then the negative binomial draw
    params = rng.multivariate_normal(freq_model.params.drop("alpha"), freq_model.cov_params().drop(index="alpha", columns="alpha"), SIMULATIONS)
    log_rate = params[:, 0] + (params[:, 1] * season if params.shape[1] > 1 else 0)
    alpha = max(freq_model.params["alpha"], 1e-8)  # near 0 = Poisson (no overdispersion)
    mean = np.exp(log_rate) * EPISODES_PER_SEASON
    counts = rng.poisson(rng.gamma(EPISODES_PER_SEASON / alpha, mean * alpha / EPISODES_PER_SEASON))

    # how costly: each mishap's kind, then the cost of a real mishap of that kind
    total_mishaps = counts.sum()
    owner = np.repeat(np.arange(SIMULATIONS), counts)  # which simulated season each mishap is in
    is_hypothetical = rng.random(total_mishaps) < hypothetical_share
    costs = np.empty(total_mishaps)
    for kind, chosen in (("realized", ~is_hypothetical), ("hypothetical", is_hypothetical)):
        costs[chosen] = np.exp(rng.choice(log_costs[kind], chosen.sum()) + slope * season)
    realized = np.bincount(owner[~is_hypothetical], costs[~is_hypothetical], SIMULATIONS)
    hypothetical = np.bincount(owner[is_hypothetical], costs[is_hypothetical], SIMULATIONS)

    # if a catastrophe hits: which of the real, repeatable ones
    catastrophe = rng.choice(catastrophes, SIMULATIONS)
    return counts, realized, hypothetical, catastrophe


def main():
    # inputs, all from MetricFlow
    episodes = mf_query(["routine_mishap_count", "episode_count"], ["episode", "episode__season"])
    episodes = episodes.rename(columns={"episode__season": "season"})
    mishaps = mf_query(
        ["total_mishap_loss_2026"],
        ["mishap", "episode__season", "mishap__loss_kind", "mishap__is_catastrophic", "mishap__description"],
    ).rename(columns={"episode__season": "season", "mishap__loss_kind": "loss_kind"})
    seasons = int(episodes.season.nunique())
    routine = mishaps[mishaps.mishap__is_catastrophic == 0].assign(log_cost=lambda d: np.log(d.total_mishap_loss_2026))
    catastrophic = mishaps[mishaps.mishap__is_catastrophic == 1]
    excluded = catastrophic.mishap__description.isin(NOT_REPEATABLE)
    if excluded.sum() != len(NOT_REPEATABLE):
        sys.exit(f"NOT_REPEATABLE {NOT_REPEATABLE} matched {excluded.sum()} catastrophic mishaps; check the descriptions.")
    repeatable = catastrophic[~excluded]
    cpi = {int(row["year"]): float(row["to_2026_dollars_multiplier"]) for row in csv.DictReader(CPI_SEED.open())}

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")  # statsmodels convergence chatter on the near-Poisson fit
        freq_model, freq_p = frequency_model(episodes)
    log_costs, slope, hypothetical_share, sev_p = severity_model(routine)
    catastrophe_chance = repeatable.season.nunique() / seasons

    print(f"{len(episodes)} episodes, {len(routine)} everyday mishaps, {len(catastrophic)} catastrophic, {seasons} seasons")
    print(f"frequency trend p = {freq_p:.2f} ({'used' if freq_p < SIGNIFICANCE else 'not significant, seasons pooled'})")
    print(f"severity trend p = {sev_p:.2f} ({'used' if sev_p < SIGNIFICANCE else 'not significant, seasons pooled'})")
    if min(freq_p, sev_p) < SIGNIFICANCE:
        print("NOTE: a trend is now in use; check the Forecast tab's copy, which says there is none.")
    print(f"catastrophe chance per season = {catastrophe_chance:.0%} ({repeatable.season.nunique()} of {seasons} seasons; left out: {', '.join(NOT_REPEATABLE)})")

    rng = np.random.default_rng(SEED)
    rows = []
    for season, year in FORECAST.items():
        counts, realized, hypothetical, catastrophe = simulate_season(
            season, rng, freq_model, log_costs, slope, hypothetical_share,
            repeatable.total_mishap_loss_2026.to_numpy(),
        )
        to_own_year = 1 / cpi[year]  # 2026 dollars -> the dollars of the year it airs
        everyday = realized + hypothetical
        for has_catastrophe, total in ((0, everyday), (1, everyday + catastrophe)):
            p10, median, p90 = np.percentile(total, [10, 50, 90]) * to_own_year
            rows.append({
                "season": season,
                "air_year": year,
                "has_forecast_catastrophe": has_catastrophe,
                "episodes": EPISODES_PER_SEASON,
                "mishaps_p10": round(np.percentile(counts, 10)),
                "mishaps_median": round(np.median(counts)),
                "mishaps_p90": round(np.percentile(counts, 90)),
                "loss_p10_usd": round(p10),
                "loss_median_usd": round(median),
                "loss_p90_usd": round(p90),
                "catastrophe_chance": round(catastrophe_chance, 4),
            })

    with OUT.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {OUT.relative_to(ROOT)}")
    for row in rows:
        print(row)


if __name__ == "__main__":
    main()
