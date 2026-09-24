import type { Profile, TodoResult, TodoStatus } from "../types.js";
import { todos } from "../data/todos.js";
import { getAgeStatus } from "./age.js";

/** 시작 몇 개월 전부터 "곧 시작"으로 알려줄지 */
const SOON_WINDOW_MONTHS = 2;

const STATUS_ORDER: Record<TodoStatus, number> = { now: 0, soon: 1, later: 2, past: 3 };

function classify(ageInMonths: number, startMonth: number, dueMonth: number): TodoStatus {
  if (ageInMonths > dueMonth) return "past";
  if (ageInMonths >= startMonth) return "now";
  if (ageInMonths >= startMonth - SOON_WINDOW_MONTHS) return "soon";
  return "later";
}

/**
 * 프로필의 나이(임신 주차/개월)를 기준으로 to-do를 지금/곧/나중/지남으로 분류.
 * 정렬: 지금(기한 임박 순) → 곧(시작 빠른 순) → 나중 → 지난 항목(최근 순).
 * 완료 여부는 서버가 저장하지 않고 프론트 localStorage가 관리한다.
 */
export function buildTodos(profile: Profile, now: Date = new Date()): TodoResult[] {
  const { ageInMonths } = getAgeStatus(profile, now);

  return todos
    .filter((todo) => !todo.appliesTo || todo.appliesTo(profile))
    .map((todo): TodoResult => {
      const status = classify(ageInMonths, todo.startMonth, todo.dueMonth);
      const result: TodoResult = { todo, status };
      if (status === "now") result.monthsLeft = Math.max(0, todo.dueMonth - ageInMonths);
      if (status === "soon" || status === "later") result.monthsUntilStart = Math.max(1, todo.startMonth - ageInMonths);
      return result;
    })
    .sort((a, b) => {
      if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (a.status === "now") return (a.monthsLeft ?? 0) - (b.monthsLeft ?? 0) || a.todo.startMonth - b.todo.startMonth;
      if (a.status === "past") return b.todo.dueMonth - a.todo.dueMonth;
      return a.todo.startMonth - b.todo.startMonth;
    });
}
