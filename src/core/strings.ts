/**
 * Fixed framework wording, translated at render time.
 *
 * Only boilerplate lives here. Project-specific sentences ("Build the chat
 * screen") come from the Plan, written in `plan.meta.locale`. That split is
 * what lets one Plan render into either language without the planner having
 * to write everything twice.
 */
import type { Locale } from "./schema.js";

export interface Strings {
  // shared
  ownedPaths: string;
  readOnlyPaths: string;
  sharedPaths: string;
  deniedPaths: string;
  yourJob: string;
  doneWhen: string;
  // agent charter / prompt
  youAre: string;
  primaryResponsibility: string;
  mustNotModify: string;
  needSomethingElse: string;
  handoffHeading: string;
  handoffRule: (roles: string) => string;
  outOfScopeRule: string;
  humanIsOwner: string;
  // runbook
  runbookTitle: (project: string) => string;
  runbookIntro: string;
  teamHeading: string;
  planHeading: string;
  phaseLabel: (n: number) => string;
  independentNote: string;
  sequentialNote: string;
  stepHeading: (n: number, title: string) => string;
  howToRun: (tool: string) => string;
  copyPromptFrom: (path: string) => string;
  whenFinished: string;
  /** Human steps: the user is the one doing it, so there is nothing to paste. */
  yourTurn: string;
  whenFinishedHuman: string;
  allDone: string;
  // CLI wording that sits directly beside translated text on the `next` screen,
  // where switching language mid-sentence is most obvious.
  orCopyToClipboard: (command: string) => string;
  alreadyOnClipboard: string;
  copyBetweenLines: string;
  clipboardUnavailable: string;
  thenRun: string;
  whatToDoNow: string;
  // `init`
  askIdea: string;
  askIdeaHint: string;
  askGoal: string;
  goalDemo: string;
  goalMvp: string;
  goalDeploy: string;
  workingOutTeam: string;
  planningTakesAWhile: string;
  filesCreated: (count: number) => string;
  gitStarted: string;
  buildOrderIn: (file: string) => string;
  countingNote: string;
  alreadyAProject: string;
  alreadyAProjectHint: string;
  folderNotEmpty: string;
  folderNotEmptyHint: string;
  noToolsUsable: string;
  noToolsHint: string;
  carryingOnAnyway: string;
  // `doctor`
  checkingComputer: string;
  toolReady: (label: string) => string;
  toolInstalled: (label: string) => string;
  gitReady: string;
  gitMissing: string;
  gitNoIdentity: string;
  nodeReady: (version: string) => string;
  nodeTooOld: (version: string) => string;
  noToolAtAll: string;
  runDoctorAgain: string;
  readyToBuild: string;
  initExample: string;
  // what `doctor` found, and what to do about it
  apiKeyLabel: string;
  claudeMissing: string;
  claudeMissingFix: string;
  claudeLoginUnknown: string;
  codexMissing: string;
  codexMissingFix: string;
  codexLoggedIn: string;
  codexNotLoggedIn: string;
  codexNotLoggedInFix: string;
  apiKeyFound: string;
  apiKeyMissing: string;
  // failures worth explaining rather than passing through
  claudeNeedsLogin: string;
  codexNeedsLogin: string;
  toolWouldNotStart: string;
  requestTimedOut: string;
  apiKeyRejected: string;
  accountCannotRequest: string;
  // the web page
  uiTitle: string;
  uiSubtitle: string;
  uiCheckingTools: string;
  uiToolsOk: string;
  uiToolsBad: string;
  uiStartButton: string;
  uiWorking: string;
  uiCopyPrompt: string;
  uiCopied: string;
  uiOpenTool: (tool: string) => string;
  uiMarkDone: string;
  uiUndo: string;
  uiStepOf: (n: number, total: number) => string;
  uiFinishedTitle: string;
  uiFinishedBody: string;
  uiFolder: string;
  uiIdeaPlaceholder: string;
  uiNeedIdea: string;
  uiSomethingWentWrong: string;
  // the setup guide that opens the page
  setupHeading: string;
  setupNode: string;
  setupNodeHow: string;
  setupTool: string;
  setupToolHow: string;
  setupAccount: string;
  setupAccountHow: string;
  setupKeepOpen: string;
  setupKeepOpenHow: string;
  // attaching a written brief
  uploadLabel: string;
  uploadHint: string;
  uploadChosen: (name: string) => string;
  uploadClear: string;
  uploadTooBig: string;
  uploadWrongType: string;
  // the closing report
  reportOpen: string;
  reportTitle: string;
  reportIntro: string;
  reportBack: string;
  reportBuiltHeading: string;
  reportBuiltNote: string;
  reportNoFiles: string;
  reportFileCount: (count: number) => string;
  reportCheckHeading: string;
  reportCheckStepsDone: (done: number, total: number) => string;
  reportCheckFilesTotal: (count: number) => string;
  reportCheckEmptyArea: (role: string) => string;
  reportCheckAllAreasFilled: string;
  reportCheckYourTurn: string;
  reportNextHeading: string;
  reportNextIntro: string;
  suggestUseIt: string;
  suggestShowSomeone: string;
  suggestReadme: string;
  suggestCommit: string;
  suggestTests: string;
  suggestDeploy: string;
  suggestUnderstand: string;
  // errors
  notAProject: string;
  notAProjectHint: string;
  // project docs
  claudeMdIntro: string;
  agentsMdIntro: string;
  generatedBy: string;
  doNotEditByHand: string;
}

