// The pages (tabs) and the filters each one offers. A plain module (not "use client") so
// server pages like the home page can read it. The home page ("/") is the brand link in
// the navbar, not a tab; it lists these as cards (tagline is the card's opening line in
// LD's voice, blurb says what's inside).

import type { FilterDim } from "@/lib/data";

type Page = {
  href: string;
  label: string;
  filters: FilterDim[];
  tagline: string;
  blurb: string;
};

export const PAGES: Page[] = [
  { href: "/costs-by-season", label: "Mishap Costs by Season", filters: ["episode__season", "mishap__loss_kind"],
    tagline: "What's the damage?!",
    blurb: "Every mishap on a timeline, the total bill, and the full list." },
  { href: "/top-10", label: "Top 10 Disasters", filters: ["episode__season", "mishap__loss_kind"],
    tagline: "The biggest losers.",
    blurb: "The ten most expensive mishaps, and how each was priced." },
  { href: "/net-worth", label: "Net Worth vs. Mishaps", filters: ["episode__season"],
    tagline: "Who's the real LD?",
    blurb: "His real net worth against what he'd have if the mishaps were real." },
  { href: "/forecast", label: "Forecast", filters: [],
    tagline: "LD's future flops.",
    blurb: "What two more seasons would likely have cost him." },
  { href: "/faq", label: "We've Got Answers", filters: [],
    tagline: "Let me ask you a question…",
    blurb: "The facts, answered plainly." },
  { href: "/about", label: "About", filters: [],
    tagline: "This project is pretty, pretty, pretty bonkers.",
    blurb: "Here's the how and the why." },
];
