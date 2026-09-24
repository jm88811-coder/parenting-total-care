const PROFILE_KEY = "parenting-app:profile";
const BENEFIT_STATUS_KEY = "parenting-app:benefit-status";
const TODO_DONE_KEY = "parenting-app:todo-done";

const profileView = document.getElementById("profile-view");
const appView = document.getElementById("app-view");
const profileForm = document.getElementById("profile-form");
const tabContent = document.getElementById("tab-content");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));

const NEED_LEVEL_LABEL = { essential: "필수", situational: "상황별", notYet: "지금은 아직" };
const NEED_LEVEL_CLASS = { essential: "badge-essential", situational: "badge-situational", notYet: "badge-notyet" };
const METHOD_LABEL = { buy: "구매", rental: "렌탈", secondhand: "중고" };
const BUCKET_LABEL = { past: "지난 일정", today: "오늘", thisWeek: "이번 주", thisMonth: "이번 달", later: "나중에" };
const TODO_CATEGORY_ICON = {
  예약: "📅",
  행정: "📝",
  건강: "🏥",
  영양제: "💊",
  구매: "🛒",
  "재정·주거": "🏠",
  "할인·혜택": "🏷️",
  공공서비스: "🏛️",
  돌봄: "🧸",
};
const TODO_CATEGORIES = Object.keys(TODO_CATEGORY_ICON);
let todoFilter = "전체";

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw);
    // 이전 버전에 저장된 프로필과 호환: 새로 추가된 필드가 없으면 기본값을 채운다.
    if (typeof profile.isEmployed !== "boolean") profile.isEmployed = false;
    if (typeof profile.lowIncomeHousehold !== "boolean") profile.lowIncomeHousehold = false;
    return profile;
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/** benefitId -> "applied" | "notEligible" (사용자가 수동으로 표시한 상태) */
function loadBenefitStatusMap() {
  try {
    const raw = localStorage.getItem(BENEFIT_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBenefitStatusMap(map) {
  localStorage.setItem(BENEFIT_STATUS_KEY, JSON.stringify(map));
}

/** todoId -> true (사용자가 완료 표시한 할 일). 서버는 완료 여부를 모른다. */
function loadTodoDoneMap() {
  try {
    const raw = localStorage.getItem(TODO_DONE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTodoDoneMap(map) {
  localStorage.setItem(TODO_DONE_KEY, JSON.stringify(map));
}

function formatPrice(n) {
  return n.toLocaleString("ko-KR") + "원";
}

async function api(path, profile) {
  // 정적 배포(GitHub Pages)에서는 브라우저에서 바로 계산한다. 번들이 없을 때만 개발용 서버 API로 대체.
  if (window.ParentingLogic) return window.ParentingLogic.call(path, profile);
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "요청에 실패했습니다." }));
    throw new Error(err.error || "요청에 실패했습니다.");
  }
  return res.json();
}

function fillProfileForm(profile) {
  document.getElementById("babyDateType").value = profile.babyDateType;
  document.getElementById("babyDate").value = profile.babyDate;
  document.getElementById("feedingPlan").value = profile.feedingPlan;
  document.getElementById("region").value = profile.region;
  document.getElementById("expectedUsageMonths").value = profile.expectedUsageMonths ?? "";
  document.getElementById("isFirstChild").checked = profile.isFirstChild;
  document.getElementById("hasCar").checked = profile.hasCar;
  document.getElementById("hasWashingMachine").checked = profile.hasWashingMachine;
  document.getElementById("plansToUseCrib").checked = profile.plansToUseCrib;
  document.getElementById("isEmployed").checked = profile.isEmployed;
  document.getElementById("lowIncomeHousehold").checked = profile.lowIncomeHousehold;
}

function showProfileForm(prefill) {
  if (prefill) fillProfileForm(prefill);
  profileView.hidden = false;
  appView.hidden = true;
}

function showAppView() {
  profileView.hidden = true;
  appView.hidden = false;
}

profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const expectedUsageRaw = document.getElementById("expectedUsageMonths").value;
  const profile = {
    babyDateType: document.getElementById("babyDateType").value,
    babyDate: document.getElementById("babyDate").value,
    feedingPlan: document.getElementById("feedingPlan").value,
    region: document.getElementById("region").value.trim(),
    isFirstChild: document.getElementById("isFirstChild").checked,
    hasCar: document.getElementById("hasCar").checked,
    hasWashingMachine: document.getElementById("hasWashingMachine").checked,
    plansToUseCrib: document.getElementById("plansToUseCrib").checked,
    isEmployed: document.getElementById("isEmployed").checked,
    lowIncomeHousehold: document.getElementById("lowIncomeHousehold").checked,
    expectedUsageMonths: expectedUsageRaw ? Number(expectedUsageRaw) : undefined,
  };
  if (!profile.babyDate || !profile.region) return;

  saveProfile(profile);
  showAppView();
  activateTab("home");
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.tab === "edit") {
      showProfileForm(loadProfile());
      return;
    }
    activateTab(btn.dataset.tab);
  });
});

