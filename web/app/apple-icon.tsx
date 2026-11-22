// The home-screen icon for iPhones and iPads: the same mark as the favicon, at 180px.

import { ImageResponse } from "next/og";
import { BrandMark, BRAND_FONTS } from "@/lib/brand-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandMark size={size.width} rounded={false} />, { ...size, fonts: BRAND_FONTS });
}
