/**
 * Copying a prompt to the clipboard.
 *
 * The whole product is "paste this into your coding tool", so the paste has to
 * be easy. Shelling out to whatever the platform already has beats a dependency
 * that does the same thing.
 *
 * Failure is never fatal: the prompt also exists as a file, and the caller says
 * where. A missing xclip should not stop anybody building their app.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Copier {
  command: string;
  args: string[];
}

/**
 * Windows `clip` reads stdin in the console codepage, not UTF-8, so an emoji
 * arrives as `?????` and a Korean prompt arrives as nothing usable. Going via a
 * UTF-8 file and Set-Clipboard is longer but actually pastes what was copied.
 */
function copyOnWindows(text: string): boolean {
  const dir = mkdtempSync(join(tmpdir(), "viberaci-clip-"));
  const file = join(dir, "prompt.txt");
  try {
    writeFileSync(file, text, "utf8");
    const result = spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Set-Clipboard -Value (Get-Content -LiteralPath '${file.replace(/'/g, "''")}' -Raw -Encoding UTF8)`,
      ],
      { encoding: "utf8", windowsHide: true },
    );
    return !result.error && result.status === 0;
  } catch {
    return false;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function copierFor(platform: NodeJS.Platform): Copier[] {
  if (platform === "darwin") return [{ command: "pbcopy", args: [] }];
  // Wayland first, then X11: a Wayland session usually has neither xclip nor a
  // working DISPLAY, and trying it first produces a confusing error.
  return [
    { command: "wl-copy", args: [] },
    { command: "xclip", args: ["-selection", "clipboard"] },
    { command: "xsel", args: ["--clipboard", "--input"] },
  ];
}

export function copyToClipboard(text: string, platform = process.platform): boolean {
  if (platform === "win32") return copyOnWindows(text);

  for (const { command, args } of copierFor(platform)) {
    const result = spawnSync(command, args, { input: text, encoding: "utf8", windowsHide: true });
    if (!result.error && result.status === 0) return true;
  }
  return false;
}
