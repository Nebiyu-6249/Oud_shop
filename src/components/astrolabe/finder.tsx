"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Flacon } from "@/components/flacon/flacon";
import type { FlaconParams } from "@/lib/flacon";
import {
  type Candidate,
  type Family,
  INTENSITIES,
  WEAR_CHOICES,
  WHEEL,
  findFragrances,
} from "@/lib/finder";
import { formatAED } from "@/lib/money";
import { AstrolabeView } from "./astrolabe-view";
import { DragSurface } from "./drag-surface";
import { type RingId, markAngle } from "./geometry";
import { Mechanism } from "./mechanism";
import { type AstrolabeLabels, buildModel } from "./model";
import { RingControls } from "./ring-controls";
import { useReducedMotion } from "./use-reduced-motion";

export type FinderFragrance = Candidate & {
  name: string;
  realmName: string;
  formLabel: string;
  fromFils: number;
  flaconParams: FlaconParams;
  /** Which of the 12 limb marks is this fragrance's. */
  mark: number;
};

const SIZES = { rete: WHEEL.length, wear: WEAR_CHOICES.length, plate: INTENSITIES.length } as const;
const STEP = { rete: 360 / SIZES.rete, wear: 360 / SIZES.wear, plate: 360 / SIZES.plate } as const;

/** Ring rotation that brings detent i under the index. */
const ringTarget = (ring: RingId, i: number) => -i * STEP[ring];
/** Rule rotation that points at a limb mark. */
const ruleTarget = (mark: number) => markAngle(mark) + 90;

export function Finder({
  fragrances,
  labels,
  locale,
  initial = { family: "AMBER", wear: "ANY", intensity: 3 },
}: {
  fragrances: FinderFragrance[];
  labels: AstrolabeLabels;
  locale: string;
  initial?: { family: Family; wear: (typeof WEAR_CHOICES)[number]; intensity: number };
}) {
  const t = useTranslations("Finder");
  const reduced = useReducedMotion();
  const model = useMemo(() => buildModel(labels), [labels]);

  const [idx, setIdx] = useState({
    rete: WHEEL.indexOf(initial.family),
    wear: WEAR_CHOICES.indexOf(initial.wear),
    plate: initial.intensity - 1,
  });

  const mech = useMemo(() => {
    const m = new Mechanism();
    m.channels.rete.value = ringTarget("rete", idx.rete);
    m.channels.wear.value = ringTarget("wear", idx.wear);
    m.channels.plate.value = ringTarget("plate", idx.plate);
    return m;
    // the mechanism is created once; later changes drive it imperatively
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const input = { family: WHEEL[idx.rete], wear: WEAR_CHOICES[idx.wear], intensity: INTENSITIES[idx.plate] };
  const result = useMemo(
    () => findFragrances(input, fragrances),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx.rete, idx.wear, idx.plate, fragrances],
  );
  const picks = result.picks;
  const highlights = picks.map((p, i) => ({ mark: p.fragrance.mark, rank: i }));
  const pickKey = picks.map((p) => p.fragrance.slug).join(",");

  const select = useCallback(
    (ring: RingId, i: number) => {
      setIdx((prev) => ({ ...prev, [ring]: i }));
      mech.channels[ring].settle(ringTarget(ring, i), reduced);
      mech.wake();
    },
    [mech, reduced],
  );

  const onRelease = useCallback(
    (ring: RingId, value: number) => {
      const n = SIZES[ring];
      const i = ((Math.round(-value / STEP[ring]) % n) + n) % n;
      select(ring, i);
    },
    [select],
  );

  // The rule sweeps across the three picks and comes to rest on the first.
  const first = useRef(true);
  useEffect(() => {
    const marks = pickKey ? picks.map((p) => p.fragrance.mark) : [];
    if (marks.length === 0) return;
    if (first.current) {
      first.current = false;
      mech.channels.rule.settle(ruleTarget(marks[0]), true);
    } else {
      mech.channels.rule.sweep([...marks].reverse().map(ruleTarget), reduced);
    }
    mech.wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickKey, mech, reduced]);

  // Announce the picks once the visitor stops turning.
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const names = picks.map((p) => p.fragrance.name);
    const id = setTimeout(
      () => setAnnouncement(t(result.closest ? "liveClosest" : "live", { first: names[0], second: names[1], third: names[2] })),
      600,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickKey, result.closest]);

  const rings = [
    { id: "rete" as const, label: t("ringFamily"), options: labels.families },
    { id: "wear" as const, label: t("ringWear"), options: labels.wear },
    { id: "plate" as const, label: t("ringIntensity"), options: INTENSITIES.map((n) => new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en").format(n)) },
  ];

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div
        role="img"
        aria-label={t("astrolabeLabel", {
          family: labels.families[idx.rete],
          wear: labels.wear[idx.wear],
          intensity: idx.plate + 1,
        })}
        className="relative mx-auto aspect-square w-full max-w-[40rem]"
      >
        <AstrolabeView model={model} mech={mech} highlights={highlights} webgl="now" reduced={reduced} />
        <DragSurface mech={mech} onRelease={onRelease} />
      </div>

      <div>
        <p className="mb-4 text-base text-realm-ink/70">{t("hint")}</p>
        <RingControls
          back={t("turnBack")}
          forward={t("turnOn")}
          rings={rings.map((r) => ({ ...r, index: idx[r.id], onChange: (i: number) => select(r.id, i) }))}
        />

        <section aria-labelledby="picks" className="mt-10">
          <h2 id="picks" className="font-display text-2xl text-realm-accent">
            {result.closest ? t("closestTitle") : t("resultsTitle")}
          </h2>
          {result.closest && <p className="mt-2 text-base text-realm-ink/75">{t("closestBody")}</p>}
          <ol className="mt-4">
            {picks.map((p, i) => {
              const f = p.fragrance;
              return (
                <li key={f.slug} className="rule border-t last:border-b">
                  <Link href={`/fragrance/${f.slug}`} className="group grid grid-cols-[auto_4.5rem_1fr] items-center gap-4 py-3">
                    <span className="font-display w-6 text-center text-xl text-realm-glow" aria-hidden>
                      {new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en").format(i + 1)}
                    </span>
                    <Flacon
                      params={f.flaconParams}
                      id={`pick-${f.slug}`}
                      label=""
                      className="h-24 w-auto text-realm-accent"
                    />
                    <span>
                      <span className="font-display block text-xl group-hover:text-realm-accent">
                        <span className="sr-only">{t("rank", { rank: i + 1 })} </span>
                        {f.name}
                      </span>
                      <span className="block text-base text-realm-ink/70">
                        {f.realmName}, {f.formLabel}, {t("from", { price: formatAED(f.fromFils, locale) })}
                      </span>
                      <span className="block text-sm text-realm-ink/60">
                        {t(`family_${p.family}`)}
                        {", "}
                        {p.wearMatch ? t("wearYes") : t("wearNo")}
                        {", "}
                        {p.intensityDistance === 0 ? t("intensityExact") : t("intensityOff", { n: p.intensityDistance })}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </div>
  );
}
