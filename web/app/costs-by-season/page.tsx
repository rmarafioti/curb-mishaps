// Tab 1: Mishap Costs by Season.

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import CostsBySeason from "@/components/views/CostsBySeason";

export const metadata: Metadata = pageMetadata(
  "/costs-by-season",
  "Mishap Costs by Season",
  "Every financial mishap Larry suffers on Curb Your Enthusiasm, on a timeline and season by season, with the total bill.",
);

export default function Page() {
  return <CostsBySeason />;
}
