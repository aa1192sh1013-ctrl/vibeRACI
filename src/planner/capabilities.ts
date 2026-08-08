/**
 * Working out what this computer can actually do.
 *
 * The M0 spike is the whole reason this file is a first-class part of the
 * product rather than a helper. Two findings drove it:
 *
 *  - A user can be actively using Claude Code and still have a CLI that is not
 *    logged in. Asking "which tools do you have?" gets a confident yes that is
 *    wrong, so we look instead of asking.
 *  - Codex's write sandbox was broken outright on a stock Windows machine. A
 *    beginner hitting that has no way to diagnose it, so every failure here
 *    carries a plain-language fix rather than the tool's own error text.
 *
 * Only free checks live here. Claude has no cost-free way to test its login,
 * so that answer stays "unknown" until a real call needs to be made, and the
 * failure is interpreted then.
 */
import { spawnSync } from "node:child_process";

export type ToolStatus = "ready" | "not-installed" | "not-logged-in" | "unknown";

export interface ToolCapability {
  id: "claude-cli" | "codex-cli" | "anthropic-api";
  label: string;
  status: ToolStatus;
  /** What we know, in words the user can act on. */
  detail: string;
  /** The exact thing to do about it. Empty when nothing is wrong. */
  fix?: string;
}

function run(command: string, args: string[]) {
  return spawnSync(command, args, {
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
  });
}

function isInstalled(command: string): boolean {
  const result = run(command, ["--version"]);
  return !result.error && result.status === 0;
}

export function detectClaude(): ToolCapability {
  if (!isInstalled("claude")) {
    return {
      id: "claude-cli",
      label: "Claude Code",
      status: "not-installed",
      detail: "Claude Code is not installed, or your terminal cannot find it.",
      fix: "Install Claude Code, then close and reopen your terminal.",
    };
  }

  // Testing the login costs a real request, so it is deferred to the moment a
  // plan is actually needed. `explainProviderFailure` handles it from there.
  return {
    id: "claude-cli",
    label: "Claude Code",
    status: "unknown",
    detail: "Claude Code is installed. Whether it is logged in is checked when it is used.",
  };
}

export function detectCodex(): ToolCapability {
  if (!isInstalled("codex")) {
    return {
      id: "codex-cli",
      label: "Codex",
      status: "not-installed",
      detail: "Codex is not installed, or your terminal cannot find it.",
      fix: "Install Codex, then close and reopen your terminal.",
    };
  }

  // Free and instant, unlike Claude's.
  const status = run("codex", ["login", "status"]);
  if (status.status === 0) {
    return {
      id: "codex-cli",
      label: "Codex",
      status: "ready",
      detail: (status.stdout || "Logged in.").trim(),
    };
  }

  return {
    id: "codex-cli",
    label: "Codex",
    status: "not-logged-in",
    detail: "Codex is installed but not logged in.",
    fix: "Run: codex login",
  };
}

export function detectApiKey(env: NodeJS.ProcessEnv = process.env): ToolCapability {
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (key) {
    return {
      id: "anthropic-api",
      label: "your Anthropic API key",
      status: "ready",
      detail: "Found an API key in ANTHROPIC_API_KEY.",
    };
  }
  return {
    id: "anthropic-api",
    label: "your Anthropic API key",
    status: "not-installed",
    detail: "No API key set. This is only needed if neither Claude Code nor Codex works.",
  };
}

export function detectAll(env: NodeJS.ProcessEnv = process.env): ToolCapability[] {
  return [detectClaude(), detectCodex(), detectApiKey(env)];
}

/**
 * Turns a provider's error into something the user can act on.
 *
 * The raw text is kept as a last resort, but the recognised cases are the ones
 * that actually happen, and each of them has a fix that is one line long.
 */
export function explainProviderFailure(providerId: string, message: string): string {
  const text = message.toLowerCase();

  if (text.includes("not logged in") || text.includes("/login")) {
    return providerId === "codex-cli"
      ? "Codex is not logged in. Run: codex login"
      : [
          "Claude Code is installed but its command line is not logged in.",
          "(Being signed in to the Claude app is not the same thing.)",
          "",
          "Fix it once:",
          "  1. Run: claude",
          "  2. Type: /login",
          "  3. Finish signing in, then type: exit",
        ].join("\n");
  }

  if (text.includes("could not run")) {
    return `That tool could not be started. Close and reopen your terminal, then try again.\n\n${message}`;
  }

  if (text.includes("timed out")) {
    return "That took too long and was stopped. Check your internet connection and try again.";
  }

  if (text.includes("api key was rejected")) {
    return "That API key was rejected. Check ANTHROPIC_API_KEY for a typo or an expired key.";
  }

  if (text.includes("credit") || text.includes("quota") || text.includes("rate limit")) {
    return `That account cannot make requests right now.\n\n${message}`;
  }

  return message;
}
