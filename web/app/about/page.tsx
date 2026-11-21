// Tab 5: About: what the project is, how the numbers were made, and how it's built.

import type { Metadata } from "next";

export const metadata: Metadata = { title: "About · Curb Mishaps" };

export default function Page() {
  return (
    <>
      <header className="masthead">
        <h1>About</h1>
        <p className="lede">
          Every financial mishap Larry suffers across 12 seasons of <em>Curb Your Enthusiasm</em> (2000–2024),
          priced and set against Larry David&apos;s real net worth.
        </p>
      </header>

      <section className="card prose">
        <h2>How the mishaps were priced</h2>
        <ul>
          <li>When an amount is said or shown in the episode, that amount is used.</li>
          <li>
            Otherwise the cost is a researched estimate with a low, middle and high value. The middle
            is used for totals; the low and high give the range shown under the total.
          </li>
          <li>
            Every amount is in the dollars of the year the episode aired. Prices found today were
            converted back to that year with the consumer price index.
          </li>
          <li>Each mishap&apos;s note says how it was priced (hover a point on the timeline, or see the Top 10).</li>
        </ul>
      </section>

      <section className="card prose">
        <h2>What counts</h2>
        <ul>
          <li><strong>Realized</strong> losses are money or property actually lost.</li>
          <li><strong>Hypothetical</strong> losses are income he missed out on. They count toward every total.</li>
          <li>
            <strong>Catastrophic</strong> mishaps (the divorce, the house fire, Latte Larry&apos;s) count too.
            The show&apos;s divorce is the only divorce counted.
          </li>
          <li>The <strong>typical mishap</strong> is the lower median: with an even number of mishaps, the lower of the middle two.</li>
        </ul>
      </section>

      <section className="card prose">
        <h2>Net worth</h2>
        <ul>
          <li>
            Larry David&apos;s net worth is the central (mid) estimate from the figures reported each
            year, with his real 2007 divorce added back so it isn&apos;t counted against him twice.
          </li>
          <li>
            The net-worth chart subtracts every mishap so far from that real figure. It shows what he&apos;d
            have if the character&apos;s losses were real, not his actual bank account, and it adds losses
            in each year&apos;s own dollars.
          </li>
        </ul>
      </section>

      <section className="card prose">
        <h2>How it&apos;s built</h2>
        <p>
          The mishaps live in a Google Sheet that BigQuery reads directly. dbt cleans and models
          them, and every number on this site is defined once as a metric in dbt&apos;s semantic layer
          (MetricFlow). Each chart is a saved query against those metrics, exported to a file the site
          reads when it&apos;s built. The site itself only sorts, filters and formats; it never calculates
          a number.
        </p>
        <p>A few Season 12 episodes are still being reviewed; the numbers update when they are.</p>
      </section>
    </>
  );
}
