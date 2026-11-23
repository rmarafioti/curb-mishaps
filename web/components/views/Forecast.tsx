"use client";

// Tab 4, Forecast: if the show had kept going, one season a year, Season 13 (2025) and
// Season 14 (2026). A chart puts the forecast at the end of the real seasons, then each
// forecast season's figures, the catastrophe chance, and the method in plain English as
// open/close questions (docs/PROJECT_BRIEF.md section 5 has the details). The navbar's
// "Add a catastrophe?" switch picks the version: everyday mishaps only (No, the default), or
// the same season if a catastrophe hits (Yes); the real seasons follow it. Picks rows only.

import ForecastChart from "@/components/ForecastChart";
import {
  FORECAST_DIM, NO_FILTERS, label, lossesBySeason, mishapList, percentWhole, pick, pickForecast, seasonForecast,
  usdCompact, yearOf,
} from "@/lib/data";
import { useFilters } from "@/lib/filters";

// each real season aired in one year
const SEASON_YEAR = new Map(mishapList.rows.map((m) => [m.episode__season, Number(yearOf(m.metric_time__year))]));

export default function Forecast() {
  const { filters } = useFilters();
  const withCatastrophe = filters[FORECAST_DIM] === "1";
  const seasons = pickForecast(withCatastrophe);
  // the real seasons in the same version: all mishaps, or everyday only (catastrophic = 0)
  const history = withCatastrophe
    ? lossesBySeason.rows
    : pick(lossesBySeason, { ...NO_FILTERS, mishap__is_catastrophic: "0" });
  const chance = percentWhole(seasons[0].forecast_catastrophe_chance);
  // "Expected Cost" (the metric label) as the start of a sentence: "Expected cost, ..."
  const costLabel = label(seasonForecast, "forecast_loss_median");
  const costSub = costLabel.charAt(0) + costLabel.slice(1).toLowerCase();

  return (
    <>
      <header className="masthead">
        <h1>If the show had kept going&hellip;</h1>
        <p className="lede">
          What two more seasons would likely have cost him, one a year after 2024, Season 13 in 2025 and
          Season 14 in 2026. The real show took breaks between seasons. One a year is the what-if.
        </p>
      </header>

      <section className="forecast-seasons" aria-label="Forecast seasons and the chance of a catastrophe">
        {seasons.map((row) => (
          <div className="tile" key={row.season_forecast__season}>
            <span className="kpi-label">
              Season {row.season_forecast__season}, {yearOf(row.metric_time__year)}
            </span>
            <span className="tile-value">{usdCompact(row.forecast_loss_median)}</span>
            <span className="kpi-sub">{costSub}, {withCatastrophe ? "with a catastrophe" : "everyday mishaps"}</span>
            <span className="forecast-range">
              Range {usdCompact(row.forecast_loss_p10)} low to {usdCompact(row.forecast_loss_p90)} high
            </span>
            <span className="forecast-range">
              About {row.forecast_mishaps_median} mishaps ({row.forecast_mishaps_p10} to {row.forecast_mishaps_p90})
              in {row.forecast_episodes} episodes
            </span>
          </div>
        ))}
        <div className="tile">
          <span className="kpi-label">{label(seasonForecast, "forecast_catastrophe_chance")}, each season</span>
          <span className="tile-value">{chance}</span>
          <span className="forecast-range">
            {withCatastrophe
              ? "Both forecast years include one, hypothetically, a house fire or a Latte Larry's."
              : "A house fire or a Latte Larry's. Switch \u201cAdd a catastrophe?\u201d to Yes to see what both forecast years would look like with one."}
          </span>
        </div>
      </section>

      <section className="card">
        <h2>The real seasons, then the forecast</h2>
        <ForecastChart
          history={history}
          forecast={seasons}
          yearOf={SEASON_YEAR}
          withCatastrophe={withCatastrophe}
          historyLabel={label(lossesBySeason, "total_mishap_loss")}
          forecastLabel={costLabel}
        />
      </section>

      <section className="card faq">
        <h2>How we got these numbers</h2>
        {METHOD.map((item) => (
          <details key={item.question} className="disclosure faq-item method-item">
            <summary>{item.question}</summary>
            <div className="faq-answer">{item.answer(chance)}</div>
          </details>
        ))}
      </section>
    </>
  );
}

// The method, as questions that open. Plain English: what each step does and why.
const METHOD: { question: string; answer: (chance: string) => React.ReactNode }[] = [
  {
    question: "Where do the forecast numbers come from?",
    answer: () => (
      <>
        <p>
          Think of every everyday mishap from the 12 real seasons as a card in a hat, each with what it cost. To
          make a pretend season, we first decide how many mishaps it has. The real seasons averaged about 9 in 10
          episodes, so a pretend one gets about 9, sometimes 5, sometimes 13. Then we draw that many cards, and
          each one costs what that real mishap did. Add them up and that&apos;s one pretend season.
        </p>
        <p>
          We do that 200,000 times. The middle result is the expected cost. Half the pretend seasons cost less,
          half cost more. The range is where 8 in 10 of them land, leaving out the luckiest and unluckiest tenth.
        </p>
      </>
    ),
  },
  {
    question: "Did Larry get more or less unlucky over the years?",
    answer: () => (
      <p>
        No. We checked both how often mishaps happen and what they cost (with inflation taken out), season by
        season. Neither moved in a way the data can tell apart from chance. So all 12 seasons go in the same hat,
        and each counts the same.
      </p>
    ),
  },
  {
    question: "Why draw real mishaps instead of fitting a curve?",
    answer: () => (
      <p>
        A smooth curve fitted to the costs made the big ones, like the hospital wing and the restaurant stakes,
        half as common as they were on the show, so a typical pretend season came out far too cheap. Drawing real
        mishaps keeps the big ones exactly as common as they were. The catch is that no pretend mishap can cost
        more than the biggest real one.
      </p>
    ),
  },
  {
    question: "How are catastrophes handled, and why is the divorce left out?",
    answer: (chance) => (
      <p>
        Catastrophes are rare and huge, so they&apos;re a separate switch. Two of the 12 real seasons had one, the
        house fire and Latte Larry&apos;s burning down, so the chance is {chance} a season. Switch &ldquo;Add a
        catastrophe?&rdquo; to Yes and each forecast season gets one of those two. The divorce is left out. It was
        the show&apos;s one divorce, and Larry ends the series unmarried.
      </p>
    ),
  },
  {
    question: "Why does Season 14 cost a little more than Season 13?",
    answer: () => (
      <p>
        Mostly prices. The costs are compared in today&apos;s money so rising prices can&apos;t pass for a trend,
        then each season is shown in the dollars of the year it would air, using the real price index for 2025
        and 2026. Each season is also rolled on its own, like real seasons, so a little luck is in the difference
        too.
      </p>
    ),
  },
  {
    question: "How sure is this?",
    answer: () => (
      <p>
        It&apos;s a ballpark. Twelve seasons is not a lot to go on, which is why the ranges are wide. The last
        three episodes of Season 12 are still being reviewed. Until then they count as having no mishaps, and the
        forecast will shift slightly once they&apos;re in.
      </p>
    ),
  },
];
