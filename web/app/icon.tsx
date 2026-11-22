// The favicon: the site mark (a yellow "C" on navy), drawn at build time.

import { ImageResponse } from "next/og";
import { BrandMark, BRAND_FONTS } from "@/lib/brand-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandMark size={size.width} />, { ...size, fonts: BRAND_FONTS });
}
