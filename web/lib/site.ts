// Where the site lives and how it describes itself to search engines and link previews.
// SITE_URL is the one place the address is set: the canonical links, sitemap, robots file
// and preview cards all follow it. The apex domain is primary; Vercel redirects www to it.

import type { Metadata } from "next";

export const SITE_URL = "https://curbmishaps.com";
export const SITE_NAME = "Curb Mishaps";
export const SITE_DESCRIPTION =
  "What Larry David's on-screen mishaps cost him across 12 seasons of Curb Your Enthusiasm, set against his real net worth. A dbt semantic layer project.";

export const AUTHOR = {
  name: "Rich Marafioti",
  linkedin: "https://www.linkedin.com/in/richmarafioti/",
  github: "https://github.com/rmarafioti",
};

// Generated images (favicon, preview card) can't read CSS variables, so these repeat the
// tokens at the top of app/globals.css. Keep them in step.
export const BRAND = {
  navy: "#0b1f33",     // --page
  surface: "#13283c",  // --surface
  yellow: "#f5c400",   // --heading
  ink: "#eef5fa",      // --ink
  inkSecondary: "#b7c9d8", // --ink-secondary
};

/** The preview card drawn by app/opengraph-image.tsx */
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}, what Larry David's on-screen mishaps cost him across 12 seasons of Curb Your Enthusiasm`,
};

/**
 * A page's metadata: its title (the layout adds " · Curb Mishaps"), description, canonical
 * address, and the same title and description for link previews. A page that sets its own
 * openGraph loses the card Next adds from app/opengraph-image.tsx, so it's named here.
 */
export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: [OG_IMAGE] },
  };
}
