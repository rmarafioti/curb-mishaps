// sitemap.xml: the home page and every tab in PAGES, so a new tab is listed automatically.
// lastModified is the data export date, the last time any figure on the site changed.

import type { MetadataRoute } from "next";
import { kpis } from "@/lib/data";
import { PAGES } from "@/lib/pages";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(kpis.exported_at);
  return [
    { url: SITE_URL, lastModified, priority: 1 },
    ...PAGES.map((page) => ({ url: `${SITE_URL}${page.href}`, lastModified, priority: 0.8 })),
  ];
}
