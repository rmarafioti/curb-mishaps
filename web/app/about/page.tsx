// About: the mission, how the site is built (from watching episodes to the semantic layer to
// the AI-built page), how the data was collected and priced, and the sources. The one live
// number (the Total Mishap Loss example) is picked from the export, like every other page.

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import headshot from "@/public/images/rich-marafioti.jpg";
import { kpis, label, usdFull } from "@/lib/data";

export const metadata: Metadata = pageMetadata(
  "/about",
  "About",
  "How Curb Mishaps was built, from a Google Sheet to BigQuery, dbt and the MetricFlow semantic layer, and how every mishap was priced.",
);

const total = kpis.rows[0];

// total_mishap_loss exactly as defined in models/marts/_metrics.yml, minus its code comment
// (shown, not run: the page reads the exported result). Keep in step with the YAML.
const METRIC_YAML = `- name: total_mishap_loss
  label: Total Mishap Loss
  description: >
    Every kept mishap, realized + hypothetical + catastrophic. Hypothetical losses always
    count; loss_kind is only a slice.
  type: simple
  type_params:
    measure:
      name: mishap_cost
      fill_nulls_with: 0`;

const PIPELINE: { step: string; detail: React.ReactNode }[] = [
  {
    step: "Investigative Work",
    detail: (
      <>
        Every episode of all 12 seasons, checked against Wikipedia and IMDb plot
        synopses, and re-watched to validate the situations those online sources describe.
      </>
    ),
  },
  {
    step: "Google Sheet",
    detail: (
      <>
        The source of truth, with one row per mishap, each marked keep, drop or unsure by a human
        reviewer, with its price, how it was priced, a confidence level and a source.
      </>
    ),
  },
  {
    step: "BigQuery",
    detail: <>The warehouse reads the Sheet live as an external table. An edit in the Sheet reaches the warehouse on the next build.</>,
  },
  {
    step: "dbt",
    detail: (
      <>
        Every column is cleaned and cast to its proper type, so a bad cell fails the build instead of
        quietly becoming a blank. The models then build a star schema, one fact table of mishaps joined
        to dimensions for episodes, net worth by year and the calendar. This is where the rules live,
        like which rows count and which price to use. Tests catch duplicate mishaps and missing costs
        on every build.
      </>
    ),
  },
  {
    step: "Semantic Layer",
    detail: (
      <>
        Every number on this site is defined once, by name, in YAML, like Total Mishap Loss,
        Cumulative Financial Loss, Net Worth After Mishaps and the rest. Change a definition there and it changes
        everywhere.
      </>
    ),
  },
  {
    step: "MetricFlow",
    detail: (
      <>
        dbt&apos;s metrics engine turns those definitions into SQL. Each chart is a saved query
        (metrics by name, sliced by season, year or loss type), exported from the production
        warehouse to the files this site is built from.
      </>
    ),
  },
  {
    step: "Validation",
    detail: (
      <>
        Before any chart was built, every metric was checked by hand, comparing MetricFlow&apos;s
        answers with the warehouse and with the source Sheet&apos;s own year-by-year totals, down to
        the dollar. Each release to production must match development before the dashboard reads it.
      </>
    ),
  },
  {
    step: "AI-Assisted Dashboard",
    detail: (
      <>
        The dashboards on this site were built with Claude. Every figure they show comes straight from
        the semantic layer. The page only sorts, picks and formats those values, and never writes its own
        query or does its own math, so it can&apos;t invent its own version of a figure.
      </>
    ),
  },
];

