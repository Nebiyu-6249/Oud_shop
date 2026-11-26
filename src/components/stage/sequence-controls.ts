// Home-page sequence behaviour that sits on top of the scrub: engraved
// overlay reveals, gentle snapping to beat labels, and keyboard stepping.

import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextType } from "gsap/SplitText";
import type Lenis from "lenis";
import { BEATS, type BeatLabel, labelAt, stepLabel } from "@/lib/sequence";

/**
 * Builds a paused timeline, one unit long, in which each beat's title is
 * engraved letter by letter (word by word in Arabic, whose letters must stay
 * joined) and its line follows word by word. Driven with the master
 * timeline's progress, so it scrubs and reverses with it.
 */
export function buildOverlayTimeline(gsap: typeof Gsap, SplitText: typeof SplitTextType, root: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  const splits: SplitTextType[] = [];
  const arabic = document.documentElement.lang === "ar";
  for (const beat of root.querySelectorAll<HTMLElement>("[data-beat]")) {
    if (beat.dataset.beat === "rim") continue;
    const a = Number(beat.dataset.a);
    const title = beat.querySelector<HTMLElement>("[data-engrave]");
    const line = beat.querySelector<HTMLElement>("[data-engrave-line]");
    if (title) {
      // words first, so letters never wrap apart
      const split = SplitText.create(title, { type: arabic ? "words" : "words,chars", aria: "auto" });
      splits.push(split);
      const parts = arabic ? split.words : split.chars;
      // each letter cuts in bright, then cools to the engraved colour
      tl.fromTo(
        parts,
        { opacity: 0, color: "#fff1cf" },
        { opacity: 1, color: "", duration: 0.008, stagger: 0.022 / Math.max(1, parts.length), ease: "none" },
        a + 0.004,
      );
    }
    if (line) {
      const split = SplitText.create(line, { type: "words", aria: "none" });
      splits.push(split);
      tl.fromTo(split.words, { opacity: 0 }, { opacity: 1, duration: 0.006, stagger: 0.02 / Math.max(1, split.words.length), ease: "none" }, a + 0.02);
    }
  }
  // keep the timeline exactly one unit long so progress maps one to one
  tl.set({}, {}, 1);
  return {
    timeline: tl,
    revert: () => {
      tl.kill();
      for (const s of splits) s.revert();
    },
  };
}

/** Scroll position of a label within the sequence's trigger. */
export const labelScroll = (trigger: ST, label: BeatLabel) => trigger.start + (trigger.end - trigger.start) * labelAt(label);

/**
 * When scrolling comes to rest near a beat, ease onto its label. Only after
 * the visitor has stopped, and only nearby, so it never fights the scroll.
 */
export function attachSnap(lenis: Lenis, trigger: ST, reduced: () => boolean) {
  let timer = 0;
  const onScroll = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!trigger.isActive) return;
      const p = trigger.progress;
      const nearest = BEATS.reduce((best, b) => (Math.abs(b.at - p) < Math.abs(best.at - p) ? b : best));
      if (Math.abs(nearest.at - p) > 0.06 || Math.abs(nearest.at - p) < 0.002) return;
      lenis.scrollTo(labelScroll(trigger, nearest.label), {
        duration: reduced() ? 0 : 0.9,
        easing: (t: number) => 1 - (1 - t) ** 3,
      });
    }, 220);
  };
  lenis.on("scroll", onScroll);
  return () => {
    window.clearTimeout(timer);
    lenis.off("scroll", onScroll);
  };
}

/** Arrow keys and Page Up/Down step beat to beat while the sequence is on screen. */
export function attachKeys(lenis: Lenis, trigger: ST, reduced: () => boolean) {
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target as HTMLElement | null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.getAttribute("role") === "slider")) return;
    const dir = e.key === "ArrowDown" || e.key === "PageDown" ? 1 : e.key === "ArrowUp" || e.key === "PageUp" ? -1 : 0;
    if (!dir) return;
    const y = window.scrollY;
    // anywhere from the top of the page (the header sits above the section) to its end
    if (y > trigger.end + 2) return;
    // at the last beat, Page Down leaves the sequence for the page below
    if (dir > 0 && trigger.progress >= 0.999) return;
    e.preventDefault();
    const label = stepLabel(trigger.progress, dir);
    lenis.scrollTo(labelScroll(trigger, label), { duration: reduced() ? 0 : 1.1, easing: (t: number) => 1 - (1 - t) ** 3 });
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}
