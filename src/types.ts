export type FeedingPlan = "breastfeeding" | "formula" | "undecided";

export interface Profile {
  /** ISO date (YYYY-MM-DD). 아이가 이미 태어났으면 생년월일, 아니면 출산예정일. */
  babyDate: string;
  /** babyDate가 출산예정일인지 실제 생년월일인지 */
  babyDateType: "dueDate" | "birthDate";
  isFirstChild: boolean;
  feedingPlan: FeedingPlan;
  hasCar: boolean;
  hasWashingMachine: boolean;
  plansToUseCrib: boolean;
  /** 시/도 단위. 예: "서울특별시" */
  region: string;
  /** 이 물건들을 앞으로 몇 개월이나 쓸 계획인지 판단할 때 쓰는 기준. 기본 12개월. */
  expectedUsageMonths?: number;
  /** 본인 또는 배우자가 고용보험 가입 근로자인지 (배우자 출산휴가급여 등 대상 판정용) */
  isEmployed: boolean;
  /** 기준중위소득 이하 등 저소득 가구 지원 기준을 충족하는지 (일부 지원사업 대상 판정용) */
  lowIncomeHousehold: boolean;
}

/** 프로필 기준 "현재 몇 개월/몇 주차"를 나타내는 계산 결과 */
export interface AgeStatus {
  /** 출생 전이면 true */
  isPrenatal: boolean;
  /** 출생 전이면 임신 주차, 출생 후면 null */
  pregnancyWeek: number | null;
  /** 출생 후면 개월 수(0 이상), 출생 전이면 음수(출산까지 남은 개월 수의 음수) */
  ageInMonths: number;
}

export type NeedLevel = "essential" | "situational" | "notYet";
export type AcquireMethod = "buy" | "rental" | "secondhand";

export interface Item {
  id: string;
  name: string;
  category: string;
  /** 이 아이템이 필요해지는 시작 시점(개월, 출생=0 기준. 음수면 출산 전부터 필요) */
  startMonth: number;
  /** 이 아이템이 더 이상 필요 없어지는 시점(개월). 없으면 계속 필요. */
  endMonth: number | null;
  /** 기본 필요 등급 (조건부 규칙이 없을 때 기본값) */
  baseNeedLevel: NeedLevel;
  buyPrice: number;
  rentalPricePerMonth: number | null;
  secondhandPrice: number | null;
  /** 평균적으로 쓰는 기간(개월). 렌탈/중고 추천 판단에 사용. */
  typicalUsageMonths: number;
  /** 이 아이템이 필요한지 여부를 프로필로 판단하는 조건 (없으면 항상 관련 있음, false면 목록에서 제외) */
  appliesTo?: (profile: Profile) => boolean;
  /** baseNeedLevel을 프로필에 따라 바꾸고 싶을 때(예: 둘째라 이미 있을 수 있음). undefined면 baseNeedLevel 그대로 사용 */
  needLevelFor?: (profile: Profile) => NeedLevel | undefined;
  note?: string;
  /** 요즘 SNS·맘카페에서 자주 언급되는 브랜드/제품 예시 1~2개 (참고용, 실시간 순위 아님) */
  popularBrands?: string[];
}

export interface ChecklistItemResult {
  item: Item;
  needLevel: NeedLevel;
  recommendedMethod: AcquireMethod;
  recommendedPrice: number;
  /** 구매/렌탈/중고 중 가격 있는 옵션을 저렴한 순으로 정렬한 목록(최저가 TOP). recommendedMethod/Price와 [0]이 같음. */
  priceOptions: { method: AcquireMethod; price: number }[];
  /** priceOptions의 렌탈 총액을 계산할 때 사용한 개월 수(표시용) */
  usageMonths: number;
  /** notYet 아이템에서 "지금부터 몇 개월 후 필요"인지. essential/situational이면 의미 없음(0 이하). */
  monthsUntilNeeded?: number;
}

export interface ChecklistResult {
  essential: ChecklistItemResult[];
  situational: ChecklistItemResult[];
  notYet: ChecklistItemResult[];
  totalEstimatedCost: number;
  /** 구매가 그대로 다 샀을 때 대비, 렌탈/중고 추천으로 절약되는 금액(필수+상황별 기준) */
  savingsFromOptimization: number;
}

