import type { DashboardSummary, Profile } from "../types.js";
import { buildChecklist } from "./checklist.js";
import { matchBenefits } from "./benefits.js";
import { buildTimeline } from "./timeline.js";
import { buildTodos } from "./todos.js";
import { formatAgeLabel, getAgeStatus } from "./age.js";

/** 홈 대시보드 요약. 서버(개발용)와 브라우저(정적 배포) 양쪽에서 같은 함수를 쓴다. */
export function buildDashboard(profile: Profile, now: Date = new Date()): DashboardSummary {
  const checklist = buildChecklist(profile, now);
  const benefitResults = matchBenefits(profile, now);
  const timeline = buildTimeline(profile, now);
  const ageStatus = getAgeStatus(profile, now);

  const topTasks = timeline.filter((t) => t.bucket === "today" || t.bucket === "thisWeek").slice(0, 3);
  const unclaimedBenefits = benefitResults.filter((b) => b.status === "eligibleNow");
  const dontBuyYetItems = checklist.notYet
    .filter((r) => r.monthsUntilNeeded !== undefined)
    .sort((a, b) => (a.monthsUntilNeeded ?? 0) - (b.monthsUntilNeeded ?? 0))
    .slice(0, 3);

  return {
    ageLabel: formatAgeLabel(ageStatus),
    topTasks,
    itemSavings: checklist.savingsFromOptimization,
    unclaimedBenefits,
    buyNowItems: checklist.essential,
    dontBuyYetItems,
    activeTodos: buildTodos(profile, now)
      .filter((t) => t.status === "now")
      .slice(0, 10),
  };
}
