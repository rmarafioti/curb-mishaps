"""Audit the season forecast: six checks that it's built on the right data and behaves like the show.

Read-only: it reruns scripts/forecast.py's own functions with the same inputs and prints a PASS /
CHECK line per test. Run it after `python scripts/forecast.py`, before a prod build:
    python scripts/audit_forecast.py

1. Inputs reconcile with MetricFlow: 120 episodes, 10 per season; everyday + catastrophic =
   mishap_count; the per-mishap 2026 $ total = total_mishap_loss_2026.
2. Frequency: everyday mishaps per episode, mean vs variance, the trend test, alpha.
3. Severity: the cost trend test (all everyday mishaps and stated prices only).
4. Catastrophe: chance = seasons with a repeatable catastrophe / 12 (the divorce left out).
5. Simulation: the simulated count averages 10 x the fitted rate; simulated everyday season
   totals bracket the 12 real seasons (backtest, 2026 $).
6. CPI: each seed figure = the 2026 $ result / that year's multiplier, to the dollar.
"""

import csv
import warnings

import numpy as np
import statsmodels.formula.api as smf

import forecast as fc

TOLERANCE = 0.01  # 1% for simulated vs. expected


def line(ok, text):
    print(f"{'PASS ' if ok else 'CHECK'}  {text}")
    return ok


