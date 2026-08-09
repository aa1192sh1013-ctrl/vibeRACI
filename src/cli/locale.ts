/**
 * Which language the command line speaks.
 *
 * A Korean beginner should not have to discover a flag to be spoken to in
 * Korean, so the operating system's own setting is the default. An explicit
 * --lang always wins, and anything unrecognised falls back to English rather
 * than failing -- being addressed in the wrong language is a small annoyance,
 * while an error before the tool even starts is a dead end.
 */
import { type Locale, localeSchema } from "../core/schema.js";

export function resolveLocale(explicit?: string | true): Locale {
  if (typeof explicit === "string") {
    const parsed = localeSchema.safeParse(explicit);
    if (parsed.success) return parsed.data;
  }

  const fromEnv = process.env.VIBESQUAD_LANG;
  if (fromEnv) {
    const parsed = localeSchema.safeParse(fromEnv.split(/[-_]/)[0]);
    if (parsed.success) return parsed.data;
  }

  return detectFromSystem();
}

export function detectFromSystem(): Locale {
  try {
    const system = Intl.DateTimeFormat().resolvedOptions().locale;
    const parsed = localeSchema.safeParse(system.split("-")[0]);
    if (parsed.success) return parsed.data;
  } catch {
    // Some minimal Node builds ship without full ICU.
  }
  return "en";
}
