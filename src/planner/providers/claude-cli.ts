/**
 * Planning through the user's own Claude Code installation.
 *
 * The best lane when it works: the user already installed and paid for this,
 * so there is no API key to obtain and nothing to sign up for. The M0 spike
 * confirmed `claude -p --output-format json` returns a machine-readable result
 * -- and that it reports "Not logged in" cleanly when the CLI has never been
 * logged in, which is a real state even for someone actively using the desktop
 * app. Detecting that is `capabilities.ts`'s job; reporting it clearly is ours.
 */
import { spawnSync } from "node:child_process";
import { DEFAULT_TIMEOUT_MS, type CompletionRequest, type Provider, ProviderError } from "./types.js";
import { withNeutralCwd } from "./neutral-cwd.js";

/**
 * Planning is a judgement task and the plan is the product, so this is not the
 * place to save pennies on a weaker model. It is one call per project.
 */
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5";

export interface ClaudeCliResult {
  is_error?: boolean;
  result?: string;
  total_cost_usd?: number;
}

export function createClaudeCliProvider(model = DEFAULT_CLAUDE_MODEL): Provider {
  return {
    id: "claude-cli",
    label: "Claude Code",
    async complete(request: CompletionRequest): Promise<string> {
      return withNeutralCwd((cwd) => {
        const run = spawnSync(
          "claude",
          [
            "-p",
            request.user,
            "--output-format",
            "json",
            "--system-prompt",
            request.system,
            "--model",
            model,
            "--max-turns",
            "1",
          ],
          {
            cwd,
            encoding: "utf8",
            timeout: request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
            maxBuffer: 32 * 1024 * 1024,
            windowsHide: true,
          },
        );

        if (run.error) {
          throw new ProviderError("claude-cli", `could not run claude: ${run.error.message}`);
        }

        // The CLI reports failures inside its JSON as often as through the exit
        // code, so the body is parsed even when the status is non-zero.
        let parsed: ClaudeCliResult;
        try {
          parsed = JSON.parse(run.stdout);
        } catch {
          throw new ProviderError(
            "claude-cli",
            `unexpected output from claude:\n${(run.stdout || run.stderr || "").slice(0, 400)}`,
          );
        }

        if (parsed.is_error || typeof parsed.result !== "string") {
          throw new ProviderError("claude-cli", parsed.result ?? "claude returned an error");
        }

        return parsed.result;
      });
    },
  };
}
