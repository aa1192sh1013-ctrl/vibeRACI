/**
 * Which planning failures are worth trying again.
 *
 * The default is yes, and that direction is deliberate. A wasted retry costs a
 * few seconds; giving up too early costs the user a plan that ignores their
 * idea, because the next lane down is a generic template. Transient failures
 * also fail fast -- an overloaded API answers in a second, not in the minutes a
 * real planning call takes -- so retrying is cheap exactly when it is needed.
 *
 * What must not be retried is a failure that will happen again for the same
 * reason: a missing command, a login that was never done, a CLI too old for the
 * model it is being asked for. Those are listed here, and everything else is
 * treated as bad luck.
 *
 * This exists because a run was lost to an opaque "claude returned an error".
 * The same command, run again by hand, worked twice. One unlucky call was
 * enough to abandon the lane entirely.
 */
import { type CompletionRequest, type Provider, ProviderError } from "./types.js";

/**
 * Failures that will repeat. Matched against the message, because the CLIs
 * report all of these as ordinary errors rather than distinguishable types.
 */
const PERMANENT = [
  /not on PATH/i,
  /\bENOENT\b/,
  /not logged in/i,
  /please run \/login/i,
  /requires a newer version/i,
  /invalid_request_error/i,
  /authentication_error/i,
  /permission_error/i,
  /invalid.{0,3}api.{0,3}key/i,
  /unsupported|unrecognized|unknown (model|option|flag)/i,
];

export function isPermanentFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return PERMANENT.some((pattern) => pattern.test(message));
}

/** 1s, then 3s. Short on purpose: somebody is watching a spinner. */
export function backoffMs(attempt: number): number {
  return attempt === 0 ? 1_000 : 3_000;
}

/**
 * Ask a provider, giving bad luck a second and third chance.
 *
 * Separate from the repair loop above it, which retries a plan the schema
 * rejected. That one changes the prompt; this one changes nothing and simply
 * asks again.
 */
export async function completeWithRetries(
  provider: Provider,
  request: CompletionRequest,
  budget: number,
  sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<string> {
  let last: unknown;

  for (let attempt = 0; attempt <= budget; attempt++) {
    try {
      return await provider.complete(request);
    } catch (error) {
      last = error;
      if (isPermanentFailure(error) || attempt === budget) break;
      await sleep(backoffMs(attempt));
    }
  }

  throw last instanceof Error
    ? last
    : new ProviderError(provider.id, last === undefined ? "no answer" : String(last));
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
