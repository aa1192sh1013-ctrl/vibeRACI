/**
 * The fixed menu of roles a plan may draw from.
 *
 * Deliberately short. The planner picks and tailors from these instead of
 * inventing roles, which keeps output predictable and stops the product from
 * spawning six agents for a project that needs two.
 */
import type { ArchetypeId, Locale } from "./schema.js";

export interface Archetype {
  id: ArchetypeId;
  emoji: string;
  /** Default display name per locale. A plan may override it. */
  displayName: Record<Locale, string>;
  summary: Record<Locale, string>;
  /** Typical directories this archetype owns, used as a starting suggestion. */
  suggestedOwns: string[];
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  architect: {
    id: "architect",
    emoji: "🧠",
    displayName: { en: "Architect", ko: "설계자" },
    summary: {
      en: "Plans how the app is put together and what the data looks like.",
      ko: "앱의 뼈대와 데이터 구조를 먼저 정합니다.",
    },
    suggestedOwns: ["docs/**"],
  },
  "ui-developer": {
    id: "ui-developer",
    emoji: "🎨",
    displayName: { en: "UI Developer", ko: "화면 개발자" },
    summary: {
      en: "Builds the screens people actually click on.",
      ko: "사람들이 실제로 보고 누르는 화면을 만듭니다.",
    },
    suggestedOwns: ["app/**", "components/**"],
  },
  "feature-developer": {
    id: "feature-developer",
    emoji: "⚙️",
    displayName: { en: "Feature Developer", ko: "기능 개발자" },
    summary: {
      en: "Builds login, the database, and everything that happens behind the screens.",
      ko: "로그인, 데이터베이스 등 화면 뒤에서 돌아가는 것들을 만듭니다.",
    },
    suggestedOwns: ["server/**", "db/**"],
  },
  reviewer: {
    id: "reviewer",
    emoji: "🔍",
    displayName: { en: "Reviewer", ko: "검토자" },
    summary: {
      en: "Checks the others' work for bugs and missing pieces before you call it done.",
      ko: "완성했다고 하기 전에 버그와 빠진 부분이 없는지 확인합니다.",
    },
    suggestedOwns: ["tests/**"],
  },
  fullstack: {
    id: "fullstack",
    emoji: "🛠️",
    displayName: { en: "Developer", ko: "개발자" },
    summary: {
      en: "Builds the whole thing. Right choice when the project is small.",
      ko: "전부 다 만듭니다. 프로젝트가 작을 때는 이게 맞습니다.",
    },
    suggestedOwns: ["src/**"],
  },
};

export function archetype(id: ArchetypeId): Archetype {
  return ARCHETYPES[id];
}
