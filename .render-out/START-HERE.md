# Secondhand Market 만들기

> A marketplace where people list things they no longer want, chat with a buyer, and agree on a sale.

이게 만드는 순서입니다. 위에서부터 차례대로 하시면 됩니다. 각 단계마다 복사해서 붙여넣을 지시문이 준비돼 있으니 직접 쓰실 필요 없습니다.

## 내 AI 팀

- **🧠 Architect** — Decides how the app is put together and what the data looks like, before anyone writes a feature.
- **🎨 UI Developer** — Builds the screens people actually click on.
- **⚙️ Feature Developer** — Builds login, the database, and everything that happens behind the screens.
- **🔍 Reviewer** — Checks the others' work for bugs and missing pieces before you call it done.

## 진행 순서

- 1단계 — 🧠 Plan the structure
- 2단계 — ⚙️ Build the database and login  ·  🎨 Build the screens
  이 작업들은 서로 상관이 없습니다. 그래도 하나씩 하세요 — 같은 폴더에서 둘을 동시에 돌리면 서로의 작업을 덮어씁니다.
- 3단계 — 🔍 Check the whole thing
- 4단계 — 🙋 Try it yourself

---

### 1번 — 🧠 Plan the structure

Decide the shape of the data and the folder layout so the other two never have to guess.

1. 이 프로젝트 폴더에서 Claude Code를 여세요.
2. `.agents/prompts/plan-structure.md` 파일 내용을 전부 복사해서 붙여넣으세요.

**이것들이 되면 완료**

- [ ] docs/architecture.md, docs/data-model.md and docs/api.md all exist
- [ ] shared/types.ts exists and lists a type for users, listings and messages
- [ ] No code outside docs/ and shared/types.ts was created

AI가 끝났다고 하면 위 목록을 확인하고 다음 단계로 넘어가세요.

### 2번 — ⚙️ Build the database and login

Make the server side real: tables, accounts, and the addresses the screens will call.

1. 이 프로젝트 폴더에서 Codex를 여세요.
2. `.agents/prompts/build-backend.md` 파일 내용을 전부 복사해서 붙여넣으세요.

**이것들이 되면 완료**

- [ ] The database file is created when the app starts
- [ ] A new account can be created and logged into
- [ ] Every route in docs/api.md exists and returns real data

AI가 끝났다고 하면 위 목록을 확인하고 다음 단계로 넘어가세요.

### 3번 — 🎨 Build the screens

Build every screen a user touches, using the addresses the Architect wrote down.

1. 이 프로젝트 폴더에서 Claude Code를 여세요.
2. `.agents/prompts/build-ui.md` 파일 내용을 전부 복사해서 붙여넣으세요.

**이것들이 되면 완료**

- [ ] Every screen can be reached by clicking, with no dead links
- [ ] The feed shows listings that came from the server, not fake placeholder data
- [ ] Nothing in server/ or db/ was changed

AI가 끝났다고 하면 위 목록을 확인하고 다음 단계로 넘어가세요.

### 4번 — 🔍 Check the whole thing

Find what is broken or missing before the owner calls this finished.

1. 이 프로젝트 폴더에서 Claude Code를 여세요.
2. `.agents/prompts/review.md` 파일 내용을 전부 복사해서 붙여넣으세요.

**이것들이 되면 완료**

- [ ] Tests exist for sign up, posting a listing, and sending a message
- [ ] All tests pass
- [ ] A written list of remaining problems exists, each one assigned to a teammate

AI가 끝났다고 하면 위 목록을 확인하고 다음 단계로 넘어가세요.

### 5번 — 🙋 Try it yourself

Open what your team built and use it the way a stranger would.

_이 단계는 직접 하셔야 합니다. AI는 앱을 열어서 눈으로 볼 수 없으니 여기엔 붙여넣을 지시문이 없습니다._

1. Start the app the way the README says
2. Sign up as a new person and post something for sale
3. Open a second browser window, sign up as someone else, and message the seller
4. Try something silly on purpose: an empty title, a very long description
5. Write down anything that looked wrong or confusing

**이것들이 되면 완료**

- [ ] The app opens without an error
- [ ] You posted a listing and saw it appear in the feed
- [ ] A message you sent as one person showed up for the other
- [ ] You have a written list of anything that looked wrong

전부 확인되면 다음 단계로 가세요. 이상한 점이 있으면, 다음 AI를 시작할 때 무엇을 봤는지 알려주세요.

---

여기까지가 전부입니다. 이제 프로젝트가 돌아갈 겁니다.

_vibeRACI가 생성함_
