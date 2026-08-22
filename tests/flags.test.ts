import { describe, expect, it } from "vitest";
import { enumFlag, numberFlag, textFlag } from "../src/cli/flags.js";
import { goalSchema } from "../src/planner/answers.js";
import { FriendlyError } from "../src/cli/project.js";

describe("--goal", () => {
  it("accepts every value the planner accepts", () => {
    for (const value of goalSchema.options) {
      expect(enumFlag(value, goalSchema, "goal")).toBe(value);
    }
  });

  it("is absent when not given", () => {
    expect(enumFlag(undefined, goalSchema, "goal")).toBeUndefined();
  });

  it("rejects a value that is not on the list", () => {
    // The bug this covers: "working" used to be cast through, spend the whole
    // planning call, and fail afterwards with a page of JSON.
    expect(() => enumFlag("working", goalSchema, "goal")).toThrow(FriendlyError);
    expect(() => enumFlag("working", goalSchema, "goal")).toThrow(/does not understand "working"/);
  });

  it("names the values it will accept, so the fix is in the message", () => {
    try {
      enumFlag("working", goalSchema, "goal");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(FriendlyError);
      expect((error as FriendlyError).hint).toContain("demo");
      expect((error as FriendlyError).hint).toContain("mvp");
      expect((error as FriendlyError).hint).toContain("deploy");
    }
  });

  it("complains when the flag is given with nothing after it", () => {
    expect(() => enumFlag(true, goalSchema, "goal")).toThrow(/needs a value/);
  });
});

describe("--port", () => {
  it("takes a whole number", () => {
    expect(numberFlag("4173", "port")).toBe(4173);
  });

  it("refuses text rather than passing NaN on", () => {
    expect(() => numberFlag("abc", "port")).toThrow(/whole number/);
  });

  it("refuses a fraction", () => {
    expect(() => numberFlag("41.73", "port")).toThrow(/whole number/);
  });

  it("complains when the flag is given with nothing after it", () => {
    expect(() => numberFlag(true, "port")).toThrow(/needs a value/);
  });

  it("is absent when not given", () => {
    expect(numberFlag(undefined, "port")).toBeUndefined();
  });
});

describe("--dir", () => {
  it("passes a path straight through", () => {
    expect(textFlag("C:\\Dev\\thing", "dir")).toBe("C:\\Dev\\thing");
  });

  it("complains when the flag is given with nothing after it", () => {
    expect(() => textFlag(true, "dir")).toThrow(/needs a value/);
  });

  it("is absent when not given", () => {
    expect(textFlag(undefined, "dir")).toBeUndefined();
  });
});
