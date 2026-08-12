import { afterEach, describe, expect, it, vi } from "vitest";
import { countProjectCreated, countingIsOff } from "../src/telemetry/count.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("when nothing is counted", () => {
  it("stays off when the user says so", () => {
    expect(countingIsOff({ VIBESQUAD_NO_COUNT: "1" })).toBe(true);
  });

  it("stays off in continuous integration", () => {
    // Our own release workflow would otherwise add one per publish, and so
    // would every CI run anywhere else.
    expect(countingIsOff({ CI: "true" })).toBe(true);
  });

  it("stays off under a test runner", () => {
    expect(countingIsOff({ VITEST: "true" })).toBe(true);
    expect(countingIsOff({ NODE_ENV: "test" })).toBe(true);
  });

  it("counts an ordinary run", () => {
    expect(countingIsOff({})).toBe(false);
  });

  it("sends nothing at all when it is off", async () => {
    const fetched = vi.spyOn(globalThis, "fetch");
    await countProjectCreated({ VIBESQUAD_NO_COUNT: "1" });
    expect(fetched).not.toHaveBeenCalled();
  });
});

describe("when a project is counted", () => {
  it("asks GitHub for the counter file and carries no payload", async () => {
    const fetched = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(""));
    await countProjectCreated({});

    expect(fetched).toHaveBeenCalledTimes(1);
    const [url, init] = fetched.mock.calls[0] ?? [];
    expect(String(url)).toContain("releases/download");
    // A GET with no body: the count is the request, not anything in it.
    expect((init as RequestInit | undefined)?.body).toBeUndefined();
    expect((init as RequestInit | undefined)?.method ?? "GET").toBe("GET");
  });

  it("says nothing and fails nothing when there is no network", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));
    // The project is already on disk. A counter is never worth an error.
    await expect(countProjectCreated({})).resolves.toBeUndefined();
  });

  it("survives GitHub answering with an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 404 }));
    await expect(countProjectCreated({})).resolves.toBeUndefined();
  });
});
