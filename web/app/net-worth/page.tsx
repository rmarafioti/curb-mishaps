// Tab 3: Net Worth vs. Mishaps.

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import NetWorthByYear from "@/components/views/NetWorthByYear";

export const metadata: Metadata = pageMetadata(
  "/net-worth",
  "Net Worth vs. Mishaps",
  "Larry David's real net worth from 2000 to 2024, against what he'd have left if every on-screen mishap came out of it.",
);

export default function Page() {
  return <NetWorthByYear />;
}
