"use client";

// Tab 4, Forecast: if the show had kept going, one season a year, Season 13 (2025) and
// Season 14 (2026). A chart puts the forecast at the end of the real seasons, then each
// forecast season's figures, the mishap count, the catastrophe chance, and the method in plain English as
// open/close questions (docs/PROJECT_BRIEF.md section 5 has the details). The navbar's
// "Add A Catastrophe?" switch picks the version: everyday mishaps only (No, the default), or
// the same season if a catastrophe hits (Yes); the real seasons follow it. Picks rows only.

import ForecastChart from "@/components/ForecastChart";
import {
  FORECAST_DIM, NO_FILTERS, label, lossesBySeason, mishapList, percentWhole, pick, pickForecast, seasonForecast,
  usdCompact, yearOf,
} from "@/lib/data";
import { useFilters } from "@/lib/filters";
import { CatastropheChance, SEASON_14_COSTS_MORE, UNLUCKY } from "@/lib/shared-answers";

// each real season aired in one year
const SEASON_YEAR = new Map(mishapList.rows.map((m) => [m.episode__season, Number(yearOf(m.metric_time__year))]));

// "Expected Cost" (a metric label, Title Case) as a sub line: "Expected cost"
const sentenceCase = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();

// the method answer the "Why are the ranges so broad?" link opens and scrolls to
const WHY_RANGES = "why-ranges";
function openAnswer(id: string) {
  const answer = document.getElementById(id);
  if (!(answer instanceof HTMLDetailsElement)) return;
  answer.open = true;
  answer.scrollIntoView({ behavior: "smooth", block: "start" });
}

// the two catastrophes a forecast season can draw (the divorce is left out), with what each cost
const catastrophe = (name: RegExp) =>
  mishapList.rows.find((m) => m.mishap__is_catastrophic === "1" && name.test(m.mishap__description));
const FIRE = catastrophe(/house fire/i);
const LATTE_LARRYS = catastrophe(/latte larry/i);

