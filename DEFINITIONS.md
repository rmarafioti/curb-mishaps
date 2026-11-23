{# Column definitions, alphabetical. Referenced from model YAML as {{ doc("name") }}.
   Model, seed and source descriptions (with grain) stay inline in their own .yml. #}

{% docs amount_stated %}
1 when the amount is stated on screen or in a synopsis (amount_stated_usd is filled), 0 when it is estimated.
{% enddocs %}

{% docs amount_stated_usd %}
Stated amount (Sheet column amount_usd), in dollars of the year the episode aired. Only filled when amount_stated = 1.
{% enddocs %}

{% docs catastrophe_chance %}
Chance (0 to 1) that a forecast season has a catastrophe that could happen again (the house fire or Latte Larry's; the divorce is left out, since it was the show's one divorce): the share of the 12 real seasons that had one.
{% enddocs %}

{% docs confidence %}
Confidence in the estimate: low, medium or high.
{% enddocs %}

{% docs date_day %}
Calendar day. MetricFlow's time spine column (day grain).
{% enddocs %}

{% docs episode_date %}
Air date of the episode (Sheet column air_date). Joins to dim_date.date_day.
{% enddocs %}

{% docs episode_id %}
Episode number across the whole series (1-120), from the Sheet.
{% enddocs %}

{% docs episode_in_season %}
Episode number within its season (the E in S8 E10).
{% enddocs %}

{% docs episode_title %}
Episode title.
{% enddocs %}

{% docs episode_year %}
Year parsed from episode_date. Joins to dim_net_worth.year; each season aired within one calendar year.
{% enddocs %}

{% docs est_high_usd %}
High estimate, in dollars of the year the episode aired (ranges and the forecast). Only filled when amount_stated = 0.
{% enddocs %}

{% docs est_low_usd %}
Low estimate, in dollars of the year the episode aired (ranges and the forecast). Only filled when amount_stated = 0.
{% enddocs %}

{% docs est_mid_usd %}
Mid estimate, in dollars of the year the episode aired. Only filled when amount_stated = 0, and required on every kept estimated mishap.
{% enddocs %}

{% docs estimate_basis %}
How the amount was priced: stated, reference price, or category default, with the reasoning.
{% enddocs %}

{% docs has_forecast_catastrophe %}
Which version of the forecast season: 0 = everyday mishaps only, 1 = the same season if a catastrophe hits (one of the real repeatable ones: the house fire or Latte Larry's). The chance it hits is catastrophe_chance.
{% enddocs %}

{% docs forecast_air_year %}
Year the forecast season would air (one season a year after Season 12 in 2024). Its losses are in this year's dollars.
{% enddocs %}

{% docs forecast_episodes %}
Episodes in the forecast season (10, like every real season).
{% enddocs %}

{% docs forecast_hypothetical_loss_median_usd %}
Median simulated total of the season's everyday hypothetical losses (missed income), in dollars of its air year.
{% enddocs %}

{% docs forecast_loss_median_usd %}
Median simulated total loss for the season version (everyday mishaps only, or plus a catastrophe; see has_forecast_catastrophe), in dollars of its air year. Half the simulated seasons cost less, half more.
{% enddocs %}

{% docs forecast_loss_p10_usd %}
10th percentile of the season's simulated total loss, in dollars of its air year: the low end of the 80% range.
{% enddocs %}

{% docs forecast_loss_p90_usd %}
90th percentile of the season's simulated total loss, in dollars of its air year: the high end of the 80% range.
{% enddocs %}

{% docs forecast_mishaps_median %}
Median simulated number of everyday mishaps in the season.
{% enddocs %}

{% docs forecast_mishaps_p10 %}
10th percentile of the season's simulated everyday mishap count: the low end of the 80% range.
{% enddocs %}

{% docs forecast_mishaps_p90 %}
90th percentile of the season's simulated everyday mishap count: the high end of the 80% range.
{% enddocs %}

{% docs forecast_realized_loss_median_usd %}
Median simulated total of the season's everyday realized losses (money or property actually lost), in dollars of its air year.
{% enddocs %}

{% docs forecast_season %}
Forecast season number (13 or 14).
{% enddocs %}

{% docs has_mishap %}
1 when the Sheet row is a mishap; 0 for the one placeholder row of an episode with no mishap (mishap_num = 0).
{% enddocs %}

{% docs is_catastrophic %}
1 for the catastrophic losses kept out of everyday mishap stats: the 2011 divorce (the only divorce), the house fire and Latte Larry's; 0 otherwise. Set in Sheet column X.
{% enddocs %}

{% docs is_show_airing %}
1 if a season of the show aired that year, else 0 (12 years, fixed now the show has ended). Filters the yearly table to the years the show aired.
{% enddocs %}

{% docs loss_kind %}
'realized' (money or property actually lost) or 'hypothetical' (missed income). Parent of loss_kind_category.
{% enddocs %}

{% docs loss_kind_category %}
Child of loss_kind: purchase, payment, gift, donation, investment, bet, loan_unrepaid, fine_fee, cash_lost, property_damage, property_lost, lost_opportunity.
{% enddocs %}

{% docs mishap_cost %}
Cost of the mishap in dollars of the year the episode aired (not inflation-adjusted): amount_stated_usd when amount_stated = 1, else est_mid_usd. The dashboard default.
{% enddocs %}

{% docs mishap_cost_high %}
High end of the mishap's cost range, in dollars of the year the episode aired: amount_stated_usd when amount_stated = 1 (a stated price has no range), else est_high_usd.
{% enddocs %}

{% docs mishap_cost_low %}
Low end of the mishap's cost range, in dollars of the year the episode aired: amount_stated_usd when amount_stated = 1 (a stated price has no range), else est_low_usd.
{% enddocs %}

{% docs mishap_cost_2026 %}
mishap_cost converted to 2026 dollars with the CPI-U multiplier for the year the episode aired. Only for the cost trend and the forecast.
{% enddocs %}

{% docs mishap_description %}
What happened.
{% enddocs %}

{% docs mishap_key %}
Unique identifier of a mishap: surrogate key on episode_id + mishap_num. Both are assigned once in the Sheet and never renumbered, unlike row_id, which is never a key.
{% enddocs %}

{% docs mishap_num %}
Mishap number within its episode (1, 2, 3...); 0 marks a no-mishap placeholder row. New mishaps take the next unused number; gaps left by deleted rows stay.
{% enddocs %}

{% docs net_worth_adj_mid_musd %}
Mid reported net worth + real 2007 divorce added back, in millions of dollars.
{% enddocs %}

{% docs net_worth_adj_mid_usd %}
Mid reported net worth + real 2007 divorce added back, in dollars.
{% enddocs %}

{% docs net_worth_year %}
Calendar year of the net worth figure.
{% enddocs %}

{% docs review_status %}
Rich's review call: keep, drop, pass or unsure. Only keep rows reach fct_mishap.
{% enddocs %}

{% docs season %}
Season number (1-12).
{% enddocs %}

{% docs season_forecast_key %}
Surrogate key of season + has_forecast_catastrophe: one forecast season, one version.
{% enddocs %}

{% docs sheet_row_id %}
Display order in the Sheet (Sheet row = sheet_row_id + 1). Not stable; never a key.
{% enddocs %}

{% docs to_2026_dollars_multiplier %}
CPI-U 2026 / CPI-U of the year. 2026 CPI is a Jan-Oct average until BLS publishes the annual figure (Jan 13, 2027).
{% enddocs %}
