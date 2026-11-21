// Home: what the project is, and a way into each tab.

import Link from "next/link";
import { PAGES } from "@/lib/pages";

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

      <p className="screen-note phone-only">
        Best viewed on a desktop or laptop. On a phone, charts scroll sideways.
      </p>

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
