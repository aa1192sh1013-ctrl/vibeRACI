/**
 * A plan built from rules, with no model involved.
 *
 * This exists so the tool is never completely dead. Someone whose CLI will not
 * log in and who has no API key still gets a sane team and a real project, and
 * a generic plan they can edit beats an error message they cannot.
 *
 * It is honest about what it is: the caller is told the plan came from here so
 * it can say so rather than passing this off as considered advice.
 */
import type { Locale } from "../core/schema.js";
import type { Answers } from "./answers.js";
import type { PlannerOutput } from "./output-schema.js";

/**
 * Words that mean "this needs a server and somewhere to keep data".
 * Crude by design -- the cost of guessing wrong is one extra role in a plan
 * the user can edit, not a broken project.
 */
const BACKEND_HINTS = [
  "login", "log in", "sign up", "signup", "account", "user", "auth",
  "database", "save", "store", "upload", "post", "comment", "chat",
  "message", "payment", "pay", "buy", "sell", "order", "book", "api",
  "로그인", "회원", "가입", "계정", "사용자", "데이터", "저장", "업로드",
  "게시", "댓글", "채팅", "메시지", "결제", "구매", "판매", "주문", "예약",
];

function needsBackend(answers: Answers): boolean {
  if (answers.goal === "demo") return false;
  const idea = answers.idea.toLowerCase();
  return BACKEND_HINTS.some((hint) => idea.includes(hint));
}

interface Copy {
  projectName: string;
  stackWhy: string;
  architect: RoleCopy;
  ui: RoleCopy;
  feature: RoleCopy;
  reviewer: RoleCopy;
  sharedNote: string;
}

interface RoleCopy {
  displayName: string;
  summary: string;
  responsibilities: string[];
  title: string;
  goal: string;
  tasks: string[];
  doneWhen: string[];
}

