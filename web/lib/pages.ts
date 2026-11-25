// The pages (tabs) and the filters each one offers. A plain module (not "use client") so
// server pages can read it (the sitemap lists these). The home page ("/") is the brand link
// in the navbar, not a tab.

import { FORECAST_DIM, type PageFilterDim } from "@/lib/data";

type Page = {
  href: string;
  label: string;
  filters: PageFilterDim[];
};

export const PAGES: Page[] = [
  { href: "/costs-by-season", label: "Mishap Costs by Season", filters: ["episode__season", "mishap__loss_kind", "mishap__is_catastrophic"] },
  { href: "/top-10", label: "Top 10 Disasters", filters: ["episode__season", "mishap__loss_kind", "mishap__is_catastrophic"] },
  { href: "/net-worth", label: "Net Worth vs. Mishaps", filters: ["episode__season"] },
  { href: "/future-flops", label: "Future Flops", filters: [FORECAST_DIM] },
  { href: "/answers", label: "Pretty Good Answers", filters: [] },
  { href: "/about", label: "About", filters: [] },
];
