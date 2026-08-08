/**
 * Planning through an API key the user supplies.
 *
 * The fallback for someone who has an Anthropic key but no working CLI. Uses
 * plain fetch rather than the SDK: it is one request, and a dependency that
 * exists to save fifteen lines is a dependency a first-time reader of this
 * repository has to look up.
 */
import { DEFAULT_TIMEOUT_MS, type CompletionRequest, type Provider, ProviderError } from "./types.js";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export const DEFAULT_API_MODEL = "claude-sonnet-5";

interface MessagesResponse {
  content?: { type: string; text?: string }[];
  error?: { message?: string };
}

export function createAnthropicApiProvider(apiKey: string, model = DEFAULT_API_MODEL): Provider {
  return {
    id: "anthropic-api",
    label: "your Anthropic API key",
    async complete(request: CompletionRequest): Promise<string> {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );

      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": API_VERSION,
          },
          body: JSON.stringify({
            model,
            max_tokens: 8192,
            system: request.system,
            messages: [{ role: "user", content: request.user }],
          }),
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => ({}))) as MessagesResponse;

        if (!response.ok) {
          const detail = body.error?.message ?? `HTTP ${response.status}`;
          throw new ProviderError(
            "anthropic-api",
            response.status === 401
              ? "that API key was rejected"
              : `the Anthropic API returned an error: ${detail}`,
          );
        }

        const text = (body.content ?? [])
          .filter((block) => block.type === "text")
          .map((block) => block.text ?? "")
          .join("");

        if (text.trim().length === 0) {
          throw new ProviderError("anthropic-api", "the API returned an empty response");
        }
        return text;
      } catch (error) {
        if (error instanceof ProviderError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
          throw new ProviderError("anthropic-api", "the request timed out");
        }
        throw new ProviderError(
          "anthropic-api",
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
