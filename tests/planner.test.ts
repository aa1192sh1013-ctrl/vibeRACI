import { describe, expect, it } from "vitest";
import { safeParsePlan } from "../src/core/schema.js";
import type { Answers } from "../src/planner/answers.js";
import { assemblePlan, deriveScaffold } from "../src/planner/assemble.js";
import { extractJson } from "../src/planner/extract-json.js";
import { createPlan } from "../src/planner/index.js";
import { plannerOutputSchema } from "../src/planner/output-schema.js";
import type { Provider } from "../src/planner/providers/types.js";
import { ProviderError } from "../src/planner/providers/types.js";
import { buildTemplateOutput } from "../src/planner/template.js";
import { renderAll } from "../src/render/index.js";

const answers: Answers = {
  idea: "A marketplace where people sell used furniture, chat with a buyer, and agree on a price.",
  goal: "mvp",
  experience: "none",
  tools: ["claude-code", "codex"],
  locale: "en",
};

const noTools: NodeJS.ProcessEnv = {};

/** A provider that says whatever it is told to, without touching a network. */
function fakeProvider(replies: string[], id = "fake"): Provider {
  let call = 0;
  return {
    id,
    label: "a test double",
    async complete() {
      const reply = replies[Math.min(call, replies.length - 1)];
      call++;
      if (reply === undefined) throw new ProviderError(id, "no reply configured");
      return reply;
    },
  };
}

function failingProvider(message: string, id = "broken"): Provider {
  return {
    id,
    label: "a broken tool",
    async complete() {
      throw new ProviderError(id, message);
    },
  };
}

describe("reading what the model said", () => {
  it("accepts bare JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("accepts a markdown fence", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("accepts JSON buried in chatter", () => {
    expect(extractJson('Sure! Here is the plan:\n{"a":1}\nHope that helps.')).toEqual({ a: 1 });
  });

  it("is not fooled by braces inside strings", () => {
    expect(extractJson('{"note":"use {curly} braces"}')).toEqual({ note: "use {curly} braces" });
  });

  it("gives up loudly when there is no JSON at all", () => {
    expect(() => extractJson("I cannot help with that.")).toThrow(/no JSON object found/);
  });
});

describe("deriving the folder layout from who owns what", () => {
  it("turns globs into directories", () => {
    const entries = deriveScaffold([
      { glob: "app/**", roleId: "ui", mode: "owns" },
      { glob: "server/api/*.ts", roleId: "feature", mode: "owns" },
    ]);
    expect(entries).toEqual([
      { path: "app", kind: "dir", ownerRoleId: "ui" },
      { path: "server/api", kind: "dir", ownerRoleId: "feature" },
    ]);
  });

  it("ignores paths a role only reads, since their owner brings them", () => {
    const entries = deriveScaffold([
      { glob: "app/**", roleId: "ui", mode: "owns" },
      { glob: "docs/**", roleId: "ui", mode: "reads" },
    ]);
    expect(entries.map((e) => e.path)).toEqual(["app"]);
  });

  it("leaves a directory two roles share unattributed", () => {
    const note = "add only";
    const entries = deriveScaffold([
      { glob: "shared/types.ts", roleId: "ui", mode: "shared", note },
      { glob: "shared/types.ts", roleId: "feature", mode: "shared", note },
    ]);
    expect(entries).toEqual([{ path: "shared", kind: "dir" }]);
  });

  it("keeps only the deepest directory, not its parents", () => {
    const entries = deriveScaffold([
      { glob: "db/**", roleId: "feature", mode: "owns" },
      { glob: "db/migrations/**", roleId: "feature", mode: "owns" },
    ]);
    expect(entries.map((e) => e.path)).toEqual(["db/migrations"]);
  });

  it("skips files that sit at the project root", () => {
    expect(deriveScaffold([{ glob: "README.md", roleId: "ui", mode: "owns" }])).toEqual([]);
  });
});