def main():
    results = []

    # inputs, exactly as forecast.py reads them
    episodes = fc.mf_query(["routine_mishap_count", "episode_count"], ["episode", "episode__season"])
    episodes = episodes.rename(columns={"episode__season": "season"})
    mishaps = fc.mf_query(
        ["total_mishap_loss_2026"],
        ["mishap", "episode__season", "mishap__loss_kind", "mishap__is_catastrophic", "mishap__description"],
    ).rename(columns={"episode__season": "season", "mishap__loss_kind": "loss_kind"})
    totals = fc.mf_query(["mishap_count", "total_mishap_loss_2026"], ["metric_time__year"]).sum(numeric_only=True)
    routine = mishaps[mishaps.mishap__is_catastrophic == 0].assign(log_cost=lambda d: np.log(d.total_mishap_loss_2026))
    catastrophic = mishaps[mishaps.mishap__is_catastrophic == 1]
    repeatable = catastrophic[~catastrophic.mishap__description.isin(fc.NOT_REPEATABLE)]
    seasons = episodes.season.nunique()

    print("1. Inputs")
    per_season = episodes.groupby("season").episode_count.sum()
    results.append(line(len(episodes) == 120 and (per_season == fc.EPISODES_PER_SEASON).all(),
                        f"{len(episodes)} episodes, {per_season.min()} to {per_season.max()} per season"))
    results.append(line(len(routine) + len(catastrophic) == totals.mishap_count,
                        f"{len(routine)} everyday + {len(catastrophic)} catastrophic = {int(totals.mishap_count)} mishap_count"))
    results.append(line(round(mishaps.total_mishap_loss_2026.sum()) == round(totals.total_mishap_loss_2026),
                        f"per-mishap 2026 $ total {mishaps.total_mishap_loss_2026.sum():,.0f} = metric {totals.total_mishap_loss_2026:,.0f}"))
    results.append(line(episodes.routine_mishap_count.sum() == len(routine),
                        f"routine_mishap_count over episodes = {int(episodes.routine_mishap_count.sum())}"))

    print("2. Frequency (everyday mishaps per episode)")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        freq_model, nb_p = fc.frequency_model(episodes)
    counts = episodes.routine_mishap_count
    rate = len(routine) / len(episodes)
    # a Poisson GLM gives the trend test even when the negative binomial's alpha hits 0
    # (no overdispersion), where its covariance is singular and its p-value comes back nan
    poisson_p = smf.poisson("routine_mishap_count ~ season", episodes).fit(disp=0).pvalues["season"]
    fitted = float(np.exp(freq_model.params["Intercept"]))
    print(f"       mean {counts.mean():.3f}, variance {counts.var():.3f}, alpha {freq_model.params['alpha']:.4f}")
    print(f"       trend p: negative binomial {nb_p:.3f}, Poisson {poisson_p:.3f}")
    results.append(line(poisson_p >= fc.SIGNIFICANCE and (np.isnan(nb_p) or nb_p >= fc.SIGNIFICANCE),
                        "no significant trend: seasons pooled, as the page says"))
    results.append(line(abs(fitted - rate) / rate < TOLERANCE, f"fitted rate {fitted:.4f} = mishaps / episodes {rate:.4f}"))

    print("3. Severity (everyday costs, 2026 $)")
    log_costs, slope, hypothetical_share, sev_p = fc.severity_model(routine)
    stated_p = smf.ols("log_cost ~ season", routine[routine.mishap.isin(stated_mishaps())]).fit().pvalues["season"]
    print(f"       trend p: all {sev_p:.3f}, stated prices only {stated_p:.3f}; hypothetical share {hypothetical_share:.1%}")
    results.append(line(sev_p >= fc.SIGNIFICANCE and stated_p >= fc.SIGNIFICANCE, "no significant cost trend"))
    resampled = np.concatenate(list(log_costs.values()))
    results.append(line(np.allclose(np.sort(resampled), np.sort(routine.log_cost)), "the resampled costs are the real ones"))

    print("4. Catastrophe")
    chance = repeatable.season.nunique() / seasons
    print(f"       repeatable: {', '.join(repeatable.mishap__description)}")
    results.append(line(len(catastrophic) - len(repeatable) == len(fc.NOT_REPEATABLE),
                        f"left out: {', '.join(fc.NOT_REPEATABLE)}"))
    results.append(line(seed_value("catastrophe_chance") == round(chance, 4), f"chance {chance:.1%} = seed"))

    print("5. Simulation")
    rng = np.random.default_rng(fc.SEED)
    sim_counts, realized, hypothetical, _ = fc.simulate_season(
        13, rng, freq_model, log_costs, slope, hypothetical_share, repeatable.total_mishap_loss_2026.to_numpy())
    real_counts = routine.groupby("season").size().reindex(per_season.index, fill_value=0)
    print(f"       count: simulated mean {sim_counts.mean():.2f}, variance {sim_counts.var():.2f}; "
          f"real seasons mean {real_counts.mean():.2f}, variance {real_counts.var():.2f}")
    results.append(line(abs(sim_counts.mean() - 10 * rate) / (10 * rate) < TOLERANCE,
                        f"simulated mean count = 10 x rate ({10 * rate:.2f})"))
    everyday = realized + hypothetical
    p10, p50, p90 = np.percentile(everyday, [10, 50, 90])
    real_totals = routine.groupby("season").total_mishap_loss_2026.sum().reindex(per_season.index, fill_value=0)
    inside = ((real_totals >= p10) & (real_totals <= p90)).sum()
    print(f"       simulated everyday season (2026 $): p10 {p10:,.0f}, median {p50:,.0f}, p90 {p90:,.0f}")
    print(f"       real seasons: median {real_totals.median():,.0f}; {inside} of {seasons} inside p10 to p90 (about 10 expected)")
    results.append(line(7 <= inside <= seasons, "backtest: the real seasons fall where an 80% range should put them"))

    print("6. CPI (2026 $ -> dollars of the air year)")
    cpi = {int(r["year"]): float(r["to_2026_dollars_multiplier"]) for r in csv.DictReader(fc.CPI_SEED.open())}
    seed_median = seed_value("loss_median_usd", season=13, catastrophe=0)
    results.append(line(seed_median == round(p50 / cpi[2025]),
                        f"Season 13 everyday median {p50:,.0f} / {cpi[2025]} = seed {seed_median:,.0f}"))

    print(f"\n{sum(results)} of {len(results)} checks pass")


def stated_mishaps():
    """Mishap keys whose cost is a stated price (amount_stated = 1)."""
    stated = fc.mf_query(["mishap_count"], ["mishap", "mishap__amount_stated"])
    return set(stated[stated.mishap__amount_stated == 1].mishap)


def seed_value(column, season=13, catastrophe=0):
    for row in csv.DictReader(fc.OUT.open()):
        if int(row["season"]) == season and int(row["has_forecast_catastrophe"]) == catastrophe:
            return float(row[column])


if __name__ == "__main__":
    main()
