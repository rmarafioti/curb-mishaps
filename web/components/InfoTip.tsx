"use client";

// A small "i" that explains a term. A mouse opens it on hover; a tap (phones have no hover)
// toggles it; keyboard focus opens it. Escape, tabbing away or tapping elsewhere closes it.
// The box drops below the nearest positioned card (.tile) at the card's width, so it never
// runs off a narrow screen.

import { useEffect, useId, useRef, useState } from "react";

export default function InfoTip({ term, children }: { term: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);

  // a tap or click anywhere outside closes it
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  // The input that started the click, read from pointerdown. A click event can't be trusted for
  // this: iPhone Safari reports a tap's click as pointerType "mouse", which hid the box on phones.
  // A click with no pointerdown before it (Enter / Space) leaves this null and toggles too.
  const downType = useRef<string | null>(null);

  const isMouse = (e: React.PointerEvent) => e.pointerType === "mouse";

  return (
    <span
      ref={root}
      className="infotip"
      onPointerEnter={(e) => isMouse(e) && setOpen(true)}
      onPointerLeave={(e) => isMouse(e) && setOpen(false)}
    >
      <button
        type="button"
        className="infotip-button"
        aria-label={`What does ${term} mean?`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onPointerDown={(e) => (downType.current = e.pointerType)}
        onClick={() => {
          // a mouse already opened it on hover; a tap or a key toggles it
          if (downType.current !== "mouse") setOpen((o) => !o);
          downType.current = null;
        }}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        i
      </button>
      {open && <span role="tooltip" id={id} className="infotip-box">{children}</span>}
    </span>
  );
}
