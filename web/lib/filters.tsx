"use client";

// The filter state the navbar and the page share (the pages and their filters are in
// lib/pages.ts). Filters reset whenever the route changes: each view starts unfiltered.

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { type Filters, NO_FILTERS } from "@/lib/data";

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