describe("the plan built from rules alone", () => {
  it("is a valid plan for every combination of answers", () => {
    const goals = ["demo", "mvp", "deploy"] as const;
    const locales = ["en", "ko"] as const;
    const toolSets = [["claude-code"], ["codex"], ["claude-code", "codex"]] as const;

    for (const goal of goals) {
      for (const locale of locales) {
        for (const tools of toolSets) {
          const a: Answers = { ...answers, goal, locale, tools: [...tools] };
          const output = plannerOutputSchema.parse(buildTemplateOutput(a));
          const plan = assemblePlan(a, output);
          expect(safeParsePlan(plan).success, `${goal}/${locale}/${tools}`).toBe(true);
        }
      }
    }
  });

  it("gives a visual demo no server work", () => {
    const output = buildTemplateOutput({ ...answers, goal: "demo" });
    expect(output.roles.map((r) => r.id)).not.toContain("feature");
  });

  it("adds a server role when the idea clearly needs one", () => {
    const output = buildTemplateOutput({ ...answers, idea: "a site with login and a database" });
    expect(output.roles.map((r) => r.id)).toContain("feature");
  });

  it("notices Korean words for the same things", () => {
    const output = buildTemplateOutput({
      ...answers,
      locale: "ko",
      idea: "사용자가 로그인하고 게시글을 올리는 사이트",
    });
    expect(output.roles.map((r) => r.id)).toContain("feature");
  });

  it("writes in the user's language", () => {
    const output = buildTemplateOutput({ ...answers, locale: "ko" });
    expect(output.roles[0]?.summary).toMatch(/[가-힣]/);
  });

  it("spreads work across both tools when the user has both", () => {
    const output = buildTemplateOutput({ ...answers, tools: ["claude-code", "codex"] });
    expect(new Set(output.roles.map((r) => r.tool)).size).toBe(2);
  });

  it("uses only the one tool when that is all the user has", () => {
    const output = buildTemplateOutput({ ...answers, tools: ["codex"] });
    expect(new Set(output.roles.map((r) => r.tool))).toEqual(new Set(["codex"]));
  });

  it("rejects a plan that hands work to a tool the user does not have", () => {
    // Seen on the first real run: the model staffed a role with Codex on a
    // machine where Codex was not installed.
    const single: Answers = { ...answers, tools: ["claude-code"] };
    const output = buildTemplateOutput(single);
    const withMissingTool = {
      ...output,
      roles: output.roles.map((r, i) => (i === 0 ? { ...r, tool: "codex" as const } : r)),
    };
    expect(() => assemblePlan(single, withMissingTool)).toThrow(/not one of the tools/);
  });

  it("produces a plan that renders all the way to files", () => {
    const plan = assemblePlan(answers, buildTemplateOutput(answers));
    const paths = renderAll(plan).map((f) => f.path);
    expect(paths).toContain("START-HERE.md");
    const agentSteps = plan.steps.filter((s) => s.kind === "agent");
    expect(paths.filter((p) => p.startsWith(".agents/prompts/"))).toHaveLength(agentSteps.length);
  });

  it("always ends with the user opening what they built", () => {
    // A project nobody ever ran is not finished, and no agent can run it for them.
    for (const goal of ["demo", "mvp", "deploy"] as const) {
      const output = buildTemplateOutput({ ...answers, goal });
      const last = output.steps.at(-1);
      expect(last?.kind, goal).toBe("human");
      expect(last?.roleId, goal).toBeUndefined();
    }
  });
});

