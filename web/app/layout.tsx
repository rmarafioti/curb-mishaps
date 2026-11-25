import type { Metadata, Viewport } from "next";
import { Libre_Franklin } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { kpis, longDateOf } from "@/lib/data";
import { FiltersProvider } from "@/lib/filters";
import { AUTHOR, BRAND, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Libre Franklin: an open-source revival of Franklin Gothic, the Curb title-card face. Only
// the heavy weights, for headings and KPI figures; body, tables and charts stay system sans.
// next/font downloads it at build time and serves it from this site.
const display = Libre_Franklin({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-display" });

// Site-wide metadata. Each page adds its own title (shown as "<title> · Curb Mishaps"),
// description and canonical address via pageMetadata(). The favicon, Apple icon and preview
// card come from app/icon.tsx, app/apple-icon.tsx and app/opengraph-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR.name, url: AUTHOR.linkedin }],
  creator: AUTHOR.name,
  keywords: [
    "Curb Your Enthusiasm", "Larry David", "dbt", "semantic layer", "MetricFlow", "BigQuery",
    "analytics engineering", "data visualization",
  ],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, url: "/", title: SITE_NAME, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = { themeColor: BRAND.navy };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={display.variable}>
      <body>
        <FiltersProvider>
          <SiteHeader />
          <main className="page">
            {children}
            <footer className="footer">
              <span>Updated {longDateOf(kpis.exported_at)}.</span>
              <span>Best viewed on a desktop or laptop, since the charts are wide.</span>
            </footer>
          </main>
        </FiltersProvider>
      </body>
    </html>
  );
}
