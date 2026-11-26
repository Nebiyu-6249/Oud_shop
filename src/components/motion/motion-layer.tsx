"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { useReducedMotion } from "@/components/astrolabe/use-reduced-motion";

/**
 * Scroll motion for the whole site, loaded on the visitor's first scroll,
 * pointer, touch or key, so it never competes with the first paint. Two effects:
 *
 * - [data-draw] SVGs (engraved botanicals and flacons) are drawn stroke by
 *   stroke as they scroll into view, like a burin cutting the plate.
 * - [data-reveal="lines"] paragraphs rise line by line out of a mask.
 *
 * Only elements still below the fold are animated, so nothing already on
 * screen ever disappears. With reduced motion none of this runs and every
 * element simply stays as rendered.
 */
export function MotionLayer() {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let revert: (() => void) | undefined;
    let cancelled = false;

    const start = async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);
      const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.9;

      const ctx = gsap.context(() => {
        for (const svg of document.querySelectorAll<SVGSVGElement>("main svg[data-draw]")) {
          if (!below(svg)) continue;
          const paths = svg.querySelectorAll("path[pathLength]");
          gsap.fromTo(
            paths,
            { strokeDasharray: 1, strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 1.9,
              ease: "power2.inOut",
              stagger: { amount: 0.9 },
              scrollTrigger: { trigger: svg, start: "top 88%", once: true },
              onComplete: () => gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" }),
            },
          );
        }
        for (const el of document.querySelectorAll<HTMLElement>("main [data-reveal='lines']")) {
          if (!below(el)) continue;
          // Lines only: splitting Arabic into characters would break the joins.
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            // the paragraph keeps its own text; lines are only wrappers
            aria: "none",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 105,
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.09,
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
              }),
          });
        }
      });
      revert = () => ctx.revert();
    };

    // Wait for the visitor to do something: scrolling is itself the cue, and
    // a page nobody has touched yet does no animation work at all.
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;
    const go = () => {
      for (const e of events) window.removeEventListener(e, go);
      void start();
    };
    for (const e of events) window.addEventListener(e, go, { passive: true, once: true });
    return () => {
      cancelled = true;
      for (const e of events) window.removeEventListener(e, go);
      revert?.();
    };
  }, [pathname, reduced]);

  return null;
}
