/**
 * The complete set of files a new project starts with.
 *
 * Still pure -- this decides *what* a workspace contains, while `write.ts`
 * decides how it reaches the disk. Keeping the two apart means the entire
 * workspace can be inspected in a test without touching a filesystem, and it
 * is what makes a dry run trivially honest: the same list, just not written.
 */
import type { Plan } from "../core/schema.js";
import { renderGitignore } from "../render/gitignore.js";
import { renderProjectReadme } from "../render/project-readme.js";
import { type RenderedFile, renderAll } from "../render/index.js";

export interface Workspace {
  /** Directories to create, including ones that end up empty. */
  dirs: string[];
  files: RenderedFile[];
}

export function planWorkspace(plan: Plan): Workspace {
  const files: RenderedFile[] = [
    ...renderAll(plan),
    { path: "README.md", content: renderProjectReadme(plan) },
    { path: ".gitignore", content: renderGitignore(plan) },
    // The plan travels with the project. Later commands read it back, and a
    // user who wants to change the team edits this and re-generates.
    { path: ".vibecrew/plan.json", content: `${JSON.stringify(plan, null, 2)}\n` },
  ];

  for (const entry of plan.scaffold) {
    if (entry.kind === "file") {
      files.push({ path: entry.path, content: entry.content ?? "" });
    }
  }

  const dirs = plan.scaffold.filter((e) => e.kind === "dir").map((e) => e.path);

  // Git does not track empty directories, so the folder layout -- which is how
  // the ownership split is actually visible -- would vanish on first clone.
  const occupied = new Set(files.map((f) => dirOf(f.path)));
  for (const dir of dirs) {
    if (![...occupied].some((d) => d === dir || d.startsWith(`${dir}/`))) {
      files.push({ path: `${dir}/.gitkeep`, content: "" });
    }
  }

  return {
    dirs: [...new Set(dirs)].sort(),
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

function dirOf(filePath: string): string {
  const i = filePath.lastIndexOf("/");
  return i === -1 ? "" : filePath.slice(0, i);
}
