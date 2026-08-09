/**
 * `viberaci ui` -- the same thing, in a browser.
 *
 * Exists because the people this is for find a terminal frightening, and the
 * one screen that matters -- "here is your step, here is the button that copies
 * it" -- is much less frightening as a page with a button on it.
 *
 * It does not replace the terminal. Claude Code lives there, so the user still
 * opens one to paste into. This just removes the terminal from the parts that
 * never needed it.
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { Locale } from "../../core/schema.js";
import { startUiServer } from "../../ui/server.js";
import { cyan, dim, say } from "../ui.js";

export interface UiOptions {
  dir?: string;
  locale: Locale;
  port?: number;
  /** Skip launching a browser -- for tests, and for people over SSH. */
  open?: boolean;
}

export async function runUi(options: UiOptions): Promise<void> {
  const dir = resolve(options.dir ?? process.cwd());
  const server = await startUiServer({ dir, locale: options.locale, port: options.port });

  say();
  say(`  ${cyan(server.url)}`);
  say(`  ${dim(dir)}`);
  say();
  say(dim("  Ctrl+C to stop."));
  say();

  if (options.open !== false) openInBrowser(server.url);

  // Hold the process open until interrupted; the server is the whole program.
  await new Promise<void>((resolveWait) => {
    process.on("SIGINT", () => {
      void server.close().then(() => resolveWait());
    });
  });
}

function openInBrowser(url: string): void {
  const [command, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];

  try {
    // Detached and ignored: a browser that outlives this process is fine, and
    // a machine with no browser at all should not take the server down with it.
    spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true }).unref();
  } catch {
    // The URL is printed above; opening it by hand works just as well.
  }
}
