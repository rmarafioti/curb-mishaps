"use client";

// The navbar: two rows. The tabs row collapses when scrolling down and comes back when
// scrolling up; the filter row (the current page's filters) always stays.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NO_FILTERS, isFiltered, titleCase } from "@/lib/data";
import { PAGES, useFilters } from "@/lib/filters";

const SEASONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const KINDS = ["realized", "hypothetical"];

export default function SiteHeader() {
  const pathname = usePathname();
  const page = PAGES.find((p) => p.href === pathname) ?? PAGES[0];
  const { filters, setFilters } = useFilters();
  const [collapsed, setCollapsed] = useState(false);
  const [size, setSize] = useState({ header: 0, tabs: 0 });
  const headerRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);

  // The header is fixed and slides up by the tabs row's height to collapse, so the page
  // under it never moves (shrinking it in place shifted the page and fought the scroll).
  // Measure both heights; a spacer of the full height keeps the page clear of it.
  useEffect(() => {
    const measure = () =>
      setSize({ header: headerRef.current?.offsetHeight ?? 0, tabs: tabsRef.current?.offsetHeight ?? 0 });
    measure();
    const observer = new ResizeObserver(measure);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < 6) return; // ignore trackpad jitter
      if (y < size.tabs) setCollapsed(false); // near the top: always open
      else setCollapsed(delta > 0);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [size.tabs]);

  return (
    <>
      <div aria-hidden="true" className="header-spacer" style={size.header ? { height: size.header } : undefined} />
      <header
        ref={headerRef}
        className="site-header"
        style={{ transform: collapsed ? `translateY(-${size.tabs}px)` : "none" }}
      >
        <div ref={tabsRef} className="tabs-row">
          <nav className="tabs" aria-label="Dashboard pages">
            <span className="brand">Curb Mishaps</span>
            {PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="tab" aria-current={p.href === page.href ? "page" : undefined}>
                {p.label}
              </Link>
            ))}
          </nav>
        </div>

        {page.filters.length > 0 && (
          <div className="filter-row" aria-label="Filters">
            {page.filters.includes("episode__season") && (
              <label>
                Season
                <select value={filters.episode__season}
                        onChange={(e) => setFilters({ ...filters, episode__season: e.target.value })}>
                  <option value="">All seasons</option>
                  {SEASONS.map((s) => <option key={s} value={s}>Season {s}</option>)}
                </select>
              </label>
            )}
            {page.filters.includes("mishap__loss_kind") && (
              <label>
                Loss kind
                <select value={filters.mishap__loss_kind}
                        onChange={(e) => setFilters({ ...filters, mishap__loss_kind: e.target.value })}>
                  <option value="">Realized and hypothetical</option>
                  {KINDS.map((kind) => <option key={kind} value={kind}>{titleCase(kind)}</option>)}
                </select>
              </label>
            )}
            {isFiltered(filters) && (
              <button type="button" className="clear" onClick={() => setFilters(NO_FILTERS)}>Clear filters</button>
            )}
          </div>
        )}
      </header>
    </>
  );
}
