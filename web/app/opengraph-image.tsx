// The link preview card (LinkedIn, Slack, iMessage, X), drawn at build time and used by
// every page. The headline figure is Total Mishap Loss picked from the export, like every
// other number on the site, so the card updates with each data refresh.

import { ImageResponse } from "next/og";
import { BRAND_FONTS } from "@/lib/brand-image";
import { kpis, label, usdFull } from "@/lib/data";
import { BRAND, OG_IMAGE, SITE_NAME } from "@/lib/site";

export const alt = OG_IMAGE.alt;
export const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };
export const contentType = "image/png";

export default function OpengraphImage() {
  const total = kpis.rows[0];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: BRAND.navy,
          color: BRAND.ink,
          fontFamily: "Libre Franklin",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 112, fontWeight: 900, color: BRAND.yellow, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {SITE_NAME}
          </div>
          {/* two lines set by hand so the show's name never splits (the image renderer can't nowrap) */}
          <div style={{ display: "flex", flexDirection: "column", fontSize: 38, fontWeight: 800, lineHeight: 1.25 }}>
            <div>Every financial mishap Larry suffers over</div>
            <div>Curb Your Enthusiasm&apos;s 24 year, 12 season run, priced.</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.inkSecondary }}>
              {`${label(kpis, "total_mishap_loss")}, 2000–2024`}
            </div>
            <div style={{ fontSize: 88, fontWeight: 900, color: BRAND.yellow, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {usdFull(total.total_mishap_loss)}
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.inkSecondary, textAlign: "right", maxWidth: 380 }}>
            Define a metric once, use it everywhere.
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: BRAND_FONTS },
  );
}