const COPY: Record<Locale, Copy> = {
  en: {
    projectName: "My Project",
    stackWhy:
      "One project runs both the screens and the server, and the database is a single file you can delete to start over.",
    architect: {
      displayName: "Architect",
      summary: "Decides how the app is put together before anyone builds a feature.",
      responsibilities: [
        "Decide what the app's data looks like",
        "Write down the folder layout the others build into",
        "Write down the addresses the screens will call",
      ],
      title: "Plan the structure",
      goal: "Decide the shape of the data and the folders, so nobody else has to guess.",
      tasks: [
        "Write docs/architecture.md describing the folders and what goes in each",
        "Write docs/data-model.md describing the data and how the pieces relate",
        "Write docs/api.md listing every address the screens will call",
        "Create shared/types.ts with the types for that data",
      ],
      doneWhen: [
        "docs/architecture.md, docs/data-model.md and docs/api.md all exist",
        "shared/types.ts exists",
        "No code outside docs/ and shared/types.ts was created",
      ],
    },
    ui: {
      displayName: "UI Developer",
      summary: "Builds the screens people actually click on.",
      responsibilities: [
        "Build every screen the app needs",
        "Connect the screens to real data",
        "Show something sensible while loading and when there is nothing to show",
      ],
      title: "Build the screens",
      goal: "Build everything a person sees and clicks.",
      tasks: [
        "Read docs/api.md first, if it exists, so the screens call the right addresses",
        "Build the main screen",
        "Build the remaining screens the idea needs",
        "Make sure every screen can be reached by clicking",
      ],
      doneWhen: [
        "Every screen can be reached by clicking, with no dead links",
        "The screens show real data, not placeholder text",
      ],
    },
    feature: {
      displayName: "Feature Developer",
      summary: "Builds login, the database, and everything behind the screens.",
      responsibilities: [
        "Create the database and its tables",
        "Build sign up and log in",
        "Build the addresses the screens call",
      ],
      title: "Build the database and login",
      goal: "Make the server side real: somewhere to keep data, accounts, and working addresses.",
      tasks: [
        "Read docs/data-model.md and docs/api.md first, if they exist",
        "Create the database and its tables",
        "Build sign up and log in",
        "Build every address the screens need",
      ],
      doneWhen: [
        "The database is created when the app starts",
        "A new account can be created and logged into",
        "Every address the screens need returns real data",
      ],
    },
    reviewer: {
      displayName: "Reviewer",
      summary: "Checks the others' work before you call it finished.",
      responsibilities: [
        "Use the app the way a real person would and find what breaks",
        "Write tests for the parts most likely to break",
        "List anything left half-finished",
      ],
      title: "Check the whole thing",
      goal: "Find what is broken or missing before this is called done.",
      tasks: [
        "Run the app and go through it as a real user would",
        "Write tests for the most important things a user does",
        "List anything half-finished, and say who should fix it",
      ],
      doneWhen: [
        "Tests exist for the main things a user does",
        "All tests pass",
        "A written list of remaining problems exists",
      ],
    },
    sharedNote:
      "Both sides use this file. Add to it, never rewrite what is already there, and say what you added when you finish.",
  },
  ko: {
    projectName: "내 프로젝트",
    stackWhy:
      "화면과 서버를 한 프로젝트에서 돌릴 수 있고, 데이터베이스는 파일 하나라 지우고 다시 시작하기 쉽습니다.",
    architect: {
      displayName: "설계자",
      summary: "기능을 만들기 전에 앱의 뼈대를 먼저 정합니다.",
      responsibilities: [
        "앱이 다룰 데이터의 모양을 정합니다",
        "다른 팀원들이 작업할 폴더 구조를 적어둡니다",
        "화면이 호출할 주소를 적어둡니다",
      ],
      title: "구조 정하기",
      goal: "데이터와 폴더의 모양을 정해서, 다른 사람이 추측할 일이 없게 만듭니다.",
      tasks: [
        "docs/architecture.md에 폴더 구조와 각 폴더의 용도를 적으세요",
        "docs/data-model.md에 데이터와 그 관계를 적으세요",
        "docs/api.md에 화면이 호출할 모든 주소를 적으세요",
        "shared/types.ts에 그 데이터의 타입을 만드세요",
      ],
      doneWhen: [
        "docs/architecture.md, docs/data-model.md, docs/api.md가 모두 있다",
        "shared/types.ts가 있다",
        "docs/와 shared/types.ts 밖에는 아무 코드도 만들지 않았다",
      ],
    },
    ui: {
      displayName: "화면 개발자",
      summary: "사람들이 실제로 보고 누르는 화면을 만듭니다.",
      responsibilities: [
        "앱에 필요한 모든 화면을 만듭니다",
        "화면을 실제 데이터와 연결합니다",
        "불러오는 중일 때와 보여줄 게 없을 때도 어색하지 않게 만듭니다",
      ],
      title: "화면 만들기",
      goal: "사람이 보고 누르는 모든 것을 만듭니다.",
      tasks: [
        "docs/api.md가 있다면 먼저 읽고, 주소를 맞게 호출하세요",
        "메인 화면을 만드세요",
        "아이디어에 필요한 나머지 화면을 만드세요",
        "모든 화면이 클릭으로 도달 가능한지 확인하세요",
      ],
      doneWhen: [
        "모든 화면이 클릭으로 도달 가능하고, 끊긴 링크가 없다",
        "화면이 가짜 예시가 아니라 실제 데이터를 보여준다",
      ],
    },
    feature: {
      displayName: "기능 개발자",
      summary: "로그인, 데이터베이스 등 화면 뒤에서 돌아가는 것들을 만듭니다.",
      responsibilities: [
        "데이터베이스와 테이블을 만듭니다",
        "회원가입과 로그인을 만듭니다",
        "화면이 호출할 주소를 만듭니다",
      ],
      title: "데이터베이스와 로그인 만들기",
      goal: "서버 쪽을 실제로 동작하게 만듭니다 — 데이터 보관, 계정, 주소.",
      tasks: [
        "docs/data-model.md와 docs/api.md가 있다면 먼저 읽으세요",
        "데이터베이스와 테이블을 만드세요",
        "회원가입과 로그인을 만드세요",
        "화면에 필요한 모든 주소를 만드세요",
      ],
      doneWhen: [
        "앱을 켜면 데이터베이스가 만들어진다",
        "새 계정을 만들고 로그인할 수 있다",
        "화면에 필요한 모든 주소가 실제 데이터를 반환한다",
      ],
    },
    reviewer: {
      displayName: "검토자",
      summary: "완성이라고 하기 전에 다른 팀원의 작업을 확인합니다.",
      responsibilities: [
        "실제 사용자처럼 앱을 써보고 깨지는 곳을 찾습니다",
        "가장 깨지기 쉬운 부분에 테스트를 만듭니다",
        "덜 끝난 것들을 목록으로 정리합니다",
      ],
      title: "전체 점검하기",
      goal: "완성이라고 하기 전에 깨진 곳과 빠진 곳을 찾습니다.",
      tasks: [
        "앱을 실행해서 실제 사용자처럼 처음부터 끝까지 써보세요",
        "사용자가 하는 핵심 동작에 테스트를 만드세요",
        "덜 끝난 것을 정리하고, 누가 고쳐야 하는지 적으세요",
      ],
      doneWhen: [
        "사용자의 핵심 동작에 대한 테스트가 있다",
        "모든 테스트가 통과한다",
        "남은 문제 목록이 글로 정리돼 있다",
      ],
    },
    sharedNote:
      "양쪽이 같이 쓰는 파일입니다. 추가만 하고, 이미 있는 내용은 절대 다시 쓰지 마세요. 끝나면 무엇을 추가했는지 알려주세요.",
  },
};

