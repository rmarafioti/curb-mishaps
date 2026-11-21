"use client";

// The pages (tabs), the filters each one offers, and the filter state the navbar and the
// page share. Filters reset whenever the route changes: each view starts unfiltered.

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { type FilterDim, type Filters, NO_FILTERS } from "@/lib/data";

export const PAGES: { href: string; label: string; filters: FilterDim[] }[] = [
  { href: "/", label: "Mishap Costs by Season", filters: ["episode__season", "mishap__loss_kind"] },
  { href: "/top-10", label: "Top 10 Disasters", filters: ["episode__season", "mishap__loss_kind"] },
  { href: "/net-worth", label: "Net Worth to Mishaps by Year", filters: ["episode__season"] },
  { href: "/forecast", label: "Forecast 2025–2026", filters: [] },
  { href: "/about", label: "About", filters: [] },
];

type FilterState = { filters: Filters; setFilters: (filters: Filters) => void };
const FilterContext = createContext<FilterState>({ filters: NO_FILTERS, setFilters: () => {} });

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // filters remember the page they were set on; on any other page they read as unset
  const [state, setState] = useState({ path: pathname, filters: NO_FILTERS });
  const filters = state.path === pathname ? state.filters : NO_FILTERS;
  const setFilters = (next: Filters) => setState({ path: pathname, filters: next });
  return <FilterContext.Provider value={{ filters, setFilters }}>{children}</FilterContext.Provider>;
}

export const useFilters = () => useContext(FilterContext);