const en: Strings = {
  ownedPaths: "Files you own",
  readOnlyPaths: "Read these, do not change them",
  sharedPaths: "Shared files — edit with care",
  deniedPaths: "Do not touch",
  yourJob: "Your job",
  doneWhen: "Check these are done",
  youAre: "You are",
  primaryResponsibility: "What you take care of",
  mustNotModify: "What you must not modify",
  needSomethingElse: "If you need to change something else",
  handoffHeading: "Handing off",
  handoffRule: (roles) =>
    `When you finish, write a short summary of what changed for: ${roles}. ` +
    `Keep it to the facts another developer would need: new files, new endpoints, changed data shapes.`,
  outOfScopeRule:
    "If the work requires changing a file outside the list above:\n" +
    "1. Do not change it yourself.\n" +
    "2. Write down exactly what needs to change and why.\n" +
    "3. Tell the user which teammate should handle it.\n" +
    "4. Continue with the parts you can do.",
  humanIsOwner:
    "The human is the owner of this project. Ask them before anything destructive, " +
    "anything involving credentials or deployment, or any decision that would be hard to undo.",
  runbookTitle: (project) => `Building ${project}`,
  runbookIntro:
    "This is your build order. Work through it top to bottom. " +
    "Each step has a prompt to copy into a coding agent — you do not need to write it yourself.",
  teamHeading: "Your AI team",
  planHeading: "The plan",
  phaseLabel: (n) => `Phase ${n}`,
  independentNote:
    "These steps do not depend on each other. Still do them one at a time — two agents working in the same folder will overwrite each other.",
  sequentialNote: "Finish this before starting the next step.",
  stepHeading: (n, title) => `Step ${n} — ${title}`,
  howToRun: (tool) => `Open ${tool} in this project folder.`,
  copyPromptFrom: (path) => `Copy everything in ${path} and paste it in.`,
  whenFinished: "When the agent says it is finished, check the list above, then move to the next step.",
  yourTurn: "This one is yours. No AI for this step — a coding agent cannot open your app and look at it.",
  whenFinishedHuman:
    "Tick everything off, then move to the next step. If something is wrong, say what you saw when you start the next agent.",
  allDone: "That is the whole plan. Your project should now run.",
  orCopyToClipboard: (command) => `or run ${command} to put it on your clipboard`,
  alreadyOnClipboard: "Paste. The prompt is already on your clipboard.",
  copyBetweenLines: "Copy everything between the lines below and paste it in.",
  clipboardUnavailable: "Could not reach the clipboard, so copy it from the file instead.",
  thenRun: "then run:",
  whatToDoNow: "what to do now:",
  askIdea: "What do you want to build?",
  askIdeaHint:
    "A sentence or two works. So does a page — the more you say, the better the plan fits. Plain words are fine.",
  askGoal: "How far do you want to take it?",
  goalDemo: "Just something to look at",
  goalMvp: "Something that actually works",
  goalDeploy: "Something other people can use online",
  workingOutTeam: "Working out your team",
  planningTakesAWhile:
    "Usually about five minutes, sometimes longer. It is one request to your own coding tool.",
  filesCreated: (count) => `${count} files created`,
  gitStarted: "git started, so you can undo anything later",
  buildOrderIn: (file) => `your build order is in ${file}`,
  countingNote:
    "Counted one project built, so I know whether anyone is using this. Nothing about you or your idea is sent. Turn it off with VIBESQUAD_NO_COUNT=1",
  alreadyAProject: "There is already a vibesquad project in this folder.",
  alreadyAProjectHint: "Run  vibesquad status  to see it, or start somewhere else.",
  folderNotEmpty: "This folder already has files with those names, so nothing was written.",
  folderNotEmptyHint: "Start in an empty folder instead.",
  noToolsUsable: "Neither Claude Code nor Codex is usable on this computer.",
  noToolsHint: "Run  vibesquad doctor  to see why.",
  carryingOnAnyway:
    "Carrying on anyway: you will get a general plan rather than one about your idea.",
  checkingComputer: "Checking your computer",
  toolReady: (label) => `${label}: ready`,
  toolInstalled: (label) => `${label}: installed`,
  gitReady: "git: ready",
  gitMissing: "git: not installed. Your project will still work, but nothing will be saved as you go.",
  gitNoIdentity: "git: installed, but it does not know your name and email yet.",
  nodeReady: (version) => `Node ${version}: ready`,
  nodeTooOld: (version) => `Node ${version} is older than vibesquad needs. Install Node 20 or newer.`,
  noToolAtAll: "No AI coding tool is usable, so vibesquad cannot plan your project properly.",
  runDoctorAgain: "Fix one of the warnings above, then run  vibesquad doctor  again.",
  readyToBuild: "You are ready to build.",
  initExample: 'vibesquad init "what you want to build"',
  apiKeyLabel: "your Anthropic API key",
  claudeMissing:
    "No command-line Claude Code here. Being signed in to the Claude app is not the same thing -- vibesquad drives the one your terminal can run.",
  claudeMissingFix:
    "Install Claude Code, then close and reopen your terminal so `claude` is found.",
  claudeLoginUnknown:
    "Claude Code is installed. Whether it is logged in is checked when it is used.",
  codexMissing:
    "No command-line Codex here. Codex inside the ChatGPT app is a different thing -- vibesquad drives the one your terminal can run.",
  codexMissingFix: "Install it with:  npm install -g @openai/codex",
  codexLoggedIn: "Logged in.",
  codexNotLoggedIn: "Codex is installed but not logged in.",
  codexNotLoggedInFix: "Run: codex login",
  apiKeyFound: "Found an API key in ANTHROPIC_API_KEY.",
  apiKeyMissing: "No API key set. This is only needed if neither Claude Code nor Codex works.",
  claudeNeedsLogin: [
    "Claude Code is installed but its command line is not logged in.",
    "(Being signed in to the Claude app is not the same thing.)",
    "",
    "Fix it once:",
    "  1. Run: claude",
    "  2. Type: /login",
    "  3. Finish signing in, then type: exit",
  ].join("\n"),
  codexNeedsLogin: "Codex is not logged in. Run: codex login",
  toolWouldNotStart: "That tool could not be started. Close and reopen your terminal, then try again.",
  requestTimedOut: "That took too long and was stopped. Check your internet connection and try again.",
  apiKeyRejected: "That API key was rejected. Check ANTHROPIC_API_KEY for a typo or an expired key.",
  accountCannotRequest: "That account cannot make requests right now.",
  uiTitle: "Build your AI coding team",
  uiSubtitle: "Tell me what you want to build. I will work out who does what.",
  uiCheckingTools: "Checking your computer",
  uiToolsOk: "Your computer is ready.",
  uiToolsBad: "Something needs fixing before this will work well.",
  uiStartButton: "Build my team",
  uiWorking:
    "Working out your team. Usually about five minutes, sometimes longer — you can leave this page open.",
  uiCopyPrompt: "Copy this prompt",
  uiCopied: "Copied — now paste it",
  uiOpenTool: (tool) => `Open ${tool} in this folder, then paste`,
  uiMarkDone: "Done — what is next?",
  uiUndo: "Not done yet, undo",
  uiStepOf: (n, total) => `Step ${n} of ${total}`,
  uiFinishedTitle: "That is the whole plan",
  uiFinishedBody: "Your project should now run. Open it and see.",
  uiFolder: "Building in",
  uiIdeaPlaceholder: "A site where I keep my recipes and search them by ingredient",
  uiNeedIdea: "Write a sentence about what you want to build first.",
  uiSomethingWentWrong: "That did not work.",
  setupHeading: "Before you start",
  setupNode: "Node.js 20 or newer",
  setupNodeHow:
    "You already have it, or this page would not be open. If a friend gets stuck, they install it from nodejs.org and then open a new terminal.",
  setupTool: "Claude Code or Codex, signed in",
  setupToolHow:
    "The command-line version, not the app. Being signed in to the Claude or ChatGPT app is a different thing. Without one you still get a project, but the plan will be generic rather than about your idea.",
  setupAccount: "It uses your own AI account",
  setupAccountHow:
    "Working out your team sends one request through your own Claude Code or Codex. There is nothing to sign up for and nothing extra to pay, but it does use your own allowance.",
  setupKeepOpen: "Leave the terminal open while it works",
  setupKeepOpenHow:
    "Working out your team takes about five minutes. Close the terminal during that and the plan is lost. Once your project exists, your progress is saved — closing it just means running vibesquad ui again to carry on.",
  uploadLabel: "Have a written brief? Attach it.",
  uploadHint: "Optional. A .txt or .md file, up to 100 KB. Its contents go into the plan with your idea.",
  uploadChosen: (name) => `${name} attached`,
  uploadClear: "remove",
  uploadTooBig: "That file is too big. 100 KB is the limit.",
  uploadWrongType: "Only plain text files work here — .txt or .md.",
  reportOpen: "See the report",
  reportTitle: "What your team built",
  reportIntro:
    "Everything below is read from your project folder as it is right now. Nothing here is a guess.",
  reportBack: "Back",
  reportBuiltHeading: "What is in each teammate's area",
  reportBuiltNote:
    "vibesquad cannot watch the coding tools work, so this is the files that now exist where each teammate was responsible — not a claim about who typed what.",
  reportNoFiles: "Nothing here yet",
  reportFileCount: (count) => (count === 1 ? "1 file" : `${count} files`),
  reportCheckHeading: "A quick check",
  reportCheckStepsDone: (done, total) => `${done} of ${total} steps ticked off`,
  reportCheckFilesTotal: (count) => `${count} files in the project`,
  reportCheckEmptyArea: (role) => `${role} has no files yet — that step may not have run`,
  reportCheckAllAreasFilled: "Every teammate's area has something in it",
  reportCheckYourTurn: "Open the app and use it yourself. That is the only check that really counts.",
  reportNextHeading: "What to try next",
  reportNextIntro: "None of this is required. Pick whatever sounds useful.",
  suggestUseIt:
    "Use it yourself for a week. Nothing finds the awkward parts faster than needing the thing you built.",
  suggestShowSomeone:
    "Put it in front of one other person and say nothing. Where they hesitate is where the work is.",
  suggestReadme:
    "Write down how to start it, in your README. In a month you will not remember, and neither will anyone else.",
  suggestCommit:
    "Commit what you have now, before changing anything. git is already set up here, so it is one command away and it makes everything after this undoable.",
  suggestTests:
    "Ask a coding agent to write a test for the single most important thing your app does. One is worth far more than none.",
  suggestDeploy:
    "Put it online so people can reach it without your laptop running. Ask a coding agent how, and say which service you want to use.",
  suggestUnderstand:
    "Pick one file you do not understand and ask a coding agent to walk you through it line by line. This is the cheapest way to stop being a beginner.",
  notAProject: "This folder is not a vibesquad project yet.",
  notAProjectHint: 'Make one here with:  vibesquad init "what you want to build"',
  claudeMdIntro:
    "Project guidance for Claude Code. Every agent working in this repository reads this file.",
  agentsMdIntro: "Project guidance for Codex. Every agent working in this repository reads this file.",
  generatedBy: "Generated by vibesquad",
  doNotEditByHand:
    "Edit your plan and re-generate rather than editing this file by hand — it will be overwritten.",
};

