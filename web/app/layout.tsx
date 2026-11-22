import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { dateOf, kpis } from "@/lib/data";
import { FiltersProvider } from "@/lib/filters";
import "./globals.css";

// Libre Franklin: an open-source revival of Franklin Gothic, the Curb title-card face. Only
// the heavy weights, for headings and KPI figures; body, tables and charts stay system sans.
// next/font downloads it at build time and serves it from this site.
const display = Libre_Franklin({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Curb Mishaps",
  description:
    "What Larry David's on-screen mishaps cost him across 12 seasons of Curb Your Enthusiasm, against his real net worth.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={display.variable}>
      <body>
        <FiltersProvider>
          <SiteHeader />
          <main className="page">
            {children}
            <footer className="footer">
              <span>
                Data exported from {kpis.source} on {dateOf(kpis.exported_at)}. Amounts are in the
                dollars of the year each episode aired; estimates use the mid of a researched range.
              </span>
              <span>Best viewed on a desktop or laptop, since the charts are wide.</span>
            </footer>
          </main>
        </FiltersProvider>
      </body>
    </html>
  );
}
