import type { Profile, TimelineBucket, TimelineEventResult } from "../types.js";
import { timelineTemplate } from "../data/timelineTemplate.js";
import { daysBetween, monthToDate } from "./age.js";

function classifyBucket(daysFromNow: number): TimelineBucket {
  if (daysFromNow < 0) return "past";
  if (daysFromNow === 0) return "today";
  if (daysFromNow <= 7) return "thisWeek";
  if (daysFromNow <= 31) return "thisMonth";
  return "later";
}

/** 프로필의 출생일/출산예정일 기준으로 전체 타임라인을 계산해 가까운 순서로 정렬 */
export function buildTimeline(profile: Profile, now: Date = new Date()): TimelineEventResult[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return timelineTemplate
    .map((event) => {
      const eventDate = monthToDate(profile, event.atMonth);
      const daysFromNow = daysBetween(today, eventDate);
      return { event, bucket: classifyBucket(daysFromNow), daysFromNow };
    })
    .sort((a, b) => a.daysFromNow - b.daysFromNow);
}
