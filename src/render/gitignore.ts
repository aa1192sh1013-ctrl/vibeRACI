/**
 * `.gitignore` for the generated project.
 *
 * Beginners commit `node_modules` and secret files by accident, and once a
 * secret is pushed it is public forever. This is worth getting right even
 * though it is a boring file.
 */
import type { Plan } from "../core/schema.js";

export function renderGitignore(plan: Plan): string {
  const lines = [
    "# Dependencies",
    "node_modules/",
    "",
    "# Secrets -- never commit these",
    ".env",
    ".env.*",
    "!.env.example",
    "",
    "# Build output",
    "dist/",
    "build/",
    "",
    "# Logs and editor noise",
    "*.log",
    ".DS_Store",
  ];

  const packages = plan.stack.packages.map((p) => p.toLowerCase());
  const has = (name: string) => packages.some((p) => p === name || p.startsWith(`${name}@`));

  if (has("next")) lines.push("", "# Next.js", ".next/", "out/");
  if (has("vite")) lines.push("", "# Vite", ".vite/");
  if (has("better-sqlite3") || has("sqlite3") || has("prisma")) {
    lines.push("", "# Local database files", "*.db", "*.db-journal", "*.sqlite", "*.sqlite3");
  }

  lines.push("", "# vibecrew keeps your plan here; the progress file is local only", ".vibecrew/progress.json");

  return `${lines.join("\n")}\n`;
}
