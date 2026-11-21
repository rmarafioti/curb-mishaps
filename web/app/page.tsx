// Home: what the project is, the build story in one line (full version on About), a
// shortcut to the answers, and a way into each tab.

import Link from "next/link";
import { PAGES } from "@/lib/pages";

// the build, in order; it ends in any consumer of the metrics (this dashboard, a BI tool, an
// AI answering questions). The full walkthrough is on About.
const PIPELINE = ["Source data", "BigQuery", "dbt", "Semantic layer", "MetricFlow", "Validation", "Dashboards & AI answers"];

// a few of the questions We've Got Answers answers (same wording as there)
const SAMPLE_QUESTIONS = [
  "How much money did Larry lose to mishaps across the whole series?",
  "How much of that is realized, and how much is hypothetical?",
  "Where do the mishaps leave his net worth at the end of the series?",
  "What's the chance of a catastrophic mishap in 2025 or 2026?",
];

export default function Page() {
  return (
    <>
      {/* hero: title and intro now; the art goes in a second column later */}
      <header className="home-hero">
        <div className="home-hero-copy">
          <h1>Curb Mishaps</h1>
          <p className="hero-lede">
            Every financial mishap Larry suffers across 12 seasons of <em>Curb Your Enthusiasm</em> (2000–2024),
            priced and set against Larry David&apos;s real net worth.
          </p>
        </div>
      </header>

      <section className="card build-strip" aria-label="The idea behind it">
        <p className="mission">Define a metric once. Use it everywhere.</p>
        <p className="card-sub">
          Every number on this site is defined once, by name, and read straight from the semantic
          layer, so the dashboard, the answers and any AI asking the data all get the same figure.
          The site itself never does its own math. Get the full story{" "}
          <Link href="/about">here</Link>.
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

      <div className="home-notes">
        <h2 className="questions-lead">We answer questions like:</h2>
        <ul className="sample-questions">
          {SAMPLE_QUESTIONS.map((q) => <li key={q}><Link href="/faq">{q}</Link></li>)}
        </ul>
        <p className="shortcut">
          Explore the data on the first four pages below, or read every answer{" "}
          <Link href="/faq">here</Link>.
        </p>
        <p className="screen-note">
          A few Season 12 episodes are still being reviewed, so the figures may still change.
        </p>
        <p className="screen-note phone-only">
          Best viewed on a desktop or laptop. On a phone, charts scroll sideways.
        </p>
      </div>

      <nav className="explore" aria-label="Explore the dashboard">
        {PAGES.map((p) => (
          <Link key={p.href} href={p.href} className="explore-card">
            <span className="explore-title">{p.label}</span>
            <span className="explore-tagline">{p.tagline}</span>
            <span className="explore-blurb">{p.blurb}</span>
          </Link>
        ))}
      </nav>

    </>
  );
}
