"use client";

// The navbar: two rows. The tabs row collapses when scrolling down and comes back when
// scrolling up; the filter row (the current page's filters) always stays. On phones the
// tabs fold into a hamburger menu that opens as a panel under the header.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NO_FILTERS, isFiltered, titleCase } from "@/lib/data";
import { useFilters } from "@/lib/filters";
import { PAGES } from "@/lib/pages";

const SEASONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const KINDS = ["realized", "hypothetical"];

export default function SiteHeader() {
  const pathname = usePathname();
  const page = PAGES.find((p) => p.href === pathname); // undefined on the home page
  const filterDims = page?.filters ?? [];
  const { filters, setFilters } = useFilters();
  const [collapsed, setCollapsed] = useState(false);
  const [size, setSize] = useState({ header: 0, tabs: 0 });
  const headerRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  // phones: the tabs live in a hamburger menu. It remembers the page it was opened on, so
  // any navigation (a tab, the brand, the back button) closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const closeMenu = () => setMenuPath(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuPath(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

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
        style={{ transform: collapsed && !menuOpen ? `translateY(-${size.tabs}px)` : "none" }}
      >
        <div ref={tabsRef} className="tabs-row">
          <nav className="tabs" aria-label="Dashboard pages">
            <Link href="/" className="brand" aria-current={pathname === "/" ? "page" : undefined} onClick={closeMenu}>
              Curb Mishaps
            </Link>
            {/* phones only (CSS): opens the tab list as a panel under the header */}
            <button type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="tab-list"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    onClick={() => setMenuPath(menuOpen ? null : pathname)}>
              <span className="menu-bars" aria-hidden="true" />
            </button>
            <div id="tab-list" className={`tab-list${menuOpen ? " open" : ""}`}>
              {PAGES.map((p) => (
                <Link key={p.href} href={p.href} className="tab" aria-current={p.href === page?.href ? "page" : undefined}
                      onClick={closeMenu}>
                  {p.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {filterDims.length > 0 && (
          <div className="filter-row" aria-label="Filters">
            {filterDims.includes("episode__season") && (
              <label>
                Season
                <select value={filters.episode__season}
                        onChange={(e) => setFilters({ ...filters, episode__season: e.target.value })}>
                  <option value="">All seasons</option>
                  {SEASONS.map((s) => <option key={s} value={s}>Season {s}</option>)}
                </select>
              </label>
            )}
            {filterDims.includes("mishap__loss_kind") && (
              <label>
                Loss kind
                <select value={filters.mishap__loss_kind}
                        onChange={(e) => setFilters({ ...filters, mishap__loss_kind: e.target.value })}>
                  <option value="">All loss kinds</option>
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