// Data Collection, as rows that open: how the mishaps and net worth were gathered and recorded
const DATA_COLLECTION: { title: string; body: React.ReactNode }[] = [
  {
    title: "What Counts",
    body: (
      <p>
        Any time Larry loses money or property, or misses out on income, because of his own behavior or bad
        luck. Ordinary purchases, normal gifts and other people&apos;s losses don&apos;t count.
      </p>
    ),
  },
  {
    title: "Realized and Hypothetical",
    body: (
      <p>
        <em>Realized</em> losses are money or property actually lost. <em>Hypothetical</em> losses are income
        he missed out on (the shelved musical, the car periscope stake). Both count toward every total.
      </p>
    ),
  },
  {
    title: "Catastrophic Mishaps",
    body: (
      <p>
        The divorce, the house fire and Latte Larry&apos;s count too, and are tracked as their own group so
        they don&apos;t distort the everyday numbers.
      </p>
    ),
  },
  {
    title: "One Divorce, Counted Once",
    body: (
      <p>
        Larry plays himself, so the show&apos;s losses are set against his real fortune. The show&apos;s 2011
        divorce is valued at his real 2007 settlement, and the real divorce cost is added back to his net worth
        so it isn&apos;t counted twice.
      </p>
    ),
  },
  {
    title: "How Each Mishap Was Priced",
    body: (
      <>
        <ul>
          <li><strong>Stated.</strong> The amount said or shown in the episode, used whenever there is one.</li>
          <li><strong>Reference.</strong> A researched price for the same thing.</li>
          <li><strong>Category default.</strong> A typical price for that kind of item.</li>
          <li><strong>Assumption.</strong> A reasoned best guess, for one-offs like a hospital wing.</li>
        </ul>
        <p>
          Estimates have a low, middle and high value. Totals use the middle, and the low and high give the
          range.
        </p>
      </>
    ),
  },
  {
    title: "Dollars of the Year It Aired",
    body: (
      <p>
        Every amount is in the dollars of the year the episode aired. Prices found today were converted back
        to that year with the consumer price index.
      </p>
    ),
  },
  {
    title: "Net Worth",
    body: (
      <p>
        The central estimate of Larry David&apos;s reported net worth, without counting his real 2007 divorce.
        In years with no report, it steps evenly from one reported figure to the next.
      </p>
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

// an envelope (Material Icons "mail"), for the email link. The path spans x 2-22, so the
// viewBox is cropped to it: edge to edge, like the LinkedIn and GitHub marks.
const MailIcon = () => (
  <svg viewBox="2 2 20 20" aria-hidden="true" className="link-icon mail-icon">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

export default function Page() {
  return (
    <>
      <header className="masthead">
        <h1>About</h1>
        <p className="lede">
          <cite>Curb Your Enthusiasm</cite>, the hit HBO show, stars Larry David, the co-creator
          of <cite>Seinfeld</cite>, playing himself. In almost every
          episode, the iconic Jewish curmudgeon talks himself into a situation that ends up costing
          him money. So I wondered, if I tallied up every one of those mishaps and set them against
          Larry David&apos;s real-life net worth, what would his personality actually cost him?
        </p>
        <p className="lede lede-hook">Larry&apos;s mishaps are the hook. The point is the dbt semantic layer.</p>
      </header>

      {/* no card box. Styled like the home page's build box: the gold display line leads,
          the statement under it in the white body face */}
      <section className="prose prose-plain">
        <h2 className="mission">The Mission</h2>
        <p className="build-lead">
          Define a metric once. Use it everywhere, in dashboards, reports and AI answers. Always
          the same, always traceable to the warehouse.
        </p>
        <p>
          Once every metric is defined in one place and wired to the dashboard, the page practically
          builds itself, and every number on it traces back to the warehouse, with no hand-written
          queries behind any chart.
        </p>
        <p>
          That matters most with AI. An AI that writes its own SQL can be confidently wrong. An AI
          that asks a governed semantic layer gives answers that match the agreed definitions.
        </p>
      </section>

      <section className="prose prose-plain">
        <h2 className="mission">How It&apos;s Built</h2>
        <ol className="pipeline">
          {PIPELINE.map((p) => (
            <li key={p.step}>
              <span className="pipeline-step">{p.step}</span>
              <span className="pipeline-detail">{p.detail}</span>
            </li>
          ))}
        </ol>

        <h3>One Metric, Everywhere</h3>
        <p>
          Below is {label(kpis, "total_mishap_loss")} exactly as it&apos;s defined in the semantic
          layer. It&apos;s a few lines of YAML, and the only place the metric exists. It produces{" "}
          <strong className="faq-figure">{usdFull(total.total_mishap_loss)}</strong>, the same figure in the
          headline on <Link href="/costs-by-season">Mishap Costs by Season</Link> and in the first answer
          on <Link href="/answers">Pretty, Pretty, Pretty Good Answers</Link>. Sliced by season or loss type, the same
          definition gives every filtered total.
        </p>
        <pre className="code" aria-label="Total Mishap Loss, as defined in the semantic layer (YAML)"><code>{METRIC_YAML}</code></pre>

        {/* live queries are the usual setup; the static export was a scope choice for a finished show */}
        <h3>Why the Numbers Are Exported</h3>
        <p>
          In most setups, a dashboard or an AI agent queries the semantic layer live. Change a filter and
          MetricFlow writes the SQL, runs it in the warehouse and hands back the number. This site skips that
          on purpose. The show is finished, and the data only changes when the Sheet gets a review, so every
          chart&apos;s query, and every filter combination the page offers, is run once against production and
          saved as a file.
        </p>
        <p>
          The page loads instantly, there&apos;s no warehouse bill on each visit, and every figure is still
          exactly what the semantic layer produced.
        </p>
        <p className="repo-link">
          <GitHubIcon />
          <span>
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/rmarafioti/curb-mishaps">
              View the code for this project on GitHub
            </a>
          </span>
        </p>
      </section>

      {/* reference material, so it rolls up: each point opens like the answers page, no card box */}
      <section className="prose faq faq-plain">
        <h2 className="mission">Data Collection</h2>
        {DATA_COLLECTION.map((item) => (
          <details key={item.title} className="disclosure faq-item">
            <summary>{item.title}</summary>
            <div className="faq-answer">{item.body}</div>
          </details>
        ))}
      </section>

      <section className="prose faq faq-plain">
        <h2 className="mission">Sources</h2>
        <details className="disclosure faq-item">
          <summary>Episodes and Mishaps</summary>
          <div className="faq-answer">
            <ul>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/List_of_Curb_Your_Enthusiasm_episodes">
                  Wikipedia, List of Curb Your Enthusiasm episodes
                </a>
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://www.imdb.com/title/tt0264235/">IMDb plot synopses</a>
                {" "}(Seasons 1–10; Seasons 11–12 have none)
              </li>
              <li>Watching the episodes, for anything the synopses missed</li>
            </ul>
          </div>
        </details>
        <details className="disclosure faq-item">
          <summary>Prices</summary>
          <div className="faq-answer">
            <ul>
              <li>
                Each estimate cites its reference in its pricing note, shown on{" "}
                <Link href="/top-10">Top 10 Disasters</Link> and in the How It Was Priced column
                on <Link href="/costs-by-season">Mishap Costs by Season</Link>.
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://www.bls.gov/cpi/">U.S. Bureau of Labor Statistics, CPI-U annual averages</a>,
                for converting today&apos;s prices to each year&apos;s dollars
              </li>
            </ul>
          </div>
        </details>
        <details className="disclosure faq-item">
          <summary>Larry David&apos;s Net Worth</summary>
          <div className="faq-answer">
            <ul>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://www.celebritynetworth.com/articles/entertainment-articles/how-much-money-did-jerry-seinfeld-make-off-of-seinfeld-from-salary-and-royalties/">
                  Celebrity Net Worth
                </a>
                , the Seinfeld syndication windfall (2000)
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://extratv.com/2007/06/05/larry-david-and-wife-laurie-split-after-14-years">Extra</a>
                , his fortune before and after the 2007 divorce
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://www.businessinsider.in/heres-why-larry-david-says-he-isnt-really-worth-half-a-billion/articleshow/46449672.cms">
                  Business Insider
                </a>
                , reported net worth, 2015
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://thewrap.com/jerry-seinfeld-larry-david-100-million-dollars-netflix-deal">TheWrap</a>
                , the Netflix Seinfeld deal (2019)
              </li>
              <li>
                <a target="_blank" rel="noopener noreferrer" href="https://www.celebritynetworth.com/?p=43">Celebrity Net Worth</a>, current
                estimate (2026)
              </li>
            </ul>
          </div>
        </details>
      </section>

      {/* the author: no card or heading, it floats on the page; the photo and name say it */}
      <section className="prose author-section" aria-label="About the author">
        <div className="author">
          <Image src={headshot} alt="Rich Marafioti" className="author-photo" sizes="192px" placeholder="blur" />
          <div className="author-text">
            <p>
              <strong className="author-name">Rich Marafioti</strong> is an analytics engineer working in K–12 education, with
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
              <li>
                <a href="mailto:richmarafioti@gmail.com" className="icon-link" aria-label="Email Rich Marafioti">
                  <MailIcon />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
