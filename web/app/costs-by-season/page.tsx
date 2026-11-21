// Tab 1: Mishap Costs by Season.

import type { Metadata } from "next";
import CostsBySeason from "@/components/views/CostsBySeason";

export const metadata: Metadata = { title: "Mishap Costs by Season · Curb Mishaps" };

export default function Page() {
  return <CostsBySeason />;
}
