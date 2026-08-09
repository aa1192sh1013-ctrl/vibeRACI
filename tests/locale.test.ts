import { afterEach, describe, expect, it } from "vitest";
import { detectApiKey } from "../src/planner/capabilities.js";
import { explainProviderFailure } from "../src/planner/capabilities.js";
import { resolveLocale } from "../src/cli/locale.js";
import { strings } from "../src/core/strings.js";

const originalLang = process.env.VIBERACI_LANG;
afterEach(() => {
  if (originalLang === undefined) delete process.env.VIBERACI_LANG;
  else process.env.VIBERACI_LANG = originalLang;
});

describe("choosing a language", () => {
  it("takes the flag when there is one", () => {
    expect(resolveLocale("ko")).toBe("ko");
    expect(resolveLocale("en")).toBe("en");
  });

  it("falls back rather than failing on a language it does not have", () => {
    // Being addressed in the wrong language is an annoyance; an error before
    // the tool even starts is a dead end.
    delete process.env.VIBERACI_LANG;
    expect(["en", "ko"]).toContain(resolveLocale("fr"));
  });

  it("reads the environment when no flag is given", () => {
    process.env.VIBERACI_LANG = "ko";
    expect(resolveLocale()).toBe("ko");
  });

  it("accepts a full locale tag, not just a bare language", () => {
    process.env.VIBERACI_LANG = "ko-KR";
    expect(resolveLocale()).toBe("ko");
  });

  it("lets the flag beat the environment", () => {
    process.env.VIBERACI_LANG = "ko";
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

  it("has every string in both languages", () => {
    const en = strings("en");
    const ko = strings("ko");
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(en)) {
      expect(typeof ko[key as keyof typeof ko], key).toBe(typeof value);
    }
  });
});
