// Tab 4: Forecast. If the show had kept going, one season a year after 2024, through 2026.

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import Forecast from "@/components/views/Forecast";

export const metadata: Metadata = pageMetadata(
  "/forecast",
  "Forecast",
  "What two more seasons of Curb Your Enthusiasm, in 2025 and 2026, would likely have cost Larry, and how we worked it out.",
);

export default function Page() {
  return <Forecast />;
}
