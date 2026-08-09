import { afterEach, describe, expect, it } from "vitest";
import { detectApiKey } from "../src/planner/capabilities.js";
import { explainProviderFailure } from "../src/planner/capabilities.js";
import { resolveLocale } from "../src/cli/locale.js";
import { strings } from "../src/core/strings.js";

const originalLang = process.env.VIBESQUAD_LANG;
afterEach(() => {
  if (originalLang === undefined) delete process.env.VIBESQUAD_LANG;
  else process.env.VIBESQUAD_LANG = originalLang;
});

describe("choosing a language", () => {
  it("takes the flag when there is one", () => {
    expect(resolveLocale("ko")).toBe("ko");
    expect(resolveLocale("en")).toBe("en");
  });

  it("falls back rather than failing on a language it does not have", () => {
    // Being addressed in the wrong language is an annoyance; an error before
    // the tool even starts is a dead end.
    delete process.env.VIBESQUAD_LANG;
    expect(["en", "ko"]).toContain(resolveLocale("fr"));
  });

  it("reads the environment when no flag is given", () => {
    process.env.VIBESQUAD_LANG = "ko";
    expect(resolveLocale()).toBe("ko");
  });

  it("accepts a full locale tag, not just a bare language", () => {
    process.env.VIBESQUAD_LANG = "ko-KR";
    expect(resolveLocale()).toBe("ko");
  });

  it("lets the flag beat the environment", () => {
    process.env.VIBESQUAD_LANG = "ko";
    expect(resolveLocale("en")).toBe("en");
  });
});

describe("speaking the chosen language everywhere", () => {
  it("translates what doctor reports, not just its headings", () => {
    const korean = detectApiKey({}, "ko");
    expect(korean.detail).toMatch(/[가-힣]/);
    expect(korean.label).toMatch(/[가-힣]/);
    expect(detectApiKey({}, "en").detail).not.toMatch(/[가-힣]/);
  });

  it("translates the login explanation, which is the one people actually hit", () => {
    const korean = explainProviderFailure("claude-cli", "Not logged in - run /login", "ko");
    expect(korean).toMatch(/[가-힣]/);
    expect(korean).toContain("/login");
    // The distinction that caused the confusion must survive translation.
    expect(korean).toContain("Claude 앱");
  });

  it("does not tell someone who uses the app that they have nothing", () => {
    // Reported by a user watching the page call Codex missing while Codex was
    // open in front of them. The desktop app and the command line are separate
    // installs, and only one of them can be driven headlessly -- saying "not
    // installed" is the same believable-and-wrong answer M0 found for Claude.
    for (const locale of ["en", "ko"] as const) {
      const s = strings(locale);
      expect(s.codexMissing, locale).toMatch(/ChatGPT/);
      expect(s.claudeMissing, locale).toMatch(/앱|app/i);
    }
    // And the fix has to be the actual command, not "go install it".
    expect(strings("en").codexMissingFix).toContain("npm install -g @openai/codex");
    expect(strings("ko").codexMissingFix).toContain("npm install -g @openai/codex");
  });

  it("has every string in both languages", () => {
    const en = strings("en");
    const ko = strings("ko");
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(en)) {
      expect(typeof ko[key as keyof typeof ko], key).toBe(typeof value);
    }
  });
});
