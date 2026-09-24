import type { AcquireMethod, ChecklistItemResult, ChecklistResult, Item, NeedLevel, Profile } from "../types.js";
import { items } from "../data/items.js";
import { getAgeStatus } from "./age.js";

/**
 * 현재 나이 기준으로 이 아이템이 목록에 표시될지, 표시된다면 어떤 등급인지 계산. null이면 목록에서 제외.
 * notYet이 "아직 시기가 안 됐다"(timedOut=false)인지 "이미 있거나 상황상 불필요"(timedOut=true→false 구분 아래 참고)인지
 * 구분해야, 프론트에서 "N개월 후 필요"를 시기가 이른 경우에만 보여줄 수 있다.
 */
function resolveNeedLevel(
  item: Item,
  profile: Profile,
  ageInMonths: number
): { needLevel: NeedLevel; dueToTiming: boolean } | null {
  if (item.appliesTo && !item.appliesTo(profile)) return null;
  if (item.endMonth != null && ageInMonths > item.endMonth) return null;
  if (ageInMonths < item.startMonth) return { needLevel: "notYet", dueToTiming: true };
  const needLevel = item.needLevelFor?.(profile) ?? item.baseNeedLevel;
  return { needLevel, dueToTiming: false };
}

/** 구매/렌탈/중고 가격을 예상 사용기간 기준으로 계산해 저렴한 순으로 정렬(최저가 TOP) */
function resolvePriceOptions(item: Item, usageMonths: number): { method: AcquireMethod; price: number }[] {
  const options: { method: AcquireMethod; price: number }[] = [{ method: "buy", price: item.buyPrice }];
  if (item.rentalPricePerMonth != null) {
    options.push({ method: "rental", price: item.rentalPricePerMonth * usageMonths });
  }
  if (item.secondhandPrice != null) {
    options.push({ method: "secondhand", price: item.secondhandPrice });
  }
  return options.sort((a, b) => a.price - b.price);
}

export function buildChecklist(profile: Profile, now: Date = new Date()): ChecklistResult {
  const { ageInMonths } = getAgeStatus(profile, now);

  const essential: ChecklistItemResult[] = [];
  const situational: ChecklistItemResult[] = [];
  const notYet: ChecklistItemResult[] = [];

  for (const item of items) {
    const resolved = resolveNeedLevel(item, profile, ageInMonths);
    if (resolved === null) continue;
    const { needLevel, dueToTiming } = resolved;

    const usageMonths = profile.expectedUsageMonths ?? item.typicalUsageMonths;
    const priceOptions = resolvePriceOptions(item, usageMonths);
    const result: ChecklistItemResult = {
      item,
      needLevel,
      recommendedMethod: priceOptions[0].method,
      recommendedPrice: priceOptions[0].price,
      priceOptions,
      usageMonths,
    };

    if (needLevel === "essential") essential.push(result);
    else if (needLevel === "situational") situational.push(result);
    else {
      if (dueToTiming) {
        result.monthsUntilNeeded = Math.max(1, Math.ceil(item.startMonth - ageInMonths));
      }
      notYet.push(result);
    }
  }

  const totalEstimatedCost = [...essential, ...situational].reduce((sum, r) => sum + r.recommendedPrice, 0);
  const savingsFromOptimization = [...essential, ...situational].reduce(
    (sum, r) => sum + Math.max(0, r.item.buyPrice - r.recommendedPrice),
    0
  );

  return { essential, situational, notYet, totalEstimatedCost, savingsFromOptimization };
}
