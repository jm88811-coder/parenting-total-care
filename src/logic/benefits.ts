import type { Benefit, BenefitResult, Profile } from "../types.js";
import { benefits } from "../data/benefits.js";
import { getAgeStatus } from "./age.js";

function isRegionMatch(benefit: Benefit, profile: Profile): boolean {
  if (!benefit.regions || benefit.regions.length === 0) return true;
  return benefit.regions.includes(profile.region);
}

/** 프로필 기준으로 지금 받을 수 있거나 곧 받을 수 있는 혜택 목록 (기간이 지난 혜택은 제외) */
export function matchBenefits(profile: Profile, now: Date = new Date()): BenefitResult[] {
  const { ageInMonths } = getAgeStatus(profile, now);

  return benefits
    .filter((benefit) => isRegionMatch(benefit, profile))
    .filter((benefit) => benefit.eligibleToMonth == null || ageInMonths <= benefit.eligibleToMonth)
    .map((benefit) => {
      const notEligible = benefit.checkEligible ? !benefit.checkEligible(profile) : false;
      const status = notEligible ? "notEligible" : ageInMonths >= benefit.eligibleFromMonth ? "eligibleNow" : "upcoming";
      return {
        benefit,
        status,
        estimatedAmount: benefit.estimateAmount?.(ageInMonths, profile) ?? benefit.estimatedAmount,
      };
    });
}
