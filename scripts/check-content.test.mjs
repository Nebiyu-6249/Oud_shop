import { describe, expect, it } from "vitest";
import { loadTerms, scanText, termPattern } from "./check-content.mjs";

const patterns = loadTerms().map((term) => ({ term, re: termPattern(term) }));
const kinds = (text) => scanText(text, patterns).map((h) => `${h.kind}:${h.match}`);

describe("check-content", () => {
  it("flags blocklisted terms as whole words", () => {
    expect(kinds("a house called Stark")).toEqual(["blocklist:Stark"]);
    expect(kinds("King's Landing")).toEqual(["blocklist:King's Landing"]);
    expect(kinds("King’s Landing")).toEqual(["blocklist:King's Landing"]);
  });

  it("is case-sensitive and ignores substrings", () => {
    expect(kinds("a stark contrast")).toEqual([]);
    expect(kinds("Starkly lit")).toEqual([]);
    expect(kinds("Dornes")).toEqual([]);
  });

  it("flags emoji, flags and presentation selectors", () => {
    expect(kinds("hello \u{1F525}")).toEqual(["emoji:U+1F525"]);
    expect(kinds("\u{1F1E6}\u{1F1EA}")).toEqual(["emoji:U+1F1E6", "emoji:U+1F1EA"]);
    expect(kinds("❤️")).toEqual(["emoji:U+2764", "emoji:U+FE0F"]);
  });

  it("leaves Arabic and typographic text alone", () => {
    expect(kinds("أتون الجمر، عود وعطور")).toEqual([]);
    expect(kinds("1,150 AED, 5% VAT, top / heart / base")).toEqual([]);
  });
});
