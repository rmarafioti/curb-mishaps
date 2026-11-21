// Tab 3: Net Worth to Mishaps by Year.

import type { Metadata } from "next";
import NetWorthByYear from "@/components/views/NetWorthByYear";

export const metadata: Metadata = { title: "Net Worth to Mishaps by Year · Curb Mishaps" };

export default function Page() {
  return <NetWorthByYear />;
}
