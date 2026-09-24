/**
 * 앱 화면과 가이드(SEO) 페이지가 함께 쓰는 공용 헬퍼: 제휴 링크, 클릭 추적, 통계 로더, 알림 신청.
 * 설정은 site-config.js 에서만 바꾸세요.
 */
(function () {
  const cfg = window.SITE_CONFIG || {};
  const aff = cfg.affiliate || {};
  const CLICK_KEY = "parenting-app:clicks";
  const ALERT_KEY = "parenting-app:alert-subscribed";

  const ALERT_CONSENT_VERSION = "2026-09-v2";
  const ALERT_CONSENT_TEXT =
    "[필수] 개인정보 수집·이용 동의 — 수집 항목: 이메일 주소 / 이용 목적: 육아 일정·지원금 신청 시기 안내 이메일 발송 / 보유·이용 기간: 수신 거부 또는 삭제 요청 시까지. 동의를 거부할 수 있으며, 거부하면 알림 신청이 불가해요.";
  const DUE_CONSENT_TEXT =
    "[선택] 민감정보(임신·출산 관련 정보) 수집·이용 동의 — 수집 항목: 출산(예정) 월 / 이용 목적: 아기 월령에 맞춘 시기별 알림 / 보유·이용 기간: 수신 거부 또는 삭제 요청 시까지. 동의하지 않아도 알림 신청·이용에 불이익이 없고, 이 경우 일반 안내만 받아요.";
  const MARKETING_CONSENT_TEXT =
    "[선택] 광고성 정보 수신 동의 — 렌탈·육아용품 등 제휴 상품·서비스 안내가 포함된 이메일을 받아요. 동의하지 않아도 알림 신청에 불이익이 없고, 언제든 수신을 거부할 수 있어요.";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function slotUrl(slotId, opts) {
    const o = opts || {};
    const slot = (aff.slots || {})[slotId];
    if (!slot) return "";
    const override = o.itemId && aff.itemSlots && aff.itemSlots[o.itemId] ? aff.itemSlots[o.itemId][slotId] : "";
    let url = override || slot.url || "";
    if (!url && slot.urlTemplate && o.query) url = slot.urlTemplate.replace("{q}", encodeURIComponent(o.query));
    if (!url) return "";
    if (aff.appendUtm) {
      try {
        const u = new URL(url);
        u.searchParams.set("utm_source", "parenting-total-care");
        u.searchParams.set("utm_medium", "affiliate");
        u.searchParams.set("utm_campaign", slotId);
        if (o.itemId || o.query) u.searchParams.set("utm_content", o.itemId || o.query);
        url = u.toString();
      } catch {
        /* URL 형식이 아니면 그대로 사용 */
      }
    }
    return url;
  }

  /** 슬롯 URL이 채워져 있을 때만 링크 HTML을 돌려준다. 비어 있으면 빈 문자열(아무것도 안 보임). */
  function affiliateLinkHtml(slotId, opts) {
    const url = slotUrl(slotId, opts);
    if (!url) return "";
    const slot = aff.slots[slotId];
    const ctx = (opts && (opts.itemId || opts.query)) || "";
    return `<a class="aff-btn" href="${esc(url)}" target="_blank" rel="sponsored nofollow noopener" data-aff-slot="${esc(slotId)}" data-aff-ctx="${esc(ctx)}">${esc(slot.label)} ↗</a>`;
  }

  function hasAnyAffiliate() {
    return Object.keys(aff.slots || {}).some((id) => {
      const s = aff.slots[id];
      return !!(s.url || s.urlTemplate);
    });
  }

  function disclosureHtml() {
    if (!hasAnyAffiliate() || !aff.disclosure) return "";
    return `<p class="notice aff-disclosure">📢 ${esc(aff.disclosure)}</p>`;
  }

  function track(name, props) {
    try {
      if (typeof window.plausible === "function") window.plausible(name, { props: props || {} });
      window.dispatchEvent(new CustomEvent("pc:track", { detail: { name, props: props || {} } }));
      if (name === "affiliate_click" && props && props.slot) {
        const counts = JSON.parse(localStorage.getItem(CLICK_KEY) || "{}");
        counts[props.slot] = (counts[props.slot] || 0) + 1;
        localStorage.setItem(CLICK_KEY, JSON.stringify(counts));
      }
    } catch {
      /* 추적 실패가 화면 동작을 막지 않게 한다 */
    }
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[data-aff-slot]");
    if (a) track("affiliate_click", { slot: a.dataset.affSlot, ctx: a.dataset.affCtx || "", page: location.pathname });
  });

  const an = cfg.analytics || {};
  if (an.plausibleDomain) {
    window.plausible =
      window.plausible ||
      function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };
    const s = document.createElement("script");
    s.defer = true;
    s.dataset.domain = an.plausibleDomain;
    s.src = an.plausibleScript || "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }

  const alertsCfg = cfg.alerts || {};
  function alertsEnabled() {
    return !!alertsCfg.endpoint;
  }
  function alertsSubscribed() {
    return localStorage.getItem(ALERT_KEY) === "1";
  }

  /** 동의가 확인된 경우에만 호출할 것. 출산예정 월은 별도 동의(선택)를 받았을 때만 함께 보낸다. */
  async function submitAlert({ email, dueMonth, marketing }) {
    const f = alertsCfg.fields || {};
    const body = new URLSearchParams();
    body.set(f.email || "email", email);
    if (dueMonth) body.set(f.dueMonth || "dueMonth", dueMonth);
    body.set(f.consent || "consent", "yes");
    body.set(f.marketing || "marketing", marketing ? "yes" : "no");
    body.set(f.consentText || "consentText", ALERT_CONSENT_VERSION);
    body.set(f.source || "source", "app");
    // Google Forms 등은 CORS 응답을 주지 않아 no-cors 로 전송한다(성공 여부는 확인할 수 없음).
    await fetch(alertsCfg.endpoint, { method: "POST", mode: "no-cors", body });
    localStorage.setItem(ALERT_KEY, "1");
    track("alert_signup", { withDueMonth: !!dueMonth, marketing: !!marketing });
  }

  /** 가이드 페이지의 <div data-aff-slot="rental" data-query="..."> 자리를 채운다. */
  function fillSlots(root) {
    (root || document).querySelectorAll("[data-fill-slot]").forEach((el) => {
      el.innerHTML = affiliateLinkHtml(el.dataset.fillSlot, { query: el.dataset.query || "" });
    });
    const d = (root || document).querySelector("[data-fill-disclosure]");
    if (d) d.innerHTML = disclosureHtml();
  }

  window.PC = {
    config: cfg,
    esc,
    slotUrl,
    affiliateLinkHtml,
    hasAnyAffiliate,
    disclosureHtml,
    track,
    alertsEnabled,
    alertsSubscribed,
    submitAlert,
    fillSlots,
    ALERT_CONSENT_TEXT,
    DUE_CONSENT_TEXT,
    MARKETING_CONSENT_TEXT,
  };

  document.addEventListener("DOMContentLoaded", () => fillSlots(document));
})();
