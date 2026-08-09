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
import type { Locale } from "../core/schema.js";
import { strings } from "../core/strings.js";

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

export function detectClaude(locale: Locale = "en"): ToolCapability {
  const s = strings(locale);
  if (!isInstalled("claude")) {
    return {
      id: "claude-cli",
      label: "Claude Code",
      status: "not-installed",
      detail: s.claudeMissing,
      fix: s.claudeMissingFix,
    };
  }

  // Testing the login costs a real request, so it is deferred to the moment a
  // plan is actually needed. `explainProviderFailure` handles it from there.
  return {
    id: "claude-cli",
    label: "Claude Code",
    status: "unknown",
    detail: s.claudeLoginUnknown,
  };
}

export function detectCodex(locale: Locale = "en"): ToolCapability {
  const s = strings(locale);
  if (!isInstalled("codex")) {
    return {
      id: "codex-cli",
      label: "Codex",
      status: "not-installed",
      detail: s.codexMissing,
      fix: s.codexMissingFix,
    };
  }

  // Free and instant, unlike Claude's.
  const status = run("codex", ["login", "status"]);
  if (status.status === 0) {
    return {
      id: "codex-cli",
      label: "Codex",
      status: "ready",
      detail: (status.stdout || s.codexLoggedIn).trim(),
    };
  }

  return {
    id: "codex-cli",
    label: "Codex",
    status: "not-logged-in",
    detail: s.codexNotLoggedIn,
    fix: s.codexNotLoggedInFix,
  };
}

export function detectApiKey(
  env: NodeJS.ProcessEnv = process.env,
  locale: Locale = "en",
): ToolCapability {
  const s = strings(locale);
  const key = env.ANTHROPIC_API_KEY?.trim();
  return {
    id: "anthropic-api",
    label: s.apiKeyLabel,
    status: key ? "ready" : "not-installed",
    detail: key ? s.apiKeyFound : s.apiKeyMissing,
  };
}

export function detectAll(
  env: NodeJS.ProcessEnv = process.env,
  locale: Locale = "en",
): ToolCapability[] {
  return [detectClaude(locale), detectCodex(locale), detectApiKey(env, locale)];
}

/**
 * Turns a provider's error into something the user can act on.
 *
 * The raw text is kept as a last resort, but the recognised cases are the ones
 * that actually happen, and each of them has a fix that is one line long.
 */
export function explainProviderFailure(
  providerId: string,
  message: string,
  locale: Locale = "en",
): string {
  const s = strings(locale);
  const text = message.toLowerCase();

  if (text.includes("not logged in") || text.includes("/login")) {
    return providerId === "codex-cli" ? s.codexNeedsLogin : s.claudeNeedsLogin;
  }
  if (text.includes("could not run")) return `${s.toolWouldNotStart}\n\n${message}`;
  if (text.includes("timed out")) return s.requestTimedOut;
  if (text.includes("api key was rejected")) return s.apiKeyRejected;
  if (text.includes("credit") || text.includes("quota") || text.includes("rate limit")) {
    return `${s.accountCannotRequest}\n\n${message}`;
  }

  return message;
}
