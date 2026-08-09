import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findExecutable, resolveLauncher } from "../src/core/executable.js";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "viberaci-path-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** The three files npm drops on Windows for one command. */
function npmShims(name: string): void {
  writeFileSync(join(dir, name), "#!/bin/sh\n", "utf8"); // Git Bash, unrunnable by Windows
  writeFileSync(join(dir, `${name}.cmd`), "@echo off\n", "utf8");
  writeFileSync(join(dir, `${name}.ps1`), "# powershell\n", "utf8");
}

const windows = (extra: NodeJS.ProcessEnv = {}) => ({
  PATH: dir,
  PATHEXT: ".COM;.EXE;.BAT;.CMD",
  ...extra,
});

/**
 * Windows paths are case-insensitive, and the extension comes back in whatever
 * case PATHEXT used -- `.CMD` for a file on disk called `codex.cmd`. That runs
 * perfectly well, so the assertion should not care either.
 */
function expectPath(actual: string | undefined, expected: string): void {
  expect(actual?.toLowerCase()).toBe(expected.toLowerCase());
}

describe("finding a command on Windows", () => {
  it("picks the runnable shim, not the extensionless one", () => {
    // This is the whole bug: Node does not apply PATHEXT, lands on the bare
    // file npm writes for Git Bash, and reports an installed tool as missing.
    npmShims("codex");
    expectPath(findExecutable("codex", windows(), "win32"), join(dir, "codex.cmd"));
  });

  it("finds a real executable too", () => {
    writeFileSync(join(dir, "claude.exe"), "", "utf8");
    expectPath(findExecutable("claude", windows(), "win32"), join(dir, "claude.exe"));
  });

  it("prefers the earlier extension in PATHEXT", () => {
    writeFileSync(join(dir, "tool.cmd"), "", "utf8");
    writeFileSync(join(dir, "tool.exe"), "", "utf8");
    expectPath(findExecutable("tool", windows(), "win32"), join(dir, "tool.exe"));
  });

  it("searches PATH entries in order", () => {
    const second = join(dir, "second");
    mkdirSync(second);
    writeFileSync(join(second, "tool.cmd"), "", "utf8");
    // Windows separates PATH with ";" whatever platform this test runs on.
    const env = { PATH: [dir, second].join(";"), PATHEXT: ".CMD" };
    expectPath(findExecutable("tool", env, "win32"), join(second, "tool.cmd"));
  });

  it("says nothing rather than guessing when the command is absent", () => {
    expect(findExecutable("nothing-here", windows(), "win32")).toBeUndefined();
  });

  it("copes with a PATHEXT that has spaces around the separators", () => {
    writeFileSync(join(dir, "tool.cmd"), "", "utf8");
    expectPath(findExecutable("tool", { PATH: dir, PATHEXT: ".EXE; .CMD" }, "win32"), join(dir, "tool.cmd"));
  });

  it("falls back to a sensible PATHEXT when the variable is missing", () => {
    npmShims("codex");
    expectPath(findExecutable("codex", { PATH: dir }, "win32"), join(dir, "codex.cmd"));
  });
});

describe("finding a command everywhere else", () => {
  it("matches a lowercase file against an uppercase PATHEXT", () => {
    // Windows does not care about case, so trying only the declared spelling
    // worked there by accident. A case-sensitive filesystem finds nothing.
    writeFileSync(join(dir, "tool.cmd"), "", "utf8");
    expect(findExecutable("tool", { PATH: dir, PATHEXT: ".CMD" }, "win32")).toBeDefined();
  });

  it("leaves the name alone, because the runtime resolves it correctly", () => {
    expect(findExecutable("codex", { PATH: "/usr/bin" }, "linux")).toBe("codex");
    expect(findExecutable("codex", { PATH: "/usr/bin" }, "darwin")).toBe("codex");
  });
});

/** The batch shim npm writes, pointing at the script that does the work. */
function npmShimWithScript(name: string, scriptRelative: string): void {
  npmShims(name);
  writeFileSync(
    join(dir, `${name}.cmd`),
    `@ECHO off\r\n"%_prog%"  "%dp0%\\${scriptRelative.replace(/\//g, "\\")}" %*\r\n`,
    "utf8",
  );
  const script = join(dir, scriptRelative);
  mkdirSync(dirname(script), { recursive: true });
  writeFileSync(script, "// the real thing\n", "utf8");
}

describe("actually starting a command", () => {
  it("runs an npm shim's script directly, never through a shell", () => {
    // A shell would re-parse the user's idea, which is passed as an argument.
    npmShimWithScript("codex", "node_modules/@openai/codex/bin/codex.js");
    const launcher = resolveLauncher("codex", windows(), "win32", "C:\\node.exe");
    expect(launcher?.command).toBe("C:\\node.exe");
    expectPath(launcher?.prefixArgs[0], join(dir, "node_modules/@openai/codex/bin/codex.js"));
  });

  it("starts a real executable with no wrapper at all", () => {
    writeFileSync(join(dir, "claude.exe"), "", "utf8");
    const launcher = resolveLauncher("claude", windows(), "win32");
    expectPath(launcher?.command, join(dir, "claude.exe"));
    expect(launcher?.prefixArgs).toEqual([]);
  });

  it("refuses a batch file it cannot see inside, rather than reaching for a shell", () => {
    writeFileSync(join(dir, "mystery.cmd"), "@echo off\r\nsome-other-thing %*\r\n", "utf8");
    expect(resolveLauncher("mystery", windows(), "win32")).toBeUndefined();
  });

  it("refuses when the script the shim names is missing", () => {
    npmShims("broken");
    writeFileSync(join(dir, "broken.cmd"), '@ECHO off\r\n"%dp0%\\gone.js" %*\r\n', "utf8");
    expect(resolveLauncher("broken", windows(), "win32")).toBeUndefined();
  });

  it("says nothing when the command is not there", () => {
    expect(resolveLauncher("absent", windows(), "win32")).toBeUndefined();
  });

  it("needs no wrapper anywhere but Windows", () => {
    expect(resolveLauncher("codex", { PATH: "/usr/bin" }, "linux")).toEqual({
      command: "codex",
      prefixArgs: [],
    });
  });
});
