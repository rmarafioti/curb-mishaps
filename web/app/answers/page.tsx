// FAQ: the dashboard's answers to common questions, in plain English. Every figure is picked
// from the exported metrics (sorting and picking rows only), so the answers update with each
// data refresh. Ordered like the tabs: losses, net worth, then the forecast.

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { CatastropheChance, SEASON_14_COSTS_MORE, UNLUCKY } from "@/lib/shared-answers";
import Link from "next/link";
import {
  NO_FILTERS, byNumber, episodeCode, kpis, lossesBySeason, lossesByYear, mishapList, netWorthDent,
  percent, percentWhole, pick, pickForecast, usdCompact, usdFull, yearOf,
} from "@/lib/data";

export const metadata: Metadata = pageMetadata(
  "/answers",
  "Pretty, Pretty, Pretty Good Answers",
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
    title: "What the Mishaps Cost Larry",
    items: [
      {
        question: "How much money did Larry lose to mishaps across the whole series?",
        answer: (
          <p>
            <Figure>{usdFull(total.total_mishap_loss)}</Figure> across {total.mishap_count} mishaps, each priced
            at what it cost the year its episode aired. Because many costs are estimates, the range
            is {usdCompact(total.total_mishap_loss_low)} –{" "}
            <Figure>{usdCompact(total.total_mishap_loss)}</Figure> – {usdCompact(total.total_mishap_loss_high)}.
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
              out on, across {hypothetical.mishap_count} mishaps. Added together, they make
              the <Figure>{usdFull(total.total_mishap_loss)}</Figure> total.
            </p>
          </>
        ),
        see: { href: "/costs-by-season", label: "Mishap Costs by Season (Loss Type filter)" },
      },
      {
        question: "What does a typical mishap cost?",
        answer: (
          <p>
            <Figure>{usdFull(total.median_mishap_cost)}</Figure>, the lower median. Line up every mishap from
            cheapest to most expensive and it&apos;s the one in the middle. With an even number of mishaps,
            it&apos;s the lower of the two middle ones. A few disasters make the total huge, but most mishaps
            cost only a few hundred dollars.
          </p>
        ),
      },
      {
        question: "Which season cost him the most, and which the least?",
        answer: (
          <p>
            Season {costliestSeason.episode__season} was the most expensive
            at <Figure>{usdFull(costliestSeason.total_mishap_loss)}</Figure> across {costliestSeason.mishap_count} mishaps.
            Season {cheapestSeason.episode__season} was the cheapest
            at <Figure>{usdFull(cheapestSeason.total_mishap_loss)}</Figure> across {cheapestSeason.mishap_count} mishaps.
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
    title: "What It Does to His Net Worth",
    items: [
      {
        question: "Where do the mishaps leave his net worth at the end of the series?",
        answer: (
          <p>
            By {yearOf(end.metric_time__year)} LD&apos;s reported net worth is about {usdCompact(end.net_worth_mid)},
            not counting his real 2007 divorce. Subtract every mishap from the series ({usdCompact(end.cumulative_mishap_loss)}) and he&apos;d be left
            with <Figure>{usdFull(end.net_worth_after_mishaps_to_date)}</Figure>. That&apos;s the Curb mishaps
            set against the real man&apos;s fortune, not his actual bank account.
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
    title: "Future Flops",
    items: [
      { ...UNLUCKY, see: { href: "/future-flops", label: "Future Flops" } },
      {
        question: "How many mishaps would Seasons 13 and 14 bring?",
        answer: (
          <p>
            About <Figure>{everyday[0].forecast_mishaps_median}</Figure> everyday mishaps each, with 8 out of 10
            pretend seasons getting between {everyday[0].forecast_mishaps_p10} and {everyday[0].forecast_mishaps_p90}.
            Like the real seasons,
            most would be money actually lost, with a missed opportunity now and then.
          </p>
        ),
        see: { href: "/future-flops", label: "Future Flops" },
      },
      {
        question: "What's the chance of a catastrophic mishap in 2025 or 2026?",
        answer: <CatastropheChance chance={<Figure>{catastropheChance}</Figure>} />,
        see: { href: "/future-flops", label: "Future Flops" },
      },
      {
        question: "What would Seasons 13 and 14 cost?",
        answer: (
          <p>
            {everyday.map((row, i) => (
              <span key={row.season_forecast__season}>
                {i > 0 && " "}
                Season {row.season_forecast__season} ({yearOf(row.metric_time__year)}) has an expected cost
                of <Figure>{usdCompact(row.forecast_loss_median)}</Figure> in everyday mishaps, with 8 out of 10
                pretend seasons landing between {usdCompact(row.forecast_loss_p10)} and {usdCompact(row.forecast_loss_p90)}.
              </span>
            ))}{" "}
            If a catastrophe hits, Season {withCatastrophe[0].season_forecast__season} would cost
            about {usdCompact(withCatastrophe[0].forecast_loss_median)}.
          </p>
        ),
        see: { href: "/future-flops", label: "Future Flops" },
      },
      { ...SEASON_14_COSTS_MORE, see: { href: "/future-flops", label: "Future Flops" } },
    ],
  },
];

export default function Page() {
  return (
    <>
      <header className="masthead">
        <p className="hero-lede">Let me ask you a question&hellip;</p>
        <h1>Pretty, Pretty, Pretty Good Answers</h1>
        <p className="lede">
          The facts, answered plainly, each one read straight from the dashboard&apos;s metrics.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title} className="faq faq-plain">
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