describe("planning with a model", () => {
  const goodOutput = () => JSON.stringify(buildTemplateOutput(answers));

  it("uses what the model returned", async () => {
    const result = await createPlan(answers, {
      providers: [fakeProvider([goodOutput()], "claude-cli")],
      env: noTools,
    });
    expect(result.source).toBe("claude-cli");
    expect(result.notes).toHaveLength(0);
    expect(safeParsePlan(result.plan).success).toBe(true);
  });

  it("fills in metadata from the user's own answers, not the model's", async () => {
    const output = { ...buildTemplateOutput(answers), projectName: "Furniture Market" };
    const result = await createPlan(answers, {
      providers: [fakeProvider([JSON.stringify(output)])],
      env: noTools,
    });
    expect(result.plan.meta.idea).toBe(answers.idea);
    expect(result.plan.meta.goal).toBe("mvp");
    expect(result.plan.meta.projectName).toBe("Furniture Market");
  });

  it("gives emoji from the archetype rather than trusting the model", async () => {
    const output = buildTemplateOutput(answers);
    const result = await createPlan(answers, {
      providers: [fakeProvider([JSON.stringify({ ...output, roles: output.roles })])],
      env: noTools,
    });
    const ui = result.plan.roles.find((r) => r.archetype === "ui-developer");
    expect(ui?.emoji).toBe("🎨");
  });

  it("tells a model that broke the rules exactly what was wrong, and accepts the fix", async () => {
    const broken = buildTemplateOutput(answers);
    // Two roles claiming the same folder is the bug this product exists to stop.
    const bad = {
      ...broken,
      ownership: [...broken.ownership, { glob: "app/**", roleId: "reviewer", mode: "owns" }],
    };
    const provider = fakeProvider([JSON.stringify(bad), JSON.stringify(broken)], "claude-cli");
    const result = await createPlan(answers, { providers: [provider], env: noTools });
    expect(result.source).toBe("claude-cli");
  });

  it("moves to the next tool when the first will not run", async () => {
    const result = await createPlan(answers, {
      providers: [
        failingProvider("Not logged in · Please run /login", "claude-cli"),
        fakeProvider([goodOutput()], "codex-cli"),
      ],
      env: noTools,
    });
    expect(result.source).toBe("codex-cli");
    expect(result.notes.join("\n")).toContain("/login");
  });

  it("explains a login failure in terms the user can act on", async () => {
    const result = await createPlan(answers, {
      providers: [failingProvider("Not logged in · Please run /login", "claude-cli")],
      env: noTools,
    });
    const note = result.notes.join("\n");
    expect(note).toContain("not the same thing");
    expect(note).toContain("/login");
    expect(note).not.toContain("undefined");
  });

  it("still produces a working project when nothing at all is available", async () => {
    const result = await createPlan(answers, {
      providers: [failingProvider("could not run claude: ENOENT")],
      env: noTools,
    });
    expect(result.source).toBe("template");
    expect(safeParsePlan(result.plan).success).toBe(true);
    expect(result.notes.join("\n")).toContain("without using AI");
  });

  it("refuses rather than quietly guessing when the fallback is turned off", async () => {
    await expect(
      createPlan(answers, {
        providers: [failingProvider("could not run claude: ENOENT")],
        allowTemplate: false,
        env: noTools,
      }),
    ).rejects.toThrow(/No AI tool could plan this project/);
  });

  it("falls back rather than looping forever on a model that will not comply", async () => {
    const provider = fakeProvider(['{"nonsense": true}'], "claude-cli");
    const result = await createPlan(answers, {
      providers: [provider],
      maxRepairAttempts: 1,
      env: noTools,
    });
    expect(result.source).toBe("template");
  });

  it("keeps the lane when one call fails for no stated reason", async () => {
    // A real run was lost this way: one opaque failure, and a plan that knew
    // nothing about the user's idea came back instead.
    let calls = 0;
    const provider: Provider = {
      id: "claude-cli",
      label: "Claude Code",
      async complete() {
        calls++;
        if (calls === 1) throw new ProviderError("claude-cli", "claude returned an error");
        return goodOutput();
      },
    };

    const result = await createPlan(answers, {
      providers: [provider],
      env: noTools,
      sleep: async () => {},
    });

    expect(result.source).toBe("claude-cli");
    expect(calls).toBe(2);
  });

  it("does not spend retries on a tool that is not installed", async () => {
    let calls = 0;
    const provider: Provider = {
      id: "claude-cli",
      label: "Claude Code",
      async complete() {
        calls++;
        throw new ProviderError("claude-cli", "could not run claude: ENOENT");
      },
    };

    const result = await createPlan(answers, {
      providers: [provider],
      env: noTools,
      sleep: async () => {},
    });

    expect(result.source).toBe("template");
    expect(calls).toBe(1);
  });
});