export default function Forecast() {
  const { filters } = useFilters();
  const withCatastrophe = filters[FORECAST_DIM] === "1";
  const seasons = pickForecast(withCatastrophe);
  // the real seasons in the same version: all mishaps, or everyday only (catastrophic = 0)
  const history = withCatastrophe
    ? lossesBySeason.rows
    : pick(lossesBySeason, { ...NO_FILTERS, mishap__is_catastrophic: "0" });
  const chance = percentWhole(seasons[0].forecast_catastrophe_chance);
  const costLabel = label(seasonForecast, "forecast_loss_median");
  // the mishap count is drawn the same way for both seasons, so one tile shows it (Season 13's row)
  const count = seasons[0];

  return (
    <>
      <header className="masthead">
        <p className="hero-lede">If the show MUST go on&hellip;</p>
        <h1>Future Flops</h1>
        <p className="lede">What Seasons 13 and 14 would likely have cost LD, if they&apos;d aired in 2025 and 2026.</p>
      </header>

      <section className="forecast-seasons" aria-label="Forecast seasons and the chance of a catastrophe">
        {/* what the switch does, above the tiles it changes */}
        <p className="kpis-note">
          {withCatastrophe
            ? "Catastrophes are added back to the real seasons, and each forecast season gets one."
            : "Catastrophes are left out by default. Select Yes in “Add A Catastrophe?” above to add them back to the real seasons and one to each forecast season."}
        </p>
        <p className="kpis-note">
          Each season is in the dollars of the year it aired, or would have aired.{" "}
          <a href={`#${WHY_RANGES}`} onClick={(e) => { e.preventDefault(); openAnswer(WHY_RANGES); }}>
            Why are the ranges for Seasons 13 and 14 so broad?
          </a>
        </p>
        {/* the season costs lead (bigger, yellow); the count and the chance are smaller, in white */}
        {seasons.map((row) => (
          <div className="tile tile-lead" key={row.season_forecast__season}>
            <span className="kpi-label">
              Season {row.season_forecast__season}, {yearOf(row.metric_time__year)}
            </span>
            <span className="tile-value">{usdCompact(row.forecast_loss_median)}</span>
            <span className="kpi-sub">{sentenceCase(costLabel)}</span>
            <span className="kpi-sub">
              {/* low – mid – high, like the Costs card; the mid is the expected cost */}
              Range {usdCompact(row.forecast_loss_p10)} –{" "}
              <mark className="range-mid">{usdCompact(row.forecast_loss_median)}</mark> –{" "}
              {usdCompact(row.forecast_loss_p90)}
            </span>
          </div>
        ))}
        <div className="tile">
          <span className="kpi-label">Mishap Count, each season</span>
          <span className="tile-value">{count.forecast_mishaps_median}</span>
          <span className="kpi-sub">In {count.forecast_episodes} episodes</span>
          <span className="kpi-sub">
            Range {count.forecast_mishaps_p10} –{" "}
            <mark className="range-mid">{count.forecast_mishaps_median}</mark> –{" "}
            {count.forecast_mishaps_p90}
          </span>
        </div>
        <div className="tile">
          <span className="kpi-label">{label(seasonForecast, "forecast_catastrophe_chance")}, each season</span>
          <span className="tile-value">{chance}</span>
          {FIRE && LATTE_LARRYS && (
            <span className="kpi-sub">
              The house fire ({usdCompact(FIRE.total_mishap_loss)}) or Latte Larry&apos;s burning down
              ({usdCompact(LATTE_LARRYS.total_mishap_loss)})
            </span>
          )}
        </div>
      </section>

      <section className="card">
        <h2>The Real Seasons, Then the Future Flops</h2>
        {/* the tooltip follows the mouse across the whole plot, one season at a time */}
        <p className="card-sub">
          <span className="hover-only">Hover along the chart to see each season&apos;s figures.</span>
          <span className="touch-only">Swipe sideways through every season.</span>
        </p>
        <ForecastChart
          history={history}
          forecast={seasons}
          yearOf={SEASON_YEAR}
          withCatastrophe={withCatastrophe}
          historyLabel={label(lossesBySeason, "total_mishap_loss")}
          forecastLabel={costLabel}
        />
      </section>

      <section className="faq faq-plain">
        <h2>The Numbers Explained</h2>
        {METHOD.map((item) => (
          <details key={item.question} id={item.id} className="disclosure faq-item method-item">
            <summary>{item.question}</summary>
            <div className="faq-answer">{item.answer(chance)}</div>
          </details>
        ))}
      </section>
    </>
  );
}

// The method, as questions that open. Plain English: what each step does and why.
const METHOD: { question: string; id?: string; answer: (chance: string) => React.ReactNode }[] = [
  {
    question: "Where do the forecast numbers come from?",
    answer: () => (
      <>
        <p>
          Picture each mishap from the 12 real seasons, minus the catastrophes, as a card in a hat marked with
          what it cost. A pretend season starts with a random number of mishaps, varying the way the real seasons
          did. Draw that many cards and add up what they cost.
        </p>
        <p>
          Repeat that 200,000 times and line the results up from cheapest to most expensive. The one in the middle
          is the expected cost, so half the pretend seasons cost less and half cost more. The range cuts off the
          cheapest tenth and the priciest tenth, so 8 out of 10 pretend seasons land inside it.
        </p>
      </>
    ),
  },
  // these three also appear on the answers page, so they come from one shared source
  { question: UNLUCKY.question, answer: () => UNLUCKY.answer },
  {
    question: "Where does the catastrophe chance come from, and why no divorce?",
    answer: (chance) => <CatastropheChance chance={chance} />,
  },
  { question: SEASON_14_COSTS_MORE.question, answer: () => SEASON_14_COSTS_MORE.answer },
  {
    question: "Why are the ranges so broad?",
    id: WHY_RANGES,
    answer: () => (
      <p>
        Most mishaps cost a few hundred dollars, but a handful, like the car periscope deal and HBO passing on his
        show, cost a million or more. A pretend season that draws one of those jumps toward the high end. Most
        don&apos;t, which is why the expected cost sits close to the low end.
      </p>
    ),
  },
  {
    question: "How sure is this?",
    answer: () => (
      <p>
        It&apos;s a ballpark. Twelve seasons is not a lot to go on. And since every card is a real mishap, no
        pretend mishap can cost more than the biggest real one.
      </p>
    ),
  },
];
