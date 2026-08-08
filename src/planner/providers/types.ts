/**
 * One way of asking a model a question.
 *
 * Kept to a single stateless call rather than a conversation. The CLI-backed
 * providers have no cheap way to continue a session, and a repair attempt is
 * just as effective as a fresh call carrying the previous answer in its prompt.
 * Uniformity is worth more here than the tokens a real conversation would save.
 */
export interface Provider {
  id: string;
  /** Shown to the user: "Claude Code", "your Anthropic API key". */
  label: string;
  complete(request: CompletionRequest): Promise<string>;
}

export interface CompletionRequest {
  system: string;
  user: string;
  /** Abandon the call after this long. Beginners assume a hang means broken. */
  timeoutMs?: number;
}

export const DEFAULT_TIMEOUT_MS = 180_000;

export class ProviderError extends Error {
  readonly providerId: string;

  constructor(providerId: string, message: string) {
    super(message);
    this.name = "ProviderError";
    this.providerId = providerId;
  }
}