export interface Benefit {
  id: string;
  name: string;
  /** 예: "₩1,000,000" 또는 "월 100만원(0세)/50만원(1세)" 같은 표시용 문자열 */
  amountLabel: string;
  /** 이 혜택을 신청할 수 있는 시작 시점(개월, 출생=0 기준) */
  eligibleFromMonth: number;
  eligibleToMonth: number | null;
  requiredDocuments: string[];
  applyMethod: string;
  officialLink: string;
  /** 지역 제한이 있으면 해당 지역 배열, 없으면 undefined(전국 공통) */
  regions?: string[];
  note?: string;
  /** 대표 금액(원). 일회성 혜택은 총액, 매달 나오는 혜택은 월 금액. 참고용 추정치. */
  estimatedAmount: number;
  /** 나이·프로필에 따라 금액이 달라지면(예: 부모급여, 첫만남이용권) estimatedAmount 대신 이 함수로 계산 */
  estimateAmount?: (ageInMonths: number, profile: Profile) => number;
  /** 나이/지역 조건과 별개로 자격 요건(근로자 여부, 소득 기준 등)을 자동 판정. false면 "대상 아님" */
  checkEligible?: (profile: Profile) => boolean;
}

export interface BenefitResult {
  benefit: Benefit;
  status: "eligibleNow" | "upcoming" | "notEligible";
  /** 현재 나이 기준으로 계산된 대표 금액(원) */
  estimatedAmount: number;
}

export type TimelineCategory = "행정" | "건강" | "구매" | "돌봄";

export interface TimelineEventTemplate {
  id: string;
  title: string;
  category: TimelineCategory;
  /** 이 일정이 발생하는 시점(개월, 출생=0 기준. 음수면 임신 중) */
  atMonth: number;
  description?: string;
}

export type TimelineBucket = "past" | "today" | "thisWeek" | "thisMonth" | "later";

export interface TimelineEventResult {
  event: TimelineEventTemplate;
  bucket: TimelineBucket;
  /** 이 일정까지 남은 일수(음수면 지난 일정) */
  daysFromNow: number;
}

export type TodoCategory =
  | "예약"
  | "행정"
  | "건강"
  | "영양제"
  | "구매"
  | "재정·주거"
  | "할인·혜택"
  | "공공서비스"
  | "돌봄";

export interface TodoLink {
  label: string;
  url: string;
}

export interface TodoTemplate {
  id: string;
  title: string;
  category: TodoCategory;
  /** 이 일을 시작하면 좋은 시점(개월, 출생=0 기준, 음수는 임신 중) */
  startMonth: number;
  /** 이 시점을 넘기면 "지난 항목"으로 분류(개월) */
  dueMonth: number;
  /** 한 줄 요약 */
  summary: string;
  /** 꿀팁 목록 */
  tips: string[];
  links?: TodoLink[];
  /**
   * 이 항목 하단에 보여줄 제휴 링크 슬롯(public/site-config.js 의 slots 키). 슬롯 URL이 비어 있으면 아무것도 표시하지 않는다.
   * query는 urlTemplate 슬롯의 {q} 자리에 들어갈 검색어.
   */
  affiliate?: { slots: string[]; query?: string };
  /** 프로필 조건(예: 근로자만 해당). 없으면 모두에게 표시 */
  appliesTo?: (profile: Profile) => boolean;
}

/** now: 지금 해야 함 / soon: 2개월 안에 시작 / later: 나중에 / past: 시기를 지남 */
export type TodoStatus = "now" | "soon" | "later" | "past";

export interface TodoResult {
  todo: TodoTemplate;
  status: TodoStatus;
  /** soon/later일 때 시작까지 남은 개월 수 */
  monthsUntilStart?: number;
  /** now일 때 권장 기한까지 남은 개월 수 */
  monthsLeft?: number;
}

export interface DashboardSummary {
  /** 예: "생후 6개월" 또는 "임신 26주차" */
  ageLabel: string;
  /** 오늘~이번 주 할 일 중 가장 급한 3개 */
  topTasks: TimelineEventResult[];
  /** 구매 최적화로 절약되는 금액(필수+상황별, 구매가 대비 추천방법 차액) */
  itemSavings: number;
  /** 아직 신청 표시가 안 된 지금 받을 수 있는 지원금(서버는 신청 여부를 모르므로 전체를 반환, 신청완료 제외는 프론트에서 처리) */
  unclaimedBenefits: BenefitResult[];
  /** 지금 꼭 사야 할 아이템(필수) */
  buyNowItems: ChecklistItemResult[];
  /** 조만간 필요해질 아이템 중 아직은 사지 않아도 되는 것 상위 몇 개 */
  dontBuyYetItems: ChecklistItemResult[];
  /** 지금 준비해야 할 to-do(급한 순 상위). 완료 체크는 프론트 localStorage가 들고 있으므로 완료 제외는 프론트에서 처리 */
  activeTodos: TodoResult[];
}
