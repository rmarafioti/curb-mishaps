// FAQ: the dashboard's answers to common questions, in plain English. Every figure is picked
// from the exported metrics (sorting and picking rows only), so the answers update with each
// data refresh. Ordered like the tabs: losses, net worth, then the forecast.

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import Link from "next/link";
import {
  NO_FILTERS, byNumber, episodeCode, kpis, lossesBySeason, lossesByYear, mishapList, netWorthDent,
  percent, percentWhole, pick, pickForecast, usdCompact, usdFull, yearOf,
} from "@/lib/data";

export const metadata: Metadata = pageMetadata(
  "/faq",
  "We've Got Answers",
  "Plain answers about what Larry's mishaps cost him across Curb Your Enthusiasm, read straight from the dashboard's metrics.",
);

type Faq = { question: string; answer: React.ReactNode; see?: { href: string; label: string } };

const total = kpis.rows[0];
const realized = pick(kpis, { ...NO_FILTERS, mishap__loss_kind: "realized" })[0];
const hypothetical = pick(kpis, { ...NO_FILTERS, mishap__loss_kind: "hypothetical" })[0];
const seasons = [...lossesBySeason.rows].sort(byNumber((s) => s.total_mishap_loss, true));
const costliestSeason = seasons[0];
const cheapestSeason = seasons[seasons.length - 1];
const biggest = [...mishapList.rows].sort(byNumber((m) => m.total_mishap_loss, true))[0];
const end = [...netWorthDent.rows].sort((a, b) => b.metric_time__year.localeCompare(a.metric_time__year))[0];
const worstYear = [...lossesByYear.rows].sort(byNumber((y) => y.pct_mishap_to_net_worth, true))[0];
const everyday = pickForecast(false);
const withCatastrophe = pickForecast(true);
const catastropheChance = percentWhole(everyday[0].forecast_catastrophe_chance);

const Figure = ({ children }: { children: React.ReactNode }) => <strong className="faq-figure">{children}</strong>;

