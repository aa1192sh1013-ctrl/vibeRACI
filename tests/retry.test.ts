import { describe, expect, it } from "vitest";
import { completeWithRetries, isPermanentFailure } from "../src/planner/providers/retry.js";
import { type Provider, ProviderError } from "../src/planner/providers/types.js";

const request = { system: "s", user: "u" };
const noWait = async () => {};

/** Fails with `message` the first `failures` times, then answers. */
function flaky(failures: number, message: string, id = "claude-cli"): Provider & { calls: number } {
  const provider = {
    id,
    label: id,
    calls: 0,
    async complete() {
      provider.calls++;
      if (provider.calls <= failures) throw new ProviderError(id, message);
      return "the plan";
    },
  };
  return provider;
}

describe("telling bad luck from a real problem", () => {
  it("treats an unexplained error as bad luck", () => {
    // The exact message that cost a real run.
    expect(isPermanentFailure(new Error("claude returned an error"))).toBe(false);
  });

  it.each([
    "overloaded_error",
    "rate limit exceeded",
    "status 529",
    "socket hang up",
    "ETIMEDOUT",
  ])("treats %s as bad luck", (message) => {
    expect(isPermanentFailure(new Error(message))).toBe(false);
  });

  it.each([
    "could not run claude: not on PATH",
    "could not run claude: ENOENT",
    "Not logged in · Please run /login",
    "The 'gpt-5.6-terra' model requires a newer version of Codex.",
    'invalid_request_error: bad "model"',
    "authentication_error",
    "invalid x-api-key",
  ])("knows %s will happen again", (message) => {
    expect(isPermanentFailure(new Error(message))).toBe(true);
  });
});

describe("asking again", () => {
  it("gets there when the first call was unlucky", async () => {
    const provider = flaky(1, "claude returned an error");
    expect(await completeWithRetries(provider, request, 2, noWait)).toBe("the plan");
    expect(provider.calls).toBe(2);
  });

  it("uses the whole budget before giving up", async () => {
    const provider = flaky(99, "claude returned an error");
    await expect(completeWithRetries(provider, request, 2, noWait)).rejects.toThrow(/returned an error/);
    expect(provider.calls).toBe(3);
  });

  it("does not waste a call on a problem that will repeat", async () => {
    const provider = flaky(99, "could not run claude: not on PATH");
    await expect(completeWithRetries(provider, request, 2, noWait)).rejects.toThrow(/not on PATH/);
    expect(provider.calls).toBe(1);
  });

  it("does not ask twice when the first answer was good", async () => {
    const provider = flaky(0, "unused");
    expect(await completeWithRetries(provider, request, 2, noWait)).toBe("the plan");
    expect(provider.calls).toBe(1);
  });

  it("makes exactly one call when the budget is zero", async () => {
    const provider = flaky(99, "claude returned an error");
    await expect(completeWithRetries(provider, request, 0, noWait)).rejects.toThrow();
    expect(provider.calls).toBe(1);
  });

  it("waits between tries, and not before the first", async () => {
    const waited: number[] = [];
    const provider = flaky(2, "claude returned an error");
    await completeWithRetries(provider, request, 2, async (ms) => {
      waited.push(ms);
    });
    expect(waited).toEqual([1000, 3000]);
  });
});
