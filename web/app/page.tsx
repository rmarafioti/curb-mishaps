// Home: what the project is, one question per dashboard as the way into the tabs (plus a
// shortcut to the answers), and the build story in short (full version on About).

import Link from "next/link";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// structured data for search engines: the site and who made it
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  author: { "@type": "Person", name: AUTHOR.name, sameAs: [AUTHOR.linkedin, AUTHOR.github] },
};

// the build, in order; it ends in any consumer of the metrics (this dashboard, a BI tool, an
// AI answering questions). The full walkthrough is on About.
const PIPELINE = ["Source data", "BigQuery", "dbt", "Semantic layer", "MetricFlow", "Validation", "Dashboards & AI answers"];

// a few of the questions Pretty, Pretty, Pretty Good Answers answers (same wording as there), each linking to
// the dashboard page that answers it: the home page's way into the tabs
const SAMPLE_QUESTIONS = [
  { q: "How much money did Larry lose to mishaps across the whole series?", href: "/costs-by-season" },
  { q: "What was his single most expensive mishap?", href: "/top-10" },
  { q: "Where do the mishaps leave his net worth at the end of the series?", href: "/net-worth" },
  { q: "What's the chance of a catastrophic mishap in 2025 or 2026?", href: "/future-flops" },
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // escape "<" so the JSON can't close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
      {/* hero: title and intro now; the art goes in a second column later */}
      <header className="home-hero">
        <div className="home-hero-copy">
          <h1>Curb Mis<span className="kern-ha">h</span>aps</h1>
          <p className="hero-lede">
            Every financial mishap Larry suffers over <span className="nowrap-wide"><em>Curb Your Enthusiasm</em>&apos;s</span> 24 year, 12 season run,
            priced and set against Larry David&apos;s real net worth. All laid out in 4 simple dashboards.
          </p>
          <p className="screen-note phone-only">
            Best viewed on a desktop or laptop, since the charts are wide.
          </p>
        </div>
      </header>

      {/* the questions follow the hero's "4 simple dashboards", one per dashboard, in tab order */}
      <div className="home-notes">
        <h2 className="questions-lead">The Dashboards Answer Questions Like:</h2>
        <ul className="sample-questions">
          {SAMPLE_QUESTIONS.map(({ q, href }) => <li key={q}><Link href={href}>{q}</Link></li>)}
        </ul>
        <p className="shortcut">
          Or cut to the chase and read <Link href="/answers">every answer</Link>.
        </p>
      </div>

      <section className="card build-strip" aria-label="The idea behind it">
        <p className="mission">How it&apos;s built. Define a metric once, use it everywhere.</p>
        <p className="build-lead">
          Every metric lives in the dbt semantic layer, so the dashboards, the answers and any AI
          asking the data all get the same number. Get the{" "}
          <Link href="/about">full story</Link>.
        </p>
        <ol className="pipeline-inline" aria-label="The build, step by step">
          {PIPELINE.map((step, i) => (
            <li key={step}>
              <span className="step-chip">{step}</span>
              {i < PIPELINE.length - 1 && <span className="step-arrow" aria-hidden="true">→</span>}
            </li>
          ))}
        </ol>
      </section>

    </>
  );
}
