// Forecast tab (placeholder until the forecast is built): if the show had kept going, one
// season a year after 2024, through 2026.

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forecast 2025–2026 · Curb Mishaps" };

export default function Page() {
  return (
    <>
      <header className="masthead">
        <h1>If the show had kept going…</h1>
        <p className="lede">
          What two more seasons, one a year after 2024, would likely have cost him: Season 13 in
          2025 and Season 14 in 2026.
        </p>
      </header>

      <section className="card placeholder prose">
        <h2>Coming once every episode has been reviewed</h2>
        <p>The forecast follows three trends across the 12 real seasons:</p>
        <ul>
          <li><strong>How often:</strong> mishaps per episode, season by season.</li>
          <li><strong>How costly:</strong> the typical everyday mishap, with inflation taken out so rising prices don&apos;t pass for a trend.</li>
          <li><strong>How catastrophic:</strong> the chance of a divorce-sized disaster in any one season.</li>
        </ul>
        <p>
          Each forecast season gets an expected bill with a range, priced in the dollars of the year
          it would have aired, using the real price index for 2025 and 2026. The real show took
          breaks between seasons; one season a year is the what-if.
        </p>
      </section>
    </>
  );
}