const SECTIONS: { title: string; items: Faq[] }[] = [
  {
    title: "What the mishaps cost him",
    items: [
      {
        question: "How much money did Larry lose to mishaps across the whole series?",
        answer: (
          <p>
            <Figure>{usdFull(total.total_mishap_loss)}</Figure> across {total.mishap_count} mishaps, in the
            dollars of the year each episode aired. Because many costs are estimates, the full range
            is {usdCompact(total.total_mishap_loss_low)} to {usdCompact(total.total_mishap_loss_high)}.
          </p>
        ),
        see: { href: "/costs-by-season", label: "Mishap Costs by Season" },
      },
      {
        question: "How much of that is realized, and how much is hypothetical?",
        answer: (
          <>
            <p>
              <Figure>{usdFull(realized.total_mishap_loss)}</Figure> is realized, money or property he
              actually lost, across {realized.mishap_count} mishaps.
            </p>
            <p>
              <Figure>{usdFull(hypothetical.total_mishap_loss)}</Figure> is hypothetical, income he missed
              out on, across {hypothetical.mishap_count} mishaps. Both count toward the total.
            </p>
          </>
        ),
        see: { href: "/costs-by-season", label: "Mishap Costs by Season (Loss kind filter)" },
      },
      {
        question: "What does a typical mishap cost?",
        answer: (
          <p>
            <Figure>{usdFull(total.median_mishap_cost)}</Figure>. That&apos;s the median. Half his mishaps
            cost less, half cost more. A few disasters make the total huge, but most mishaps are small
            change. (With an even number of mishaps, it&apos;s the lower of the middle two.)
          </p>
        ),
      },
      {
        question: "Which season cost him the most, and which the least?",
        answer: (
          <p>
            Season {costliestSeason.episode__season} was the most expensive
            at <Figure>{usdFull(costliestSeason.total_mishap_loss)}</Figure> over {costliestSeason.mishap_count} mishaps.
            Season {cheapestSeason.episode__season} was the cheapest
            at <Figure>{usdFull(cheapestSeason.total_mishap_loss)}</Figure> over {cheapestSeason.mishap_count} mishaps.
            {cheapestSeason.episode__season === "12" && (
              <> Season 12 is still being reviewed, though, so it may not stay the cheapest.</>
            )}
          </p>
        ),
        see: { href: "/costs-by-season", label: "Mishap Costs by Season (Season filter)" },
      },
      {
        question: "What was his single most expensive mishap?",
        answer: (
          <p>
            {biggest.mishap__description} ({episodeCode(biggest)}, &ldquo;{biggest.episode__episode_title}&rdquo;)
            at <Figure>{usdFull(biggest.total_mishap_loss)}</Figure>.
          </p>
        ),
        see: { href: "/top-10", label: "Top 10 Disasters" },
      },
    ],
  },
  {
    title: "What it does to his net worth",
    items: [
      {
        question: "Where do the mishaps leave his net worth at the end of the series?",
        answer: (
          <p>
            By {yearOf(end.metric_time__year)} his real net worth is about {usdCompact(end.net_worth_mid)}.
            Take out every mishap so far ({usdCompact(end.cumulative_mishap_loss)}) and he&apos;d be left
            with <Figure>{usdFull(end.net_worth_after_mishaps_to_date)}</Figure>. That&apos;s the
            character&apos;s bill set against the real man&apos;s fortune, not his actual bank account.
          </p>
        ),
        see: { href: "/net-worth", label: "Net Worth vs. Mishaps" },
      },
      {
        question: "Which year hurt the most?",
        answer: (
          <p>
            {yearOf(worstYear.metric_time__year)}. That year&apos;s mishaps cost {usdFull(worstYear.total_mishap_loss)},
            or <Figure>{percent(worstYear.pct_mishap_to_net_worth)}</Figure> of his net worth that year.
          </p>
        ),
        see: { href: "/net-worth", label: "Net Worth vs. Mishaps" },
      },
    ],
  },
  {
    title: "If the show had kept going",
    items: [
      {
        question: "If the show ran one season a year through 2026, is there a trend in mishaps per season?",
        answer: (
          <p>
            No. Across the 12 real seasons, neither how often mishaps happen nor what a typical one costs (with
            inflation taken out) rose or fell in a way the data can tell apart from chance. So the forecast
            treats every season alike and draws from all 12.
          </p>
        ),
        see: { href: "/forecast", label: "Forecast" },
      },
      {
        question: "How many mishaps would Seasons 13 and 14 bring?",
        answer: (
          <p>
            About <Figure>{everyday[0].forecast_mishaps_median}</Figure> everyday mishaps each, and most likely
            between {everyday[0].forecast_mishaps_p10} and {everyday[0].forecast_mishaps_p90}. Like the real seasons,
            most would be money actually lost, with a missed opportunity now and then.
          </p>
        ),
        see: { href: "/forecast", label: "Forecast" },
      },
      {
        question: "What's the chance of a catastrophic mishap in 2025 or 2026?",
        answer: (
          <p>
            <Figure>{catastropheChance}</Figure> each season. Two of the 12 real seasons had one, the house fire
            and Latte Larry&apos;s burning down. The divorce isn&apos;t counted again, since it was the show&apos;s
            one divorce and Larry ends the series unmarried.
          </p>
        ),
        see: { href: "/forecast", label: "Forecast" },
      },
      {
        question: "What would each forecast season cost?",
        answer: (
          <p>
            {everyday.map((row, i) => (
              <span key={row.season_forecast__season}>
                {i > 0 && " "}
                Season {row.season_forecast__season} ({yearOf(row.metric_time__year)}) would most likely
                cost <Figure>{usdCompact(row.forecast_loss_median)}</Figure> in everyday mishaps, and 8 times in 10
                between {usdCompact(row.forecast_loss_p10)} and {usdCompact(row.forecast_loss_p90)}.
              </span>
            ))}{" "}
            If a catastrophe hits, Season {withCatastrophe[0].season_forecast__season} would cost
            about {usdCompact(withCatastrophe[0].forecast_loss_median)}.
          </p>
        ),
        see: { href: "/forecast", label: "Forecast" },
      },
      {
        question: "Would a bigger bill mean more mishaps, or mostly inflation?",
        answer: (
          <p>
            Mostly inflation. With no trend in how often mishaps happen or what they really cost, the only
            steady difference between Season 13 and Season 14 is prices, a few percent a year. Each season is
            shown in the dollars of the year it would air.
          </p>
        ),
        see: { href: "/forecast", label: "Forecast" },
      },
    ],
  },
];

export default function Page() {
  return (
    <>
      <header className="masthead">
        <h1>We&apos;ve got answers</h1>
        <p className="lede">
          The facts, answered plainly, each one read straight from the dashboard&apos;s metrics. A
          few Season 12 episodes are still being reviewed, so the figures may still change.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title} className="card faq">
          <h2>{section.title}</h2>
          {section.items.map((item) => (
            <details key={item.question} className="disclosure faq-item">
              <summary>{item.question}</summary>
              <div className="faq-answer">
                {item.answer}
                {item.see && (
                  <p className="faq-see">
                    See <Link href={item.see.href}>{item.see.label}</Link>
                  </p>
                )}
              </div>
            </details>
          ))}
        </section>
      ))}
    </>
  );
}