function setActiveButton(tab) {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab && tab !== "edit");
  });
}

async function activateTab(tab) {
  setActiveButton(tab);
  const profile = loadProfile();
  if (!profile) {
    showProfileForm();
    return;
  }

  tabContent.innerHTML = `<p class="empty-state">불러오는 중...</p>`;
  try {
    if (tab === "home") await renderHome(profile);
    else if (tab === "checklist") await renderChecklist(profile);
    else if (tab === "benefits") await renderBenefits(profile);
    else if (tab === "timeline") await renderTimeline(profile);
    else if (tab === "todos") await renderTodos(profile);
  } catch (err) {
    tabContent.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function renderHome(profile) {
  const data = await api("/api/dashboard", profile);
  const statusMap = loadBenefitStatusMap();

  const unclaimed = data.unclaimedBenefits.filter((b) => statusMap[b.benefit.id] !== "applied" && statusMap[b.benefit.id] !== "notEligible");
  const benefitSavings = unclaimed.reduce((sum, b) => sum + b.estimatedAmount, 0);
  const totalSavings = data.itemSavings + benefitSavings;

  const taskItems = data.topTasks
    .map(
      (t, i) => `
      <div class="task-row">
        <div>
          <div class="task-title">${i + 1}. ${t.event.title}</div>
          <div class="task-meta">${t.event.category} · ${BUCKET_LABEL[t.bucket]}</div>
        </div>
      </div>`
    )
    .join("");

  const todoDone = loadTodoDoneMap();
  const pendingTodos = data.activeTodos.filter((t) => !todoDone[t.todo.id]);
  const todoRows = pendingTodos
    .slice(0, 3)
    .map(
      (t) => `
      <div class="task-row">
        <div>
          <div class="task-title">${TODO_CATEGORY_ICON[t.todo.category] || "•"} ${t.todo.title}</div>
          <div class="task-meta">${t.todo.summary}</div>
        </div>
      </div>`
    )
    .join("");

  const buyNowItems = data.buyNowItems
    .slice(0, 4)
    .map(
      (r) => `
      <div class="item-row">
        <div>
          <div class="item-name">🟢 ${r.item.name}</div>
          <div class="item-meta">${METHOD_LABEL[r.recommendedMethod]} 추천</div>
        </div>
        <div class="price">${formatPrice(r.recommendedPrice)}</div>
      </div>`
    )
    .join("");

  const dontBuyYetItems = data.dontBuyYetItems
    .map(
      (r) => `
      <div class="item-row">
        <div>
          <div class="item-name">🔴 ${r.item.name}</div>
          <div class="item-meta">약 ${r.monthsUntilNeeded}개월 후 필요</div>
        </div>
      </div>`
    )
    .join("");

  tabContent.innerHTML = `
    <h2>${data.ageLabel}</h2>
    <p class="tagline" style="margin:0 0 1rem;">오늘 육아 최적화</p>

    <div class="section-title">🔥 오늘 해야 할 일 ${data.topTasks.length}</div>
    ${taskItems || `<p class="empty-state">지금은 예정된 할 일이 없어요.</p>`}

    <div class="section-title">✅ 지금 준비할 일 ${pendingTodos.length}${data.activeTodos.length >= 10 ? "+" : ""}</div>
    ${todoRows || `<p class="empty-state">지금 시기에 준비할 일을 모두 체크했어요. 👏</p>`}
    <button type="button" class="link-inline" data-go-todos>전체 할 일·꿀팁 보기 →</button>

    <div class="section-title">💰 이번 달 절약 가능 금액</div>
    <div class="dashboard-stat"><span class="num">${formatPrice(totalSavings)}</span></div>
    <div class="item-meta" style="margin-bottom:0.5rem;">정부지원 미신청 ${formatPrice(benefitSavings)} · 구매 최적화 ${formatPrice(data.itemSavings)}</div>

    <div class="section-title">🛒 지금 필요한 것</div>
    ${buyNowItems || `<p class="empty-state">지금 꼭 사야 할 아이템이 없어요.</p>`}

    <div class="section-title">🚫 지금 사지 마세요</div>
    ${dontBuyYetItems || `<p class="empty-state">아직 안내할 항목이 없어요.</p>`}

    <div class="section-title">🎁 받을 수 있는 돈</div>
    <div class="dashboard-stat"><span class="num">${unclaimed.length}</span><span>개의 미신청 지원금</span></div>

    ${alertCardHtml()}
    <p class="notice">절약 금액은 저희가 큐레이션한 참고용 추정치입니다. 정확한 금액·조건은 정부24(gov.kr)·복지로(bokjiro.go.kr)에서 확인하세요.</p>
  `;

  tabContent.querySelector("[data-go-todos]").addEventListener("click", () => activateTab("todos"));
  bindAlertForm(profile);
}

/** 알림 신청 카드. site-config.js 의 alerts.endpoint 가 비어 있으면 아예 표시하지 않는다. */
function alertCardHtml() {
  if (!PC.alertsEnabled()) return "";
  if (PC.alertsSubscribed()) {
    return `<div class="alert-card done">✅ 알림 신청이 완료됐어요. 곧 시작하는 일과 지원금 신청 시기를 이메일로 알려드릴게요.</div>`;
  }
  return `
    <form class="alert-card" id="alert-form">
      <div class="alert-title">🔔 놓치기 쉬운 신청 시기, 이메일로 알려드릴까요?</div>
      <input type="email" id="alert-email" placeholder="이메일 주소" required />
      <label class="checkbox-row small"><input type="checkbox" id="alert-consent" required /> <span>${PC.esc(PC.ALERT_CONSENT_TEXT)} <a href="privacy.html" target="_blank" rel="noopener">개인정보처리방침</a></span></label>
      <label class="checkbox-row small"><input type="checkbox" id="alert-due" /> <span>${PC.esc(PC.DUE_CONSENT_TEXT)}</span></label>
      <label class="checkbox-row small"><input type="checkbox" id="alert-marketing" /> <span>${PC.esc(PC.MARKETING_CONSENT_TEXT)}</span></label>
      <button type="submit" class="btn-primary">알림 신청</button>
      <div id="alert-msg" class="task-meta"></div>
    </form>`;
}

function bindAlertForm(profile) {
  const form = document.getElementById("alert-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("alert-msg");
    const email = document.getElementById("alert-email").value.trim();
    if (!document.getElementById("alert-consent").checked) {
      msg.textContent = "개인정보 수집·이용에 동의해 주세요.";
      return;
    }
    const withDue = document.getElementById("alert-due").checked;
    const marketing = document.getElementById("alert-marketing").checked;
    try {
      await PC.submitAlert({ email, dueMonth: withDue ? profile.babyDate.slice(0, 7) : "", marketing });
      renderHome(profile);
    } catch {
      msg.textContent = "전송에 실패했어요. 잠시 후 다시 시도해 주세요.";
    }
  });
}

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

/** 구매/렌탈/중고 가격을 저렴한 순으로 TOP3 랭킹 카드로 표시(옵션이 1개뿐이면 단일 가격만 표시) */
function renderPriceOptions(options, usageMonths) {
  if (options.length <= 1) {
    return `<div class="price">${formatPrice(options[0].price)}</div>`;
  }
  const rows = options
    .slice(0, 3)
    .map((o, i) => {
      const basis = o.method === "rental" ? `(${usageMonths}개월 기준) ` : "";
      return `<div class="price-option${i === 0 ? " best" : ""}">${RANK_MEDAL[i]} ${METHOD_LABEL[o.method]} ${basis}<span class="price">${formatPrice(o.price)}</span></div>`;
    })
    .join("");
  return `<div class="price-options">${rows}</div>`;
}

/** 추천 방법(렌탈/구매)에 맞는 제휴 링크. 링크 URL이 비어 있으면 빈 문자열. 추천 결과 자체는 링크 유무와 무관하다. */
function itemAffiliateHtml(r) {
  if (r.needLevel === "notYet") return "";
  const slot = r.recommendedMethod === "rental" ? "rental" : r.recommendedMethod === "buy" ? "shopping" : "";
  if (!slot) return "";
  const link = PC.affiliateLinkHtml(slot, { itemId: r.item.id, query: r.item.name });
  return link ? `<div class="aff-row">${link}</div>` : "";
}

function itemSection(title, results) {
  if (results.length === 0) return "";
  const rows = results
    .map(
      (r) => `
      <div class="item-row">
        <div>
          <div class="item-name">${r.item.name} <span class="badge ${NEED_LEVEL_CLASS[r.needLevel]}">${NEED_LEVEL_LABEL[r.needLevel]}</span></div>
          <div class="item-meta">${r.item.category}${r.monthsUntilNeeded ? ` · 약 ${r.monthsUntilNeeded}개월 후 필요` : ""}${r.item.note ? " · " + r.item.note : ""}</div>
          ${r.item.popularBrands ? `<div class="item-meta popular-brands">✨ 요즘 인기: ${r.item.popularBrands.join(", ")}</div>` : ""}
          ${itemAffiliateHtml(r)}
        </div>
        ${renderPriceOptions(r.priceOptions, r.usageMonths)}
      </div>`
    )
    .join("");
  return `<div class="section-title">${title}</div>${rows}`;
}

async function renderChecklist(profile) {
  const data = await api("/api/checklist", profile);

  tabContent.innerHTML = `
    <h2>육아 아이템 체크리스트</h2>
    ${itemSection("필수", data.essential)}
    ${itemSection("상황별", data.situational)}
    ${itemSection("지금은 사지 마세요", data.notYet)}
    ${PC.disclosureHtml()}
    <div class="total-cost">필수+상황별 예상 총비용: ${formatPrice(data.totalEstimatedCost)}<br />(렌탈·중고 추천으로 ${formatPrice(data.savingsFromOptimization)} 절약)</div>
    <p class="notice">가격 TOP3는 실시간 쇼핑몰 최저가가 아니라, 구매/렌탈/중고를 예상 사용기간 기준으로 계산해 저렴한 순으로 비교한 참고용 추정치입니다. 실제 구매 전 다나와·네이버쇼핑 등에서 최신 시세를 확인하세요.</p>
    <p class="notice">✨ 요즘 인기 브랜드는 맘맘 앱 국민템 랭킹(2026-09 기준)을 참고한 예시이며, 실시간 순위가 아닙니다.</p>
  `;
}

async function renderBenefits(profile) {
  const data = await api("/api/benefits", profile);
  const statusMap = loadBenefitStatusMap();

  const rows = data.benefits
    .map((b) => {
      const autoIneligible = b.status === "notEligible";
      const manualStatus = statusMap[b.benefit.id];
      const notEligible = autoIneligible || manualStatus === "notEligible";
      const applied = !notEligible && manualStatus === "applied";

      const statusLabel = notEligible ? "대상 아님" : applied ? "신청완료" : b.status === "eligibleNow" ? "신청 가능" : "신청 예정";
      const badgeClass = notEligible ? "badge-ineligible" : applied ? "badge-notyet" : b.status === "eligibleNow" ? "badge-essential" : "badge-situational";

      const controls = autoIneligible
        ? `<div class="benefit-meta">근로자 여부·소득 조건에 따라 자동으로 대상 아님으로 표시되었습니다. 프로필 수정에서 바꿀 수 있어요.</div>`
        : `
        <label class="checkbox-row">
          <input type="checkbox" data-benefit-id="${b.benefit.id}" data-mark="applied" ${applied ? "checked" : ""} />
          신청완료
        </label>
        <label class="checkbox-row">
          <input type="checkbox" data-benefit-id="${b.benefit.id}" data-mark="notEligible" ${manualStatus === "notEligible" ? "checked" : ""} />
          미대상
        </label>`;

      return `
      <div class="benefit-row">
        <div>
          <div class="benefit-name">${b.benefit.name} <span class="badge ${badgeClass}">${statusLabel}</span></div>
          <div class="benefit-meta">${b.benefit.amountLabel}</div>
          <div class="benefit-meta">신청방법: ${b.benefit.applyMethod}</div>
          <div class="benefit-meta">필요서류: ${b.benefit.requiredDocuments.join(", ")}</div>
          ${b.benefit.note ? `<div class="benefit-meta">${b.benefit.note}</div>` : ""}
          <a class="link-btn" href="${b.benefit.officialLink}" target="_blank" rel="noopener">공식 사이트에서 확인하기 →</a>
        </div>
        <div>${controls}</div>
      </div>`;
    })
    .join("");

  tabContent.innerHTML = `
    <h2>정부지원금</h2>
    ${rows || `<p class="empty-state">해당하는 지원금이 없어요.</p>`}
    <p class="notice">정확한 금액·조건·자격요건은 정부24(gov.kr)·복지로(bokjiro.go.kr)에서 반드시 다시 확인하세요.</p>
  `;

  tabContent.querySelectorAll("input[data-benefit-id]").forEach((el) => {
    el.addEventListener("change", () => {
      const map = loadBenefitStatusMap();
      const id = el.dataset.benefitId;
      const mark = el.dataset.mark;
      map[id] = el.checked ? mark : undefined;
      saveBenefitStatusMap(map);
      renderBenefits(profile);
    });
  });
}

async function renderTimeline(profile) {
  const data = await api("/api/timeline", profile);

  const buckets = ["past", "today", "thisWeek", "thisMonth", "later"];
  const sections = buckets
    .map((bucket) => {
      const events = data.timeline.filter((t) => t.bucket === bucket);
      if (events.length === 0) return "";
      const rows = events
        .map(
          (t) => `
        <details class="timeline-details">
          <summary>
            <span class="task-title">${t.event.title}</span>
            <span class="task-meta"> · ${t.event.category}</span>
          </summary>
          <p class="task-description">${t.event.description || "세부 설명이 아직 없어요."}</p>
        </details>`
        )
        .join("");
      return `<div class="section-title">${BUCKET_LABEL[bucket]}</div>${rows}`;
    })
    .join("");

  tabContent.innerHTML = `
    <h2>육아 타임라인</h2>
    ${sections || `<p class="empty-state">표시할 일정이 없어요.</p>`}
    <p class="notice">예방접종·건강검진 일정은 실제 고시 일정과 다를 수 있으니 소아청소년과·아이사랑포털(childcare.go.kr)에서 다시 확인하세요.</p>
  `;
}

function todoTimingLabel(r) {
  if (r.status === "now") {
    if (r.monthsLeft > 6) return "여유 있어요";
    return r.monthsLeft > 0 ? `권장 기한까지 약 ${r.monthsLeft}개월` : "지금이 적기";
  }
  if (r.status === "soon" || r.status === "later") return `약 ${r.monthsUntilStart}개월 후 시작`;
  return "권장 시기가 지났어요";
}

function todoRowHtml(r, done) {
  const t = r.todo;
  const tips = t.tips.map((tip) => `<li>${tip}</li>`).join("");
  const links = (t.links || [])
    .map((l) => `<a class="link-btn" href="${l.url}" target="_blank" rel="noopener">${l.label} →</a>`)
    .join(" ");
  const affHtml = t.affiliate
    ? t.affiliate.slots.map((slot) => PC.affiliateLinkHtml(slot, { itemId: t.id, query: t.affiliate.query })).join("")
    : "";
  return `
    <div class="todo-row${done ? " done" : ""}">
      <input type="checkbox" class="todo-check" data-todo-id="${t.id}" ${done ? "checked" : ""} aria-label="완료 표시" />
      <details data-id="${t.id}">
        <summary>
          <span class="task-title">${t.title}</span>
          <span class="badge badge-cat">${TODO_CATEGORY_ICON[t.category]} ${t.category}</span>
          <span class="task-meta todo-timing">${todoTimingLabel(r)}</span>
        </summary>
        <p class="task-description">${t.summary}</p>
        <div class="tip-title">💡 꿀팁</div>
        <ul class="tip-list">${tips}</ul>
        ${links ? `<div class="todo-links">${links}</div>` : ""}
        ${affHtml ? `<div class="aff-row">${affHtml}</div>` : ""}
      </details>
    </div>`;
}

async function renderTodos(profile) {
  const data = await api("/api/todos", profile);
  const doneMap = loadTodoDoneMap();

  const draw = () => {
    const openIds = new Set(Array.from(tabContent.querySelectorAll("details[open]")).map((d) => d.dataset.id));
    const scrollY = window.scrollY;

    const all = data.todos;
    const nowItems = all.filter((r) => r.status === "now");
    const nowDone = nowItems.filter((r) => doneMap[r.todo.id]).length;
    const percent = nowItems.length ? Math.round((nowDone / nowItems.length) * 100) : 100;

    const chips = ["전체", ...TODO_CATEGORIES]
      .map((cat) => {
        const pending =
          cat === "전체"
            ? nowItems.filter((r) => !doneMap[r.todo.id]).length
            : nowItems.filter((r) => r.todo.category === cat && !doneMap[r.todo.id]).length;
        const icon = cat === "전체" ? "" : TODO_CATEGORY_ICON[cat] + " ";
        return `<button type="button" class="chip${todoFilter === cat ? " active" : ""}" data-cat="${cat}">${icon}${cat}${pending ? ` <b>${pending}</b>` : ""}</button>`;
      })
      .join("");

    const visible = all.filter((r) => todoFilter === "전체" || r.todo.category === todoFilter);
    const section = (title, status, { collapsible = false } = {}) => {
      const rows = visible
        .filter((r) => r.status === status)
        .sort((a, b) => Number(!!doneMap[a.todo.id]) - Number(!!doneMap[b.todo.id]));
      if (rows.length === 0) return "";
      const body = rows.map((r) => todoRowHtml(r, !!doneMap[r.todo.id])).join("");
      if (collapsible) {
        return `<details class="todo-group"><summary class="section-title">${title} (${rows.length})</summary>${body}</details>`;
      }
      return `<div class="section-title">${title} (${rows.length})</div>${body}`;
    };

    const sections =
      section("🔥 지금 해야 할 일", "now") +
      section("⏳ 곧 시작 (2개월 이내)", "soon") +
      section("📅 나중에 준비할 일", "later", { collapsible: true }) +
      section("🗂 시기가 지난 항목", "past", { collapsible: true });

    tabContent.innerHTML = `
      <h2>할 일 & 꿀팁</h2>
      <p class="tagline" style="margin:0 0 0.75rem;">미리 준비할수록 아끼고, 덜 힘들어요. 항목을 눌러 꿀팁을 확인하세요.</p>
      <div class="progress-wrap">
        <div class="progress-label">지금 해야 할 일 ${nowDone}/${nowItems.length} 완료 (${percent}%)</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
      </div>
      <div class="chips">${chips}</div>
      ${sections || `<p class="empty-state">이 카테고리에는 표시할 할 일이 없어요.</p>`}
      ${PC.disclosureHtml()}
      <p class="notice">지원금·세제·대출·감면 제도는 자주 바뀌고 지자체마다 달라요. 저희가 큐레이션한 참고용 정보이니, 신청 전에 공식 링크나 주민센터·보건소에서 최신 조건을 꼭 확인하세요. 의료·영양제 관련 내용은 반드시 의사·약사와 상담하세요.</p>
    `;

    tabContent.querySelectorAll("details[data-id]").forEach((d) => {
      if (openIds.has(d.dataset.id)) d.open = true;
    });
    window.scrollTo(0, scrollY);

    tabContent.querySelectorAll(".chip").forEach((el) => {
      el.addEventListener("click", () => {
        todoFilter = el.dataset.cat;
        draw();
      });
    });
    tabContent.querySelectorAll("input[data-todo-id]").forEach((el) => {
      el.addEventListener("change", () => {
        const map = loadTodoDoneMap();
        if (el.checked) map[el.dataset.todoId] = true;
        else delete map[el.dataset.todoId];
        saveTodoDoneMap(map);
        Object.keys(doneMap).forEach((k) => delete doneMap[k]);
        Object.assign(doneMap, map);
        draw();
      });
    });
  };

  draw();
}

const existingProfile = loadProfile();
if (existingProfile) {
  showAppView();
  activateTab("home");
} else {
  showProfileForm();
}
