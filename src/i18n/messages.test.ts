import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

type Tree = { [k: string]: string | Tree };

function flatten(t: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(t)) {
    if (k.startsWith("_")) continue; // review notes, not messages
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

/** Top-level ICU arguments: {name}, {count, plural, ...}. Nested plural text is ignored. */
function args(msg: string): string[] {
  const found = new Set<string>();
  let depth = 0;
  for (let i = 0; i < msg.length; i++) {
    if (msg[i] === "{") {
      if (depth === 0) {
        const m = /^\{\s*([A-Za-z0-9_]+)/.exec(msg.slice(i));
        if (m) found.add(m[1]);
      }
      depth++;
    } else if (msg[i] === "}") depth--;
  }
  return [...found].sort();
}

const EN = flatten(en as Tree);
const AR = flatten(ar as Tree);

describe("messages", () => {
  it("has the same keys in English and Arabic", () => {
    expect(Object.keys(AR).sort()).toEqual(Object.keys(EN).sort());
  });

  it("uses the same arguments in both languages", () => {
    for (const key of Object.keys(EN)) expect(args(AR[key] ?? ""), key).toEqual(args(EN[key]));
  });

  it("marks the Arabic file as a draft for native review", () => {
    expect((ar as Tree)._review).toMatch(/native/i);
  });

  it("leaves no Arabic string empty or still in English", () => {
    const latinOnly = /^[\x20-\x7E]+$/;
    // Brand names and card numbers may stay Latin inside Arabic sentences,
    // but no Arabic message should be entirely ASCII.
    const allowed = new Set(["Site.switchLocale"]);
    for (const [key, value] of Object.entries(AR)) {
      if (allowed.has(key)) continue;
      expect(value.trim(), key).not.toBe("");
      expect(latinOnly.test(value.replace(/\{[^}]*\}/g, "").trim() || "x") && !/^\{/.test(value), key).toBe(false);
    }
  });
});
