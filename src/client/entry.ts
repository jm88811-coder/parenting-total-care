// 브라우저용 진입점: 서버 없이(GitHub Pages 등 정적 호스팅) 계산 로직을 그대로 실행한다.
// esbuild가 이 파일을 public/logic.bundle.js 로 묶고, main.js가 window.ParentingLogic 을 호출한다.
import type { Profile } from "../types.js";
import { buildChecklist } from "../logic/checklist.js";
import { matchBenefits } from "../logic/benefits.js";
import { buildTimeline } from "../logic/timeline.js";
import { buildTodos } from "../logic/todos.js";
import { buildDashboard } from "../logic/dashboard.js";

const handlers: Record<string, (profile: Profile) => unknown> = {
  "/api/checklist": (p) => buildChecklist(p),
  "/api/benefits": (p) => ({ benefits: matchBenefits(p) }),
  "/api/timeline": (p) => ({ timeline: buildTimeline(p) }),
  "/api/todos": (p) => ({ todos: buildTodos(p) }),
  "/api/dashboard": (p) => buildDashboard(p),
};

(globalThis as unknown as { ParentingLogic: unknown }).ParentingLogic = {
  call(path: string, profile: Profile) {
    const handler = handlers[path];
    if (!handler) throw new Error(`알 수 없는 요청: ${path}`);
    return handler(profile);
  },
};
