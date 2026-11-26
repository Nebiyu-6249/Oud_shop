import { getTranslations } from "next-intl/server";
import type { FragranceDetail } from "@/lib/catalog";
import { Ornament } from "@/components/flacon/ornament";

type Props = {
  structure: FragranceDetail["structure"];
  notes: FragranceDetail["notes"];
  locale: string;
};

const WEIGHT_CLASS: Record<number, string> = {
  1: "text-base text-realm-ink/75",
  2: "text-lg",
  3: "text-xl font-semibold",
};

/**
 * A pyramid reads top to base. A chord is one layered band: attars and many
 * ouds are built that way and have no top, heart or base to show.
 */
export async function NotesDisplay({ structure, notes, locale }: Props) {
  const t = await getTranslations("Fragrance");
  const tTier = await getTranslations("Tier");
  const name = (n: Props["notes"][number]) => (locale === "ar" ? n.note.nameAr : n.note.nameEn);

  if (structure === "CHORD") {
    return (
      <div className="mt-4">
        <p className="text-base text-realm-ink/70">{t("chordIntro")}</p>
        <ul className="rule mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-3">
          {notes.map((n) => (
            <li key={n.noteId} className={`flex items-center gap-2 ${WEIGHT_CLASS[n.weight]}`}>
              <Ornament ornamentKey={n.note.ornamentKey} className="h-10 w-10 shrink-0 text-realm-accent" />
              {name(n)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const tiers = (["TOP", "HEART", "BASE"] as const).map((tier) => ({
    tier,
    notes: notes.filter((n) => n.tier === tier),
  }));

  return (
    <dl className="mt-4">
      {tiers.map(({ tier, notes: tierNotes }, i) => (
        <div
          key={tier}
          className="rule grid grid-cols-[5.5rem_1fr] items-center gap-4 border-t py-2 last:border-b"
          style={{ paddingInlineStart: `${i * 1.25}rem` }}
        >
          <dt className="font-display text-sm tracking-[0.2em] text-realm-accent uppercase">
            {tTier(tier)}
          </dt>
          <dd>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {tierNotes.map((n) => (
                <li key={n.noteId} className={`flex items-center gap-2 ${WEIGHT_CLASS[n.weight]}`}>
                  <Ornament ornamentKey={n.note.ornamentKey} className="h-9 w-9 shrink-0 text-realm-accent" />
                  {name(n)}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}
