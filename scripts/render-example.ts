/**
 * Renders the bundled example plan into `.render-out/` so you can read the
 * real output with your own eyes.
 *
 *   npm run render:example
 *   npm run render:example -- ko
 *
 * This is a look-at-it helper, not the CLI. Writing into a user's project is
 * a separate job with separate care (M2).
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { type Locale, localeSchema, parsePlan } from "../src/core/schema.js";
import { renderAll } from "../src/render/index.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outDir = join(root, ".render-out");

const requested = process.argv[2];
const locale: Locale | undefined = requested ? localeSchema.parse(requested) : undefined;

const raw = JSON.parse(readFileSync(join(root, "examples/marketplace.plan.json"), "utf8"));
const plan = parsePlan(locale ? { ...raw, meta: { ...raw.meta, locale } } : raw);

rmSync(outDir, { recursive: true, force: true });

const files = renderAll(plan);
for (const file of files) {
  const target = join(outDir, file.path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, file.content, "utf8");
}

console.log(`${files.length} files -> ${outDir} (locale: ${plan.meta.locale})`);
for (const file of files) console.log(`  ${file.path}`);
