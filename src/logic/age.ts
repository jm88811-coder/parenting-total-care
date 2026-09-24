import type { AgeStatus, Profile } from "../types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** 아이 나이 계산의 기준일(출생일 또는 출산예정일)을 반환 */
export function getBirthAnchor(profile: Profile): Date {
  return parseDate(profile.babyDate);
}

/** 기준일에서 개월 수만큼 이동한 날짜. 음수 개월도 허용(임신 중 일정용). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** atMonth(개월, 출생=0 기준)를 실제 캘린더 날짜로 변환 */
export function monthToDate(profile: Profile, atMonth: number): Date {
  return addMonths(getBirthAnchor(profile), atMonth);
}

export function getAgeStatus(profile: Profile, now: Date = new Date()): AgeStatus {
  const anchor = getBirthAnchor(profile);
  const daysFromAnchor = daysBetween(anchor, now);

  if (daysFromAnchor < 0) {
    const daysUntilDue = -daysFromAnchor;
    const pregnancyWeek = Math.max(0, Math.round(40 - daysUntilDue / 7));
    const ageInMonths = -Math.round(daysUntilDue / 30.44);
    return { isPrenatal: true, pregnancyWeek, ageInMonths };
  }

  const ageInMonths = Math.floor(daysFromAnchor / 30.44);
  return { isPrenatal: false, pregnancyWeek: null, ageInMonths };
}

export function formatAgeLabel(status: AgeStatus): string {
  if (status.isPrenatal) return `임신 ${status.pregnancyWeek}주차`;
  if (status.ageInMonths < 1) return "신생아(출생 1개월 미만)";
  return `생후 ${status.ageInMonths}개월`;
}
