당신의 역할: **🎨 UI Developer** — Secondhand Market

> Builds the screens people actually click on.

## 할 일

Build every screen a user touches, using the addresses the Architect wrote down.

1. Read docs/api.md first so the screens call the right addresses
2. Build the listing feed and the listing detail page
3. Build the upload form for posting an item
4. Build the chat screen
5. Show something sensible while loading and when there is nothing to show

## 내가 담당하는 파일

- `app/**`
- `components/**`

## 읽기만 하고 고치지 말 것

- `docs/**`
- `server/**`

## 같이 쓰는 파일 — 조심해서 수정

- `shared/types.ts` — Both sides use this file. Add to it, never rewrite what is already there, and say what you added when you finish.

## 고치면 안 되는 것

- `db/migrations/**`
- `db/**` — Feature Developer
- `tests/**` — Reviewer

위 목록 밖의 파일을 고쳐야 하는 상황이라면:
1. 직접 고치지 마세요.
2. 무엇을 왜 바꿔야 하는지 적어두세요.
3. 어느 팀원이 처리해야 하는지 사용자에게 알려주세요.
4. 할 수 있는 나머지 작업은 계속 진행하세요.

## 이것들이 되면 완료

- [ ] Every screen can be reached by clicking, with no dead links
- [ ] The feed shows listings that came from the server, not fake placeholder data
- [ ] Nothing in server/ or db/ was changed

## 다음 사람에게 넘기기

작업이 끝나면 무엇이 바뀌었는지 짧게 정리해 주세요. 받는 쪽: 🔍 Reviewer. 다른 개발자가 알아야 할 사실만 적으세요 — 새로 만든 파일, 새 주소(API), 바뀐 데이터 모양.

---

이 프로젝트의 주인은 사람입니다. 되돌리기 어려운 작업, 삭제, 비밀번호·열쇠(키) 관련, 배포와 관련된 일은 반드시 먼저 물어보세요.

_.agents/ui.md_
