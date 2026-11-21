// Tab 2: Top 10 Disasters.

import type { Metadata } from "next";
import TopDisasters from "@/components/views/TopDisasters";

export const metadata: Metadata = { title: "Top 10 Disasters · Curb Mishaps" };

export default function Page() {
  return <TopDisasters />;
}
