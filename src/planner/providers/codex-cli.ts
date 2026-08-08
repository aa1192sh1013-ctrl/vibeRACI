/**
 * Planning through the user's own Codex installation.
 *
 * The M0 spike found this lane working end to end, including a free instant
 * auth check. Two details worth keeping:
 *
 *  - `--skip-git-repo-check` is required, because the scratch directory we run
 *    in is deliberately not a repository.
 *  - `-o` writes the final message to a file. Reading that is far more robust
 *    than parsing stdout, which carries a banner, progress lines and any
 *    warnings the CLI felt like printing.
 *
 * The sandbox stays read-only: planning answers a question, it does not need
 * to touch a disk. That also sidesteps the broken Windows sandbox helper the
 * spike ran into, which only affects write modes.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_TIMEOUT_MS, type CompletionRequest, type Provider, ProviderError } from "./types.js";
import { withNeutralCwd } from "./neutral-cwd.js";

/**
 * Codex can be handed a JSON Schema that constrains its final answer rather
 * than merely asking for one. When a caller supplies it, take it -- it removes
 * the failure mode where a model invents its own field names.
 */
export function createCodexCliProvider(outputSchema?: Record<string, unknown>): Provider {
  return {
    id: "codex-cli",
    label: "Codex",
    async complete(request: CompletionRequest): Promise<string> {
      return withNeutralCwd((cwd) => {
        const outputFile = join(cwd, "answer.txt");

        // Codex takes no separate system prompt, so the two are joined.
        const prompt = `${request.system}\n\n---\n\n${request.user}`;

        const schemaArgs: string[] = [];
        if (outputSchema) {
          const schemaFile = join(cwd, "schema.json");
          writeFileSync(schemaFile, JSON.stringify(outputSchema), "utf8");
          schemaArgs.push("--output-schema", schemaFile);
        }

        const run = spawnSync(
          "codex",
          [
            "exec",
            "--skip-git-repo-check",
            "--sandbox",
            "read-only",
            "--cd",
            cwd,
            "-o",
            outputFile,
            ...schemaArgs,
            prompt,
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
          throw new ProviderError("codex-cli", `could not run codex: ${run.error.message}`);
        }

        try {
          const answer = readFileSync(outputFile, "utf8");
          if (answer.trim().length > 0) return answer;
        } catch {
          // fall through to the error below
        }

        throw new ProviderError(
          "codex-cli",
          `codex produced no answer:\n${(run.stderr || run.stdout || "").slice(-400)}`,
        );
      });
    },
  };
}
