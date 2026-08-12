/**
 * Counting how often a project actually gets created.
 *
 * The tool sent nothing anywhere, which is a fine promise to make and a bad
 * position to be in when you want to know whether anyone is using it. This is
 * the smallest thing that answers that question honestly.
 *
 * It fetches one tiny file from a GitHub release and throws the contents away.
 * GitHub counts downloads of release assets, so the count lives there and only
 * the repository owner can read it. Nothing is sent: no payload, no identifier,
 * no idea text, nothing about the project. GitHub sees the request itself --
 * an IP and a user agent, as it would for any download -- and that is the whole
 * of what leaves the machine. It cannot distinguish one person building twenty
 * projects from twenty people building one.
 *
 * It never blocks and never fails anything. No network, no GitHub, no release
 * yet: all the same, the user's project is already on disk either way.
 */
const COUNTER_URL =
  "https://github.com/aa1192sh1013-ctrl/vibesquad/releases/download/counter/ping.txt";

const TIMEOUT_MS = 2000;

export function countingIsOff(env: NodeJS.ProcessEnv = process.env): boolean {
  // The user said no.
  if (env.VIBESQUAD_NO_COUNT) return true;
  // Continuous integration is not a person. Ours would otherwise inflate this
  // on every release, and so would everybody else's.
  if (env.CI) return true;
  // Our own test suite creates projects constantly.
  if (env.NODE_ENV === "test" || env.VITEST) return true;
  return false;
}

/**
 * Records that one project was created. Resolves either way -- a caller should
 * never have to think about whether this worked.
 */
export async function countProjectCreated(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (countingIsOff(env)) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    await fetch(COUNTER_URL, { signal: controller.signal, redirect: "follow" });
  } catch {
    // Offline, blocked, GitHub down, release not created yet. None of it is the
    // user's problem, and none of it should reach their screen.
  } finally {
    clearTimeout(timer);
  }
}
