#!/usr/bin/env node
// Fails the build on any emoji or blocklisted term in shipped source and content.
// Usage: node scripts/check-content.mjs [dir ...]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_DIRS = ["src", "prisma", "messages"];
const SKIP_DIRS = new Set(["node_modules", ".next", "generated"]);
const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".md", ".mdx",
  ".prisma", ".sql", ".svg", ".html", ".txt", ".glsl", ".frag", ".vert",
]);

// Extended_Pictographic covers emoji and pictographs; regional indicators make
// flags; U+FE0F forces emoji presentation; U+20E3 builds keycaps.
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{20E3}]/gu;

export function loadTerms(path = join(ROOT, "scripts", "content-blocklist.json")) {
  return JSON.parse(readFileSync(path, "utf8")).terms;
}

export function termPattern(term) {
  const escaped = term
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Accept a straight or curly apostrophe wherever the term has one.
    .replace(/'/g, "['’]");
  // Whole word: not preceded or followed by a letter, digit or underscore.
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "gu");
}

export function scanText(text, patterns) {
  const hits = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(EMOJI)) {
      const cp = m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
      hits.push({ line: i + 1, col: m.index + 1, kind: "emoji", match: `U+${cp}` });
    }
    for (const { term, re } of patterns) {
      re.lastIndex = 0;
      for (const m of line.matchAll(re)) {
        hits.push({ line: i + 1, col: m.index + 1, kind: "blocklist", match: term });
      }
    }
  });
  return hits;
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) yield* walk(full);
    } else if (TEXT_EXT.has(extname(name))) {
      yield full;
    }
  }
}

function main() {
  const dirs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_DIRS;
  const patterns = loadTerms().map((term) => ({ term, re: termPattern(term) }));
  let files = 0;
  const failures = [];
  for (const dir of dirs) {
    for (const file of walk(resolve(ROOT, dir))) {
      files++;
      for (const hit of scanText(readFileSync(file, "utf8"), patterns)) {
        failures.push(`${relative(ROOT, file)}:${hit.line}:${hit.col}  ${hit.kind}  ${hit.match}`);
      }
    }
  }
  if (failures.length) {
    console.error(`check:content failed with ${failures.length} problem(s):`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`check:content passed (${files} files in ${dirs.join(", ")}).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