export function buildTemplateOutput(answers: Answers): PlannerOutput {
  const copy = COPY[answers.locale];
  const backend = needsBackend(answers);
  const review = answers.goal !== "demo";
  const tool = answers.tools[0] ?? "claude-code";
  // Spread the work across both tools when the user has both, so the plan
  // reflects what they actually installed.
  const second = answers.tools[1] ?? tool;

  const roles: PlannerOutput["roles"] = [];
  const ownership: PlannerOutput["ownership"] = [];
  const steps: PlannerOutput["steps"] = [];
  let phase = 1;

  if (backend) {
    roles.push({
      id: "architect",
      archetype: "architect",
      displayName: copy.architect.displayName,
      summary: copy.architect.summary,
      responsibilities: copy.architect.responsibilities,
      consults: [],
      tool,
    });
    ownership.push({ glob: "docs/**", roleId: "architect", mode: "owns" });
    steps.push({
      id: "plan-structure",
      roleId: "architect",
      phase: phase++,
      title: copy.architect.title,
      goal: copy.architect.goal,
      tasks: copy.architect.tasks,
      doneWhen: copy.architect.doneWhen,
      handoffTo: backend ? ["ui", "feature"] : ["ui"],
    });
  }

  roles.push({
    id: "ui",
    archetype: "ui-developer",
    displayName: copy.ui.displayName,
    summary: copy.ui.summary,
    responsibilities: copy.ui.responsibilities,
    consults: backend ? ["feature"] : [],
    tool,
  });
  ownership.push(
    { glob: "app/**", roleId: "ui", mode: "owns" },
    { glob: "components/**", roleId: "ui", mode: "owns" },
  );

  if (backend) {
    roles.push({
      id: "feature",
      archetype: "feature-developer",
      displayName: copy.feature.displayName,
      summary: copy.feature.summary,
      responsibilities: copy.feature.responsibilities,
      consults: ["architect"],
      tool: second,
    });
    ownership.push(
      { glob: "server/**", roleId: "feature", mode: "owns" },
      { glob: "db/**", roleId: "feature", mode: "owns" },
      { glob: "docs/**", roleId: "ui", mode: "reads" },
      { glob: "docs/**", roleId: "feature", mode: "reads" },
      { glob: "server/**", roleId: "ui", mode: "reads" },
      { glob: "shared/types.ts", roleId: "ui", mode: "shared", note: copy.sharedNote },
      { glob: "shared/types.ts", roleId: "feature", mode: "shared", note: copy.sharedNote },
    );

    const backendPhase = phase++;
    steps.push({
      id: "build-backend",
      roleId: "feature",
      phase: backendPhase,
      title: copy.feature.title,
      goal: copy.feature.goal,
      tasks: copy.feature.tasks,
      doneWhen: copy.feature.doneWhen,
      handoffTo: review ? ["ui", "reviewer"] : ["ui"],
    });
    steps.push({
      id: "build-ui",
      roleId: "ui",
      phase: backendPhase,
      title: copy.ui.title,
      goal: copy.ui.goal,
      tasks: copy.ui.tasks,
      doneWhen: copy.ui.doneWhen,
      handoffTo: review ? ["reviewer"] : [],
    });
  } else {
    steps.push({
      id: "build-ui",
      roleId: "ui",
      phase: phase++,
      title: copy.ui.title,
      goal: copy.ui.goal,
      tasks: copy.ui.tasks,
      doneWhen: copy.ui.doneWhen,
      handoffTo: review ? ["reviewer"] : [],
    });
  }

  if (review) {
    roles.push({
      id: "reviewer",
      archetype: "reviewer",
      displayName: copy.reviewer.displayName,
      summary: copy.reviewer.summary,
      responsibilities: copy.reviewer.responsibilities,
      consults: backend ? ["ui", "feature"] : ["ui"],
      tool,
    });
    ownership.push(
      { glob: "tests/**", roleId: "reviewer", mode: "owns" },
      { glob: "app/**", roleId: "reviewer", mode: "reads" },
    );
    if (backend) ownership.push({ glob: "server/**", roleId: "reviewer", mode: "reads" });

    steps.push({
      id: "review",
      roleId: "reviewer",
      phase: phase++,
      title: copy.reviewer.title,
      goal: copy.reviewer.goal,
      tasks: copy.reviewer.tasks,
      doneWhen: copy.reviewer.doneWhen,
      handoffTo: [],
    });
  } else {
    // A single role is not a team, and the schema requires at least two.
    roles.push({
      id: "reviewer",
      archetype: "reviewer",
      displayName: copy.reviewer.displayName,
      summary: copy.reviewer.summary,
      responsibilities: copy.reviewer.responsibilities,
      consults: ["ui"],
      tool,
    });
    ownership.push(
      { glob: "tests/**", roleId: "reviewer", mode: "owns" },
      { glob: "app/**", roleId: "reviewer", mode: "reads" },
    );
    steps.push({
      id: "review",
      roleId: "reviewer",
      phase: phase++,
      title: copy.reviewer.title,
      goal: copy.reviewer.goal,
      tasks: copy.reviewer.tasks,
      doneWhen: copy.reviewer.doneWhen,
      handoffTo: [],
    });
  }

  return {
    projectName: copy.projectName,
    stack: {
      name: backend ? "Next.js + SQLite" : "Vite + React",
      why: copy.stackWhy,
      packages: backend ? ["next", "react", "better-sqlite3"] : ["vite", "react"],
    },
    roles,
    ownership,
    steps,
  };
}
