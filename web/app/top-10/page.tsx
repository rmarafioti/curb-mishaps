// Tab 2: Top 10 Disasters.

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import TopDisasters from "@/components/views/TopDisasters";

export const metadata: Metadata = pageMetadata(
  "/top-10",
  "Top 10 Disasters",
  "The ten most expensive mishaps across 12 seasons of Curb Your Enthusiasm, and how each one was priced.",
);

export default function Page() {
  return <TopDisasters />;
}