const ko: Strings = {
  ownedPaths: "내가 담당하는 파일",
  readOnlyPaths: "읽기만 하고 고치지 말 것",
  sharedPaths: "같이 쓰는 파일 — 조심해서 수정",
  deniedPaths: "건드리지 말 것",
  yourJob: "할 일",
  doneWhen: "이것들이 완료되었어요",
  youAre: "당신의 역할",
  primaryResponsibility: "맡은 일",
  mustNotModify: "고치면 안 되는 것",
  needSomethingElse: "다른 걸 고쳐야 한다면",
  handoffHeading: "다음 사람에게 넘기기",
  handoffRule: (roles) =>
    `작업이 끝나면 무엇이 바뀌었는지 짧게 정리해 주세요. 받는 쪽: ${roles}. ` +
    `다른 개발자가 알아야 할 사실만 적으세요 — 새로 만든 파일, 새 주소(API), 바뀐 데이터 모양.`,
  outOfScopeRule:
    "위 목록 밖의 파일을 고쳐야 하는 상황이라면:\n" +
    "1. 직접 고치지 마세요.\n" +
    "2. 무엇을 왜 바꿔야 하는지 적어두세요.\n" +
    "3. 어느 팀원이 처리해야 하는지 사용자에게 알려주세요.\n" +
    "4. 할 수 있는 나머지 작업은 계속 진행하세요.",
  humanIsOwner:
    "이 프로젝트의 주인은 사람입니다. 되돌리기 어려운 작업, 삭제, 비밀번호·열쇠(키) 관련, 배포와 관련된 일은 반드시 먼저 물어보세요.",
  runbookTitle: (project) => `${project} 만들기`,
  runbookIntro:
    "이게 만드는 순서입니다. 위에서부터 차례대로 하시면 됩니다. " +
    "각 단계마다 복사해서 붙여넣을 지시문이 준비돼 있으니 직접 쓰실 필요 없습니다.",
  teamHeading: "내 AI 팀",
  planHeading: "진행 순서",
  phaseLabel: (n) => `${n}단계`,
  independentNote:
    "이 작업들은 서로 상관이 없습니다. 그래도 하나씩 하세요 — 같은 폴더에서 둘을 동시에 돌리면 서로의 작업을 덮어씁니다.",
  sequentialNote: "이걸 끝내고 다음 단계로 가세요.",
  stepHeading: (n, title) => `${n}번 — ${title}`,
  howToRun: (tool) => `이 프로젝트 폴더에서 ${tool}를 여세요.`,
  copyPromptFrom: (path) => `${path} 파일 내용을 전부 복사해서 붙여넣으세요.`,
  whenFinished: "AI가 끝났다고 하면 위 목록을 확인하고 다음 단계로 넘어가세요.",
  yourTurn:
    "이 단계는 직접 하셔야 합니다. AI는 앱을 열어서 눈으로 볼 수 없으니 여기엔 붙여넣을 지시문이 없습니다.",
  whenFinishedHuman:
    "전부 확인되면 다음 단계로 가세요. 이상한 점이 있으면, 다음 AI를 시작할 때 무엇을 봤는지 알려주세요.",
  allDone: "여기까지가 전부입니다. 이제 프로젝트가 돌아갈 겁니다.",
  orCopyToClipboard: (command) => `또는 ${command} 를 실행하면 클립보드에 복사됩니다`,
  alreadyOnClipboard: "붙여넣으세요. 지시문은 이미 클립보드에 들어가 있습니다.",
  copyBetweenLines: "아래 선 사이의 내용을 전부 복사해서 붙여넣으세요.",
  clipboardUnavailable: "클립보드에 접근하지 못했습니다. 파일에서 직접 복사하세요.",
  thenRun: "다음 실행:",
  whatToDoNow: "지금 할 일:",
  askIdea: "무엇을 만들고 싶으세요?",
  askIdeaHint:
    "한두 문장도 좋고, 길게 자세히 적으셔도 좋습니다. 많이 적을수록 계획이 더 잘 맞습니다. 편하게 쓰세요.",
  askGoal: "어디까지 만들고 싶으세요?",
  goalDemo: "보기만 되면 됨",
  goalMvp: "실제로 동작하는 것",
  goalDeploy: "다른 사람도 온라인에서 쓸 수 있게",
  workingOutTeam: "팀을 짜는 중",
  planningTakesAWhile:
    "보통 5분쯤 걸리고, 더 걸릴 수도 있습니다. 내 컴퓨터의 코딩 도구에 한 번 물어보는 것입니다.",
  filesCreated: (count) => `파일 ${count}개를 만들었습니다`,
  gitStarted: "git을 시작했습니다. 나중에 언제든 되돌릴 수 있습니다",
  buildOrderIn: (file) => `만드는 순서는 ${file} 에 있습니다`,
  countingNote:
    "프로젝트 하나 만들어진 것으로 1이 기록됩니다. 쓰는 사람이 있는지 알기 위한 것이고, 여러분이나 아이디어에 관한 정보는 전혀 보내지 않습니다. 끄려면 VIBESQUAD_NO_COUNT=1",
  alreadyAProject: "이 폴더에는 이미 vibesquad 프로젝트가 있습니다.",
  alreadyAProjectHint: "vibesquad status 로 확인하시거나, 다른 폴더에서 시작하세요.",
  folderNotEmpty: "같은 이름의 파일이 이미 있어서 아무것도 쓰지 않았습니다.",
  folderNotEmptyHint: "빈 폴더에서 시작하세요.",
  noToolsUsable: "이 컴퓨터에서 Claude Code도 Codex도 쓸 수 없습니다.",
  noToolsHint: "vibesquad doctor 를 실행하면 이유를 알려줍니다.",
  carryingOnAnyway:
    "일단 진행합니다. 다만 아이디어에 맞춘 계획이 아니라 일반적인 계획이 나옵니다.",
  checkingComputer: "컴퓨터 상태를 확인합니다",
  toolReady: (label) => `${label}: 준비됨`,
  toolInstalled: (label) => `${label}: 설치됨`,
  gitReady: "git: 준비됨",
  gitMissing: "git: 설치 안 됨. 프로젝트는 돌아가지만 작업 기록이 남지 않습니다.",
  gitNoIdentity: "git: 설치됐지만 아직 이름과 이메일을 모릅니다.",
  nodeReady: (version) => `Node ${version}: 준비됨`,
  nodeTooOld: (version) => `Node ${version}은 vibesquad에 필요한 버전보다 낮습니다. Node 20 이상을 설치하세요.`,
  noToolAtAll: "쓸 수 있는 AI 코딩 도구가 없어서, 아이디어에 맞는 계획을 짤 수 없습니다.",
  runDoctorAgain: "위 경고 중 하나를 해결한 뒤 vibesquad doctor 를 다시 실행하세요.",
  readyToBuild: "이제 만들 준비가 됐습니다.",
  initExample: 'vibesquad init "만들고 싶은 것"',
  apiKeyLabel: "내 Anthropic API 키",
  claudeMissing:
    "터미널에서 쓸 수 있는 Claude Code가 없습니다. Claude 앱에 로그인한 것과는 별개입니다 — vibesquad는 터미널이 실행할 수 있는 쪽을 씁니다.",
  claudeMissingFix:
    "Claude Code를 설치한 뒤 터미널을 닫았다 다시 여세요. `claude` 명령이 잡혀야 합니다.",
  claudeLoginUnknown: "Claude Code가 설치돼 있습니다. 로그인 여부는 실제로 쓸 때 확인합니다.",
  codexMissing:
    "터미널에서 쓸 수 있는 Codex가 없습니다. ChatGPT 앱 안의 Codex는 다른 물건입니다 — vibesquad는 터미널이 실행할 수 있는 쪽을 씁니다.",
  codexMissingFix: "이 명령으로 설치하세요:  npm install -g @openai/codex",
  codexLoggedIn: "로그인됨.",
  codexNotLoggedIn: "Codex가 설치돼 있지만 로그인이 안 돼 있습니다.",
  codexNotLoggedInFix: "실행하세요: codex login",
  apiKeyFound: "ANTHROPIC_API_KEY에서 API 키를 찾았습니다.",
  apiKeyMissing: "API 키가 없습니다. Claude Code와 Codex 둘 다 안 될 때만 필요합니다.",
  claudeNeedsLogin: [
    "Claude Code는 설치돼 있지만, 명령줄 쪽이 로그인돼 있지 않습니다.",
    "(Claude 앱에 로그인한 것과는 별개입니다.)",
    "",
    "한 번만 해두면 됩니다:",
    "  1. 실행: claude",
    "  2. 입력: /login",
    "  3. 로그인을 마친 뒤 입력: exit",
  ].join("\n"),
  codexNeedsLogin: "Codex가 로그인돼 있지 않습니다. 실행하세요: codex login",
  toolWouldNotStart: "그 도구를 시작하지 못했습니다. 터미널을 닫았다 다시 연 뒤 시도하세요.",
  requestTimedOut: "너무 오래 걸려서 중단했습니다. 인터넷 연결을 확인하고 다시 시도하세요.",
  apiKeyRejected: "그 API 키가 거부됐습니다. ANTHROPIC_API_KEY에 오타가 있거나 만료됐는지 확인하세요.",
  accountCannotRequest: "그 계정은 지금 요청을 보낼 수 없습니다.",
  uiTitle: "내 AI 코딩 팀 만들기",
  uiSubtitle: "무엇을 만들고 싶은지 알려주세요. 누가 뭘 할지 제가 정해드릴게요.",
  uiCheckingTools: "컴퓨터 상태 확인 중",
  uiToolsOk: "준비됐습니다.",
  uiToolsBad: "제대로 쓰려면 먼저 고쳐야 할 게 있습니다.",
  uiStartButton: "팀 만들기",
  uiWorking:
    "팀을 짜는 중입니다. 보통 5분쯤 걸리고, 더 걸릴 수도 있어요 — 이 화면은 그대로 두셔도 됩니다.",
  uiCopyPrompt: "이 지시문 복사하기",
  uiCopied: "복사됐어요 — 이제 붙여넣으세요",
  uiOpenTool: (tool) => `이 폴더에서 ${tool}를 열고 붙여넣으세요`,
  uiMarkDone: "완료 — 다음은?",
  uiUndo: "아직이에요, 되돌리기",
  uiStepOf: (n, total) => `${total}단계 중 ${n}번째`,
  uiFinishedTitle: "여기까지가 전부입니다",
  uiFinishedBody: "이제 프로젝트가 돌아갈 겁니다. 열어서 확인해보세요.",
  uiFolder: "만드는 위치",
  uiIdeaPlaceholder: "내 요리법을 저장하고 재료로 검색하는 사이트",
  uiNeedIdea: "무엇을 만들고 싶은지 한 문장이라도 먼저 적어주세요.",
  uiSomethingWentWrong: "잘 안 됐습니다.",
  setupHeading: "시작하기 전에",
  setupNode: "Node.js 20 이상",
  setupNodeHow:
    "이미 있으십니다. 없으면 이 화면이 안 떴을 거예요. 친구분이 막히면 nodejs.org에서 설치한 뒤 터미널을 새로 열라고 알려주세요.",
  setupTool: "Claude Code 또는 Codex, 로그인된 상태",
  setupToolHow:
    "앱 말고 터미널에서 쓰는 쪽입니다. Claude 앱이나 ChatGPT 앱에 로그인한 것과는 별개예요. 없어도 프로젝트는 나오지만, 내 아이디어에 맞춘 계획이 아니라 일반적인 계획이 됩니다.",
  setupAccount: "내 AI 계정을 씁니다",
  setupAccountHow:
    "팀을 짤 때 내 Claude Code나 Codex로 요청이 한 번 나갑니다. 따로 가입하거나 결제할 건 없지만, 내 사용량은 씁니다.",
  setupKeepOpen: "팀 짜는 동안 터미널을 닫지 마세요",
  setupKeepOpenHow:
    "팀 짜는 데 5분쯤 걸립니다. 그 사이에 터미널을 닫으면 계획이 날아갑니다. 프로젝트가 만들어진 뒤에는 진행 상황이 저장되니, 닫아도 vibesquad ui를 다시 실행하면 이어서 하시면 됩니다.",
  uploadLabel: "기획서가 있으면 올려주세요",
  uploadHint: "선택 사항입니다. .txt 또는 .md 파일, 100KB까지. 적어주신 아이디어와 함께 계획에 반영됩니다.",
  uploadChosen: (name) => `${name} 첨부됨`,
  uploadClear: "빼기",
  uploadTooBig: "파일이 너무 큽니다. 100KB까지 됩니다.",
  uploadWrongType: "글자 파일만 됩니다 — .txt 또는 .md",
  reportOpen: "보고서 보기",
  reportTitle: "우리 팀이 만든 것",
  reportIntro: "아래 내용은 지금 이 순간 프로젝트 폴더를 읽어서 만든 것입니다. 추측이 아닙니다.",
  reportBack: "돌아가기",
  reportBuiltHeading: "팀원별 담당 구역에 있는 것",
  reportBuiltNote:
    "vibesquad는 코딩 도구가 일하는 걸 지켜볼 수 없습니다. 그래서 이건 각 팀원이 맡은 자리에 지금 있는 파일 목록이지, 누가 무엇을 썼다는 주장이 아닙니다.",
  reportNoFiles: "아직 비어 있음",
  reportFileCount: (count) => `파일 ${count}개`,
  reportCheckHeading: "간단 점검",
  reportCheckStepsDone: (done, total) => `${total}단계 중 ${done}단계 완료`,
  reportCheckFilesTotal: (count) => `프로젝트에 파일 ${count}개`,
  reportCheckEmptyArea: (role) => `${role} 자리가 비어 있습니다 — 그 단계가 안 돌았을 수 있어요`,
  reportCheckAllAreasFilled: "모든 팀원 자리에 뭔가 들어 있습니다",
  reportCheckYourTurn: "앱을 열어서 직접 써보세요. 진짜 점검은 그것뿐입니다.",
  reportNextHeading: "이다음에 해볼 것",
  reportNextIntro: "꼭 해야 하는 건 아닙니다. 끌리는 것만 골라보세요.",
  suggestUseIt:
    "일주일만 직접 써보세요. 내가 만든 걸 내가 필요해서 쓸 때만큼 어색한 곳이 빨리 드러나는 방법은 없습니다.",
  suggestShowSomeone:
    "다른 사람 한 명 앞에 놓고 아무 설명도 하지 마세요. 그 사람이 멈칫하는 지점이 고칠 곳입니다.",
  suggestReadme:
    "실행하는 방법을 README에 적어두세요. 한 달 뒤엔 본인도 기억 못 하고, 남은 더 모릅니다.",
  suggestCommit:
    "뭘 더 바꾸기 전에 지금 상태를 커밋해두세요. git은 이미 준비돼 있어서 명령 한 줄이면 되고, 이후 작업이 전부 되돌릴 수 있게 됩니다.",
  suggestTests:
    "이 앱에서 가장 중요한 기능 하나에 테스트를 붙여달라고 코딩 도구에 부탁해보세요. 하나라도 있는 게 없는 것보다 훨씬 낫습니다.",
  suggestDeploy:
    "내 노트북이 안 켜져 있어도 남들이 들어올 수 있게 온라인에 올려보세요. 코딩 도구에 어떤 서비스를 쓸지 말하고 방법을 물어보면 됩니다.",
  suggestUnderstand:
    "이해 안 되는 파일 하나를 골라서 코딩 도구에 한 줄씩 설명해달라고 해보세요. 초보를 벗어나는 가장 싼 방법입니다.",
  notAProject: "이 폴더는 아직 vibesquad 프로젝트가 아닙니다.",
  notAProjectHint: '여기에 만들려면:  vibesquad init "만들고 싶은 것"',
  claudeMdIntro:
    "Claude Code를 위한 프로젝트 안내입니다. 이 저장소에서 일하는 모든 에이전트가 이 파일을 읽습니다.",
  agentsMdIntro: "Codex를 위한 프로젝트 안내입니다. 이 저장소에서 일하는 모든 에이전트가 이 파일을 읽습니다.",
  generatedBy: "vibesquad가 생성함",
  doNotEditByHand: "이 파일을 직접 고치지 말고 계획을 수정한 뒤 다시 생성하세요 — 덮어써집니다.",
};

const table: Record<Locale, Strings> = { en, ko };

export function strings(locale: Locale): Strings {
  return table[locale];
}

const toolNames: Record<string, string> = {
  "claude-code": "Claude Code",
  codex: "Codex",
};

export function toolName(id: string): string {
  return toolNames[id] ?? id;
}
