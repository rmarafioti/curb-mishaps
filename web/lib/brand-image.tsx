// Shared pieces for the images Next generates at build time (favicon, Apple touch icon,
// link preview card): the Libre Franklin files and the yellow "C" mark. These images are
// drawn by next/og, which needs static .ttf files (next/font's woff2 won't do), so the two
// heavy weights are kept in assets/fonts (SIL Open Font License).

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BRAND } from "@/lib/site";

// read once at module scope (the files never change), so the images render at build time
const fontFile = (weight: 800 | 900) =>
  readFile(join(process.cwd(), "assets/fonts", `LibreFranklin-${weight}.ttf`));
const [extraBold, black] = await Promise.all([fontFile(800), fontFile(900)]);

/** Libre Franklin 800 and 900, in the shape next/og's `fonts` option expects */
export const BRAND_FONTS = [
  { name: "Libre Franklin", data: extraBold, weight: 800 as const, style: "normal" as const },
  { name: "Libre Franklin", data: black, weight: 900 as const, style: "normal" as const },
];

/**
 * The site mark: a Curb-yellow "C" on the navy, filling a square of `size` px. Rounded for
 * the favicon; square for the Apple icon, since iOS rounds the corners itself.
 */
export function BrandMark({ size, rounded = true }: { size: number; rounded?: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND.navy,
        borderRadius: rounded ? size * 0.2 : 0,
        color: BRAND.yellow,
        fontFamily: "Libre Franklin",
        fontWeight: 900,
        fontSize: size * 0.82,
        lineHeight: 1,
        paddingBottom: size * 0.04, // the cap sits a touch high in its line box
      }}
    >
      C
    </div>
  );
}
