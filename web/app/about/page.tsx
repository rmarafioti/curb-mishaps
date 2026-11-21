// About: the mission, how the site is built (from watching episodes to the semantic layer to
// the AI-built page), how the data was collected and priced, and the sources. The one live
// number (the Total Mishap Loss example) is picked from the export, like every other page.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import headshot from "@/public/images/rich-marafioti.jpg";
import { kpis, label, usdFull } from "@/lib/data";

export const metadata: Metadata = { title: "About · Curb Mishaps" };

const total = kpis.rows[0];

// total_mishap_loss exactly as defined in models/marts/_metrics.yml, minus its code comment
// (shown, not run: the page reads the exported result). Keep in step with the YAML.
const METRIC_YAML = `- name: total_mishap_loss
  label: Total Mishap Loss
  description: >
    Every kept mishap: realized + hypothetical + catastrophic. Hypothetical losses always
    count; loss_kind is only a slice.
  type: simple
  type_params:
    measure:
      name: mishap_cost
      fill_nulls_with: 0`;

const PIPELINE: { step: string; detail: React.ReactNode }[] = [
  {
    step: "Investigative work",
    detail: (
      <>
        Every episode of all 12 seasons, checked against Wikipedia, the Curb fan wiki and IMDb plot
        synopses, and re-watched where memory was fuzzy. Each money-losing moment became a row, and
        each unstated cost was researched and priced.
      </>
    ),
  },
  {
    step: "Google Sheet",
    detail: (
      <>
        The source of truth: one row per mishap, each marked keep, drop or unsure by a human
        reviewer, with its price, how it was priced, a confidence level and a source.
      </>
    ),
  },
  {
    step: "BigQuery",
    detail: <>The warehouse reads the Sheet live as an external table. No exports or copy-paste: an edit in the Sheet reaches the warehouse on the next build.</>,
  },
  {
    step: "dbt staging",
    detail: (
      <>
        Cleaning: every column is renamed and cast to its proper type. A bad cell fails the build
        with the value in the error instead of quietly becoming a blank, and tests check the data
        before anything is built on it.
      </>
    ),
  },
  {
    step: "dbt star schema",
    detail: (
      <>
        Modeling: one fact table of mishaps, joined to dimensions for episodes, net worth by year
        and the calendar. This is where the rules live: which rows count, which price to use.
      </>
    ),
  },
  {
    step: "Semantic layer",
    detail: (
      <>
        Every number on this site is defined once, by name, in YAML: Total Mishap Loss, Median
        Mishap Cost, Net Worth After Mishaps and the rest. Change a definition there and it changes
        everywhere.
      </>
    ),
  },
  {
    step: "MetricFlow",
    detail: (
      <>
        dbt&apos;s metrics engine turns those definitions into SQL. Each chart is a saved query
        (metrics by name, sliced by season, year or loss kind), exported from the production
        warehouse to the files this site is built from.
      </>
    ),
  },
  {
    step: "AI-assisted dashboard",
    detail: (
      <>
        The site was built with Claude. AI is non-deterministic: ask twice and you can get two
        different pages. The numbers are not: the page only reads values the semantic layer
        produced, and only sorts, picks and formats them. It never writes its own query or does its
        own math, so it can&apos;t be confidently wrong about a figure.
      </>
    ),
  },
];

// LinkedIn and GitHub marks (Simple Icons paths), drawn in the link's own color
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="link-icon">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="link-icon">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

export default function Page() {
  return (
    <>
      <header className="masthead">
        <h1>About</h1>
        <p className="hero-lede">This project is pretty, pretty, pretty bonkers.</p>
        <p className="lede">
          <cite>Curb Your Enthusiasm</cite> is comedy gold, the hit HBO show starring Larry David
          playing himself, the co-creator of <cite>Seinfeld</cite>. In almost every
          episode, the iconic Jewish curmudgeon talks himself into a situation that ends up costing
          him money. So I wondered, if we tallied up every one of those mishaps and set them against
          Larry David&apos;s real-life net worth, what would his personality actually cost him?
        </p>
      </header>

      <section className="card prose">
        <h2>The mission</h2>
        <p>Larry&apos;s mishaps are the hook. The point is the dbt semantic layer.</p>
        <p className="mission">
          Define a metric once. Use it everywhere: in dashboards, in reports, in AI answers. Always
          the same, always traceable to the warehouse.
        </p>
        <p>
          Once every metric is defined in one place and wired to the dashboard, the page practically
          builds itself, and every number on it is true to the warehouse, with no hand-written
          queries behind any chart.
        </p>
        <p>
          That matters most with AI. An AI that writes its own SQL can be confidently wrong. An AI
          that asks a governed semantic layer can only give answers that were already agreed on.
        </p>
      </section>

      <section className="card prose">
        <h2>How it&apos;s built</h2>
        <ol className="pipeline">
          {PIPELINE.map((p) => (
            <li key={p.step}>
              <span className="pipeline-step">{p.step}</span>
              <span className="pipeline-detail">{p.detail}</span>
            </li>
          ))}
        </ol>

        <h3>An example: one metric, everywhere</h3>
        <p>
          Below is {label(kpis, "total_mishap_loss")} exactly as it&apos;s defined in the semantic
          layer: a few lines of YAML, and the only place the metric exists. It produces{" "}
          <strong className="faq-figure">{usdFull(total.total_mishap_loss)}</strong>, the same figure in the
          headline on <Link href="/costs-by-season">Mishap Costs by Season</Link> and in the first answer
          on <Link href="/faq">We&apos;ve Got Answers</Link>. Sliced by season or loss kind, the same
          definition gives every filtered total.
        </p>
        <pre className="code" aria-label="Total Mishap Loss, as defined in the semantic layer (YAML)"><code>{METRIC_YAML}</code></pre>
        <p className="repo-link">
          <GitHubIcon />
          <span>
            View the code for this project{" "}
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/rmarafioti/curb-mishaps">here</a>.
          </span>
        </p>
      </section>

      <section className="card prose">
        <h2>Data collection</h2>
        <ul className="roomy">
          <li>
            <strong>What counts:</strong> any time Larry loses money or property, or misses out on
            income, because of his own behavior or bad luck. Ordinary purchases, normal gifts and
            other people&apos;s losses don&apos;t count.
          </li>
          <li>
            <strong>Realized</strong> losses are money or property actually lost.{" "}
            <strong>Hypothetical</strong> losses are income he missed out on (the shelved musical, the
            car periscope stake). Both count toward every total.
          </li>
          <li>
            <strong>Catastrophic</strong> mishaps (the divorce, the house fire, Latte Larry&apos;s) count
            too, and are tracked as their own group so they don&apos;t distort the everyday numbers.
          </li>
          <li>
            <strong>One divorce, counted once.</strong> Larry plays himself, so the show&apos;s losses
            are set against his real fortune. The show&apos;s 2011 divorce is valued at his real 2007
            settlement, and that real divorce is added back to his net worth so it isn&apos;t counted
            twice.
          </li>
          <li>
            <strong>How each mishap was priced:</strong> the amount said or shown in the episode
            when there is one (<em>stated</em>); otherwise a researched <em>reference</em> price, a
            typical price for that kind of item (<em>category default</em>), or a reasoned{" "}
            <em>assumption</em> for one-offs like a hospital wing. Estimates have a low, middle and
            high value; totals use the middle, and the low and high give the range.
          </li>
          <li>
            <strong>Every amount is in the dollars of the year the episode aired.</strong> Prices
            found today were converted back to that year with the consumer price index.
          </li>
          <li>
            <strong>Confidence:</strong> every price carries one of three levels.{" "}
            <em>High</em>: the amount is stated in the episode. <em>Medium</em>: a solid reference
            price for the same thing. <em>Low</em>: a category default or an assumption, with a
            wide range.
          </li>
          <li>
            <strong>Net worth</strong> is the central estimate of Larry David&apos;s reported net
            worth, anchored to the years it was reported and filled in between, with the real 2007
            divorce added back.
          </li>
          <li>
            <strong>Typical mishap</strong> means the lower median: with an even number of mishaps,
            the lower of the middle two.
          </li>
          <li>
            <strong>Still in review:</strong> a few Season 12 episodes. The numbers update once
            they&apos;re done.
          </li>
        </ul>
      </section>

      <section className="card prose">
        <h2>Sources</h2>
        <h3>Episodes and mishaps</h3>
        <ul>
          <li>
            <a target="_blank" rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/List_of_Curb_Your_Enthusiasm_episodes">
              Wikipedia: List of Curb Your Enthusiasm episodes
            </a>
          </li>
          <li>The Curb Your Enthusiasm fan wiki (Fandom), for episode details</li>
          <li>IMDb plot synopses (Seasons 1–10; Seasons 11–12 have none)</li>
          <li>Watching the episodes, for anything the synopses missed</li>
        </ul>
        <h3>Prices</h3>
        <ul>
          <li>
            Each estimate cites its reference in its pricing note, shown on{" "}
            <Link href="/top-10">Top 10 Disasters</Link> and when you hover a mishap on the timeline.
          </li>
          <li>
            <a target="_blank" rel="noopener noreferrer" href="https://www.bls.gov/cpi/">U.S. Bureau of Labor Statistics, CPI-U annual averages</a>,
            for converting today&apos;s prices to each year&apos;s dollars
          </li>
        </ul>
        <h3>Larry David&apos;s net worth</h3>
        <ul>
          <li>
            <a target="_blank" rel="noopener noreferrer" href="https://www.celebritynetworth.com/articles/entertainment-articles/how-much-money-did-jerry-seinfeld-make-off-of-seinfeld-from-salary-and-royalties/">
              Celebrity Net Worth
            </a>
            : the Seinfeld syndication windfall (2000)
          </li>
          <li>
            <a target="_blank" rel="noopener noreferrer" href="https://extratv.com/2007/06/05/larry-david-and-wife-laurie-split-after-14-years">Extra</a>
            : his fortune before and after the 2007 divorce
          </li>
          <li>
            <a target="_blank" rel="noopener noreferrer" href="https://www.businessinsider.in/heres-why-larry-david-says-he-isnt-really-worth-half-a-billion/articleshow/46449672.cms">
              Business Insider
            </a>
            : reported net worth, 2015
          </li>
          <li>
            <a target="_blank" rel="noopener noreferrer" href="https://thewrap.com/jerry-seinfeld-larry-david-100-million-dollars-netflix-deal">TheWrap</a>
            : the Netflix Seinfeld deal (2019)
          </li>
          <li>
            <a target="_blank" rel="noopener noreferrer" href="https://www.celebritynetworth.com/?p=43">Celebrity Net Worth</a>: current
            estimate (2026)
          </li>
        </ul>
      </section>

      {/* the author: no card or heading, it floats on the page; the photo and name say it */}
      <section className="prose author-section" aria-label="About the author">
        <div className="author">
          <Image src={headshot} alt="Rich Marafioti" className="author-photo" sizes="192px" placeholder="blur" />
          <div className="author-text">
            <p>
              <strong>Rich Marafioti</strong> is an analytics engineer working in K–12 education, with
              proficiencies in SQL, dbt, data modeling and BI development.
            </p>
            <ul className="link-row">
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/in/richmarafioti/" className="icon-link" aria-label="Rich Marafioti on LinkedIn">
                  <LinkedInIcon />
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://github.com/rmarafioti" className="icon-link" aria-label="Rich Marafioti on GitHub">
                  <GitHubIcon />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
