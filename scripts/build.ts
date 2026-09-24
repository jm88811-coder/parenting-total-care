/**
 * 정적 배포용 빌드: (1) 계산 로직을 브라우저 번들로 묶고 (2) SEO 가이드 페이지·사이트맵·robots·개인정보처리방침을 생성한다.
 * 실행: npm run build   →   public/ 폴더가 그대로 배포 대상(GitHub Pages)이다.
 * 환경변수 SITE_URL(예: https://아이디.github.io/저장소) 이 있으면 canonical·sitemap 에 절대주소를 쓴다.
 */
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todos } from "../src/data/todos.js";
import { benefits } from "../src/data/benefits.js";
import { items } from "../src/data/items.js";
import type { Item, TodoTemplate } from "../src/types.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const guideDir = path.join(pub, "guide");

const SITE_URL = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
/** 콘텐츠를 마지막으로 손본 날짜. 내용을 검수·수정했을 때 직접 올려주세요(빌드한 날짜가 아님). */
const CONTENT_UPDATED = process.env.CONTENT_UPDATED ?? "2026-09-25";
const SITE_NAME = "육아 토탈케어";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// ─────────────────────────── 가이드 페이지 정의 ───────────────────────────

interface GuideSection {
  heading?: string;
  todoIds?: string[];
  /** 그대로 넣는 HTML(신뢰할 수 있는 정적 문자열만) */
  html?: string;
}

interface GuidePage {
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  sections: GuideSection[];
  /** 페이지 하단 제휴 슬롯 */
  slots?: { slot: string; query?: string }[];
}

const pages: GuidePage[] = [
  {
    slug: "newborn-checklist",
    title: "출산 준비물 체크리스트 | 필수·상황별·렌탈·중고 비교",
    h1: "출산 준비물 체크리스트: 뭘 사고, 뭘 빌리고, 뭘 사지 말까",
    description: "출산 준비물을 필수와 상황별로 나누고, 필요한 시기와 구매·렌탈·중고 중 어느 쪽이 싼지 예상 사용기간 기준으로 비교했어요.",
    intro:
      "출산 준비물은 '한꺼번에 다 사는 것'이 가장 큰 낭비입니다. 아래 표는 필요한 시기와 구매·렌탈·중고 예상 비용을 비교해, 사용 기간이 짧은 물건은 빌리거나 물려받도록 안내합니다. '필요 시기'가 출산 뒤인 물건은 그때 가서 사도 늦지 않아요. 가격은 대략적인 시세 추정치이니 구매 전 최신 가격을 확인하세요.",
    sections: [
      { html: "@@ITEM_TABLES@@" },
      { heading: "똑똑하게 사는 순서", todoIds: ["baby-fair-coupons", "secondhand-safety-check", "hospital-bag-check", "car-seat-install"] },
    ],
    slots: [
      { slot: "rental", query: "육아용품 렌탈" },
      { slot: "shopping", query: "신생아 출산준비물" },
    ],
  },
  {
    slug: "newborn-special-loan",
    title: "신생아 특례대출 알아보기 | 조건·청약·세제 체크리스트",
    h1: "신생아 특례대출과 출산 가구 주거·세제 혜택 체크리스트",
    description: "신생아 특례대출(디딤돌·버팀목), 청약 특별공급, 취득세 감면, 연말정산·증여공제까지 출산 가구가 미리 확인할 재정·주거 항목을 정리했어요.",
    intro:
      "출산 가구를 위한 주거·세제 혜택은 조건과 기간이 자주 바뀝니다. 여기서는 어떤 제도를 언제 확인해야 하는지 큰 그림을 정리했고, 정확한 자격과 금액은 반드시 공식 사이트(주택도시기금, 청약홈, 홈택스 등)에서 신청 직전에 다시 확인하세요.",
    sections: [
      {
        todoIds: [
          "newborn-special-loan",
          "housing-subscription-check",
          "acquisition-tax-benefit",
          "year-end-tax-birth",
          "birth-gift-tax-exemption",
          "child-account-plan",
        ],
      },
    ],
  },
  {
    slug: "postpartum-center-booking",
    title: "산후조리원 예약 시기와 고르는 법 | 산후도우미·분만병원 준비",
    h1: "산후조리원 언제 예약할까? 예약 시기와 고르는 체크포인트",
    description: "인기 산후조리원은 임신 초·중기에 마감돼요. 예약 시기, 투어 체크리스트, 환불 규정, 산후도우미 예약, 분만병원 준비까지 한 번에 정리했어요.",
    intro:
      "산후조리원은 임신이 확인되는 순간부터 알아보는 것이 안전합니다. 조리원, 산후도우미, 분만병원은 서로 일정이 얽혀 있어서 한 묶음으로 계획해야 실패가 적어요.",
    sections: [
      { todoIds: ["postpartum-center-booking", "postpartum-helper-booking", "hospital-birth-plan", "cord-blood-decision", "hospital-bag-check"] },
    ],
  },
  {
    slug: "birth-support-money",
    title: "출산·육아 지원금 총정리 | 부모급여·아동수당·첫만남이용권",
    h1: "출산·육아 지원금 총정리: 부모급여·아동수당·첫만남이용권 신청법",
    description: "부모급여, 아동수당, 첫만남이용권 등 출산·육아 지원금의 금액, 신청 방법, 필요 서류를 정리했어요. 신청이 늦으면 손해 볼 수 있는 항목도 짚었어요.",
    intro:
      "출산 직후에는 챙길 게 많아서 지원금 신청을 놓치기 쉽습니다. 아래 표는 대표 제도의 금액과 신청 방법을 요약한 것이며, 금액과 조건은 개편될 수 있으니 신청 전 공식 사이트에서 최신 내용을 확인하세요.",
    sections: [
      { html: "@@BENEFIT_CARDS@@" },
      { heading: "놓치지 않는 신청 요령", todoIds: ["one-stop-birth-apply", "local-benefits-search", "energy-bill-discount", "newborn-health-insurance"] },
    ],
  },
  {
    slug: "baby-photo-booking",
    title: "만삭·신생아·50일·100일·돌 촬영 예약 시기 | 스튜디오 고르는 법",
    h1: "만삭·신생아·50일·100일·돌 촬영, 언제 예약해야 할까",
    description: "만삭 촬영, 신생아 촬영, 50일·100일 기념 촬영, 돌잔치·돌 스냅 예약 시기와 스튜디오 비교 포인트, 셀프 촬영 팁을 정리했어요.",
    intro:
      "아기 사진은 인기 시기가 정해져 있어서 예약이 빨리 마감됩니다. 시기별로 언제 예약을 잡아야 하는지, 무엇을 비교해야 하는지 정리했어요.",
    sections: [{ todoIds: ["maternity-photo-booking", "newborn-photo-booking", "day50-100-photo", "first-birthday-booking"] }],
  },
  {
    slug: "toy-library-public-library",
    title: "장난감도서관·공공도서관·공동육아 이용 꿀팁 | 육아 비용 줄이기",
    h1: "장난감도서관·공공도서관·공동육아나눔터, 무료로 100% 활용하는 법",
    description: "장난감도서관 대여, 공공도서관 북스타트, 공동육아나눔터, 육아종합지원센터 등 공공 육아 인프라를 이용하는 방법과 꿀팁을 정리했어요.",
    intro:
      "장난감·책·놀이 공간은 가장 빨리 커지는 육아 비용입니다. 공공 인프라를 잘 쓰면 큰 돈을 아끼고 육아 친구도 만들 수 있어요. 운영 방식은 지역마다 달라서 가까운 곳에 먼저 문의해 보세요.",
    sections: [
      { todoIds: ["toy-library", "public-library-bookstart", "co-parenting-nanum", "childcare-support-center", "co-parenting-community", "kids-facility-map"] },
    ],
  },
];

// ─────────────────────────── 렌더 헬퍼 ───────────────────────────

const todoById = new Map(todos.map((t) => [t.id, t]));

function todoBlock(t: TodoTemplate): string {
  const links = (t.links ?? [])
    .map((l) => `<a class="link-btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} →</a>`)
    .join(" ");
  const aff = (t.affiliate?.slots ?? [])
    .map((slot) => `<span data-fill-slot="${esc(slot)}" data-query="${esc(t.affiliate?.query ?? "")}"></span>`)
    .join("");
  return `
<section class="guide-todo" id="${esc(t.id)}">
  <h2>${esc(t.title)}</h2>
  <p class="guide-summary">${esc(t.summary)}</p>
  <ul class="tip-list">${t.tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
  ${links ? `<div class="todo-links">${links}</div>` : ""}
  ${aff ? `<div class="aff-row">${aff}</div>` : ""}
</section>`;
}

function monthLabel(m: number): string {
  if (m < 0) return `출산 약 ${Math.abs(m)}개월 전`;
  if (m === 0) return "출산 즈음";
  return `생후 ${m}개월`;
}

function won(n: number | null): string {
  return n == null ? "-" : n.toLocaleString("ko-KR") + "원";
}

function cheapestLabel(item: Item): string {
  const options: { label: string; price: number }[] = [{ label: "구매", price: item.buyPrice }];
  if (item.rentalPricePerMonth != null) options.push({ label: "렌탈", price: item.rentalPricePerMonth * item.typicalUsageMonths });
  if (item.secondhandPrice != null) options.push({ label: "중고", price: item.secondhandPrice });
  options.sort((a, b) => a.price - b.price);
  return options[0].label;
}

function itemTables(): string {
  const groups: { title: string; level: Item["baseNeedLevel"]; note: string }[] = [
    { title: "필수 준비물", level: "essential", note: "대부분의 가정에서 필요한 물건이에요." },
    { title: "상황별 준비물", level: "situational", note: "가구 상황(자동차·세탁기·수유 방식 등)에 따라 필요 여부가 달라요." },
    { title: "지금은 사지 않아도 되는 것", level: "notYet", note: "아이가 크면서 필요해지는 물건이에요. 미리 사두면 낭비가 되기 쉬워요." },
  ];
  return groups
    .map((g) => {
      const rows = items
        .filter((i) => i.baseNeedLevel === g.level)
        .sort((a, b) => a.startMonth - b.startMonth)
        .map(
          (i) => `<tr>
  <td>${esc(i.name)}<div class="cell-sub">${esc(i.category)}</div></td>
  <td>${esc(monthLabel(i.startMonth))}</td>
  <td>${won(i.buyPrice)}</td>
  <td>${i.rentalPricePerMonth != null ? won(i.rentalPricePerMonth) + "/월" : "-"}</td>
  <td>${won(i.secondhandPrice)}</td>
  <td><b>${cheapestLabel(i)}</b></td>
</tr>`
        )
        .join("");
      if (!rows) return "";
      return `<h2>${g.title}</h2><p>${g.note}</p>
<div class="table-wrap"><table class="guide-table">
<thead><tr><th>품목</th><th>필요 시기</th><th>구매가</th><th>렌탈</th><th>중고</th><th>가장 저렴(예상 사용기간 기준)</th></tr></thead>
<tbody>${rows}</tbody></table></div>`;
    })
    .join("");
}

function benefitCards(): string {
  return `<h2>대표 지원금 한눈에 보기</h2>` +
    benefits
      .map(
        (b) => `
<section class="guide-todo" id="${esc(b.id)}">
  <h3>${esc(b.name)}</h3>
  <p class="guide-summary"><b>${esc(b.amountLabel)}</b></p>
  <ul class="tip-list">
    <li>신청 방법: ${esc(b.applyMethod)}</li>
    <li>필요 서류: ${esc(b.requiredDocuments.join(", "))}</li>
    ${b.note ? `<li>${esc(b.note)}</li>` : ""}
  </ul>
  <div class="todo-links"><a class="link-btn" href="${esc(b.officialLink)}" target="_blank" rel="noopener">공식 사이트에서 확인하기 →</a></div>
</section>`
      )
      .join("");
}

const DISCLAIMER =
  "이 글은 큐레이션한 참고용 정보이며 제도·금액·일정은 자주 바뀌고 지자체마다 다릅니다. 신청 전에 반드시 공식 사이트나 주민센터·보건소에서 최신 조건을 확인하세요. 의료·영양제 관련 내용은 의사·약사와 상담하세요.";

function layout(opts: { title: string; description: string; pathFromRoot: string; body: string; jsonLd?: object }): string {
  const canonical = SITE_URL ? `<link rel="canonical" href="${esc(SITE_URL + "/" + opts.pathFromRoot)}" />` : "";
  const ogUrl = SITE_URL ? `<meta property="og:url" content="${esc(SITE_URL + "/" + opts.pathFromRoot)}" />` : "";
  const ld = opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : "";
  const up = opts.pathFromRoot.includes("/") ? "../" : "";
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(opts.title)}</title>
  <meta name="description" content="${esc(opts.description)}" />
  ${canonical}
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(opts.title)}" />
  <meta property="og:description" content="${esc(opts.description)}" />
  ${ogUrl}
  ${ld}
  <link rel="stylesheet" href="${up}style.css" />
</head>
<body class="guide">
  <header class="hero"><a class="brand" href="${up}index.html">👶 ${SITE_NAME}</a></header>
  <main>
${opts.body}
  </main>
  <footer class="site-footer">
    <a href="${up}index.html">앱으로 내 상황 맞춤 확인</a> · <a href="${up}guide/index.html">가이드 모음</a> · <a href="${up}privacy.html">개인정보처리방침</a>
  </footer>
  <script src="${up}site-config.js"></script>
  <script src="${up}site.js"></script>
</body>
</html>
`;
}

function renderGuide(page: GuidePage): string {
  const sections = page.sections
    .map((s) => {
      const head = s.heading ? `<h2 class="guide-h2">${esc(s.heading)}</h2>` : "";
      if (s.html === "@@ITEM_TABLES@@") return itemTables();
      if (s.html === "@@BENEFIT_CARDS@@") return benefitCards();
      if (s.html) return s.html;
      const blocks = (s.todoIds ?? []).map((id) => {
        const t = todoById.get(id);
        if (!t) throw new Error(`가이드 "${page.slug}"가 존재하지 않는 todo id를 참조합니다: ${id}`);
        return todoBlock(t);
      });
      return head + blocks.join("");
    })
    .join("\n");

  const slots = (page.slots ?? [])
    .map((s) => `<span data-fill-slot="${esc(s.slot)}" data-query="${esc(s.query ?? "")}"></span>`)
    .join("");

  const related = pages
    .filter((p) => p.slug !== page.slug)
    .map((p) => `<li><a href="${p.slug}.html">${esc(p.h1)}</a></li>`)
    .join("");

  const body = `
<article class="card guide-article">
  <h1>${esc(page.h1)}</h1>
  <p class="guide-meta">최종 업데이트 ${CONTENT_UPDATED} · 큐레이션 참고용</p>
  <p class="guide-intro">${esc(page.intro)}</p>
  ${sections}
  ${slots ? `<div class="aff-row">${slots}</div>` : ""}
  <div class="cta-box">
    <b>내 출산예정일·상황에 맞춰 자동으로 정리해 볼까요?</b>
    <p>출산예정일만 입력하면 지금 할 일, 사야 할 것, 받을 수 있는 지원금을 바로 보여줘요. 회원가입 없이 무료예요.</p>
    <a class="btn-primary cta-btn" href="../index.html">무료로 내 맞춤 체크리스트 만들기</a>
  </div>
  <div data-fill-disclosure></div>
  <p class="notice">${esc(DISCLAIMER)}</p>
  <h2 class="guide-h2">함께 보면 좋은 가이드</h2>
  <ul class="tip-list">${related}</ul>
</article>`;

  return layout({
    title: page.title,
    description: page.description,
    pathFromRoot: `guide/${page.slug}.html`,
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.h1,
      description: page.description,
      inLanguage: "ko",
      dateModified: CONTENT_UPDATED,
      publisher: { "@type": "Organization", name: SITE_NAME },
    },
  });
}

function renderGuideIndex(): string {
  const list = pages
    .map((p) => `<li><a href="${p.slug}.html"><b>${esc(p.h1)}</b></a><div class="task-meta">${esc(p.description)}</div></li>`)
    .join("");
  const body = `
<article class="card guide-article">
  <h1>육아 가이드 모음</h1>
  <p class="guide-intro">출산 준비부터 돌 전후까지, 미리 알면 아끼고 덜 힘든 정보를 모았어요.</p>
  <ul class="guide-list">${list}</ul>
  <p class="notice">${esc(DISCLAIMER)}</p>
</article>`;
  return layout({
    title: `육아 가이드 모음 | ${SITE_NAME}`,
    description: "출산 준비물, 지원금, 산후조리원, 촬영 예약, 공공 육아 인프라까지 육아 가이드를 모았어요.",
    pathFromRoot: "guide/index.html",
    body,
  });
}

function renderPrivacy(): string {
  const body = `
<article class="card guide-article">
  <h1>개인정보처리방침</h1>
  <p class="guide-meta">시행일 ${CONTENT_UPDATED}</p>
  <p>${SITE_NAME}(이하 "서비스")는 「개인정보 보호법」 등 관련 법령을 지키며, 이용자의 개인정보를 아래와 같이 처리합니다.</p>

  <h2>1. 처리하는 개인정보의 항목·목적·보유기간</h2>
  <div data-when="no-alerts">
    <p>서비스는 현재 이용자로부터 이름·이메일 등 <b>개인정보를 수집하지 않습니다.</b> 이용자가 입력한 프로필(출산예정일, 거주지역, 가구 상황 등)과 할 일 완료 표시는 이용자 브라우저의 저장공간(localStorage)에만 저장되고 운영자 서버로 전송되지 않으며, 브라우저의 사이트 데이터를 삭제하면 지워집니다.</p>
  </div>
  <div data-when="alerts">
    <p>이용자가 선택적으로 신청하는 '알림 서비스'에서만 아래 정보를 수집합니다. 프로필(출산예정일, 거주지역 등)은 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
    <div class="table-wrap"><table class="guide-table">
      <thead><tr><th>구분</th><th>항목</th><th>이용 목적</th><th>보유·이용 기간</th></tr></thead>
      <tbody>
        <tr><td>필수</td><td>이메일 주소</td><td>육아 일정·지원금 신청 시기 안내 이메일 발송</td><td>수신 거부 또는 삭제 요청 시까지</td></tr>
        <tr><td>선택(민감정보)</td><td>출산(예정) 월</td><td>아기 월령에 맞춘 시기별 알림</td><td>수신 거부 또는 삭제 요청 시까지</td></tr>
        <tr><td>선택</td><td>광고성 정보 수신 동의 여부</td><td>제휴 상품·서비스 안내 발송 여부 판단</td><td>수신 거부 또는 삭제 요청 시까지</td></tr>
        <tr><td>자동 생성</td><td>동의 여부, 동의 문구 버전, 신청 시각</td><td>동의 사실 확인</td><td>수신 거부 또는 삭제 요청 시까지</td></tr>
      </tbody>
    </table></div>
    <p>출산(예정) 월은 임신·출산에 관한 정보로 「개인정보 보호법」상 민감정보에 해당할 수 있어, 일반 동의와 <b>별도로</b> 동의를 받은 경우에만 수집합니다. 동의하지 않아도 알림 신청과 서비스 이용에 불이익이 없습니다.</p>
  </div>

  <h2>2. 만 14세 미만 아동의 개인정보</h2>
  <p>서비스는 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 서비스에서 다루는 정보는 보호자가 직접 입력하는 것으로, 아기의 이름·사진 등 식별 정보를 입력받지 않습니다.</p>

  <h2>3. 개인정보의 제3자 제공</h2>
  <p>서비스는 이용자의 개인정보를 제3자에게 제공하거나 판매하지 않습니다. 다만 법령에 근거가 있는 경우는 예외로 합니다.</p>

  <div data-when="alerts">
    <h2>4. 개인정보 처리 위탁 및 국외 이전</h2>
    <div class="table-wrap"><table class="guide-table">
      <thead><tr><th>수탁자(이전받는 자)</th><th>이전 국가</th><th>위탁 업무 / 이전 목적</th><th>이전 항목</th><th>이전 일시·방법</th><th>보유·이용 기간</th></tr></thead>
      <tbody><tr>
        <td><span data-fill="processorName"></span></td>
        <td><span data-fill="processorCountry"></span></td>
        <td>알림 신청 정보의 수집·저장</td>
        <td>위 1항의 수집 항목</td>
        <td>이용자가 알림을 신청하는 시점에 인터넷(암호화 통신)으로 전송</td>
        <td>위탁 계약 종료 또는 삭제 요청 시까지</td>
      </tr></tbody>
    </table></div>
    <p>이용자는 국외 이전을 거부할 수 있으나, 이 경우 알림 신청이 제한됩니다.</p>
  </div>

  <h2>5. 개인정보의 파기</h2>
  <p>수집 목적이 달성되었거나 이용자가 수신 거부·삭제를 요청하면 해당 개인정보를 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는 방법으로 삭제합니다.</p>

  <h2>6. 정보주체의 권리와 행사 방법</h2>
  <p>이용자는 언제든지 개인정보의 열람·정정·삭제·처리정지와 동의 철회를 요구할 수 있으며, 아래 개인정보 보호책임자 이메일로 요청하면 지체 없이 조치합니다. 알림 이메일에 포함된 수신 거부 방법으로도 언제든 거부할 수 있습니다.</p>

  <div data-when="alerts">
    <h2>7. 광고성 정보 전송</h2>
    <p>'광고성 정보 수신'에 동의한 이용자에게만 제휴 상품·서비스 안내가 포함된 이메일을 보냅니다. 이 경우 제목에 (광고) 표시, 발신자 정보, 수신 거부 방법을 명시하며, 오후 9시부터 다음 날 오전 8시까지는 별도 동의 없이 보내지 않습니다. 동의하지 않은 이용자에게는 일정·지원금 안내 등 정보성 이메일만 보냅니다.</p>
  </div>

  <h2>8. 쿠키·통계·제휴 링크</h2>
  <div data-when="analytics">
    <p>서비스는 방문 통계를 위해 쿠키를 사용하지 않는 통계 도구를 사용합니다. 개인을 식별하는 정보를 수집하지 않는 방식입니다.</p>
  </div>
  <div data-when="affiliate">
    <p>일부 링크는 제휴 링크입니다. 링크를 눌러 제휴 대상 사이트로 이동하면 해당 사이트가 자체 쿠키 등을 사용할 수 있으며, 이는 해당 사이트의 개인정보처리방침에 따릅니다. 서비스는 제휴 링크를 통한 구매·신청에 대해 수수료를 받을 수 있습니다.</p>
  </div>
  <p>서비스는 맞춤형 광고를 위한 행태정보를 수집·이용하지 않습니다. 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다.</p>

  <h2>9. 안전성 확보 조치</h2>
  <p>서비스는 수집하는 개인정보를 필요한 최소한으로 제한하고, 수집 정보에 접근할 수 있는 사람을 운영자로 한정하며, 정보를 저장하는 서비스 계정에 강력한 비밀번호와 2단계 인증을 적용합니다.</p>

  <h2>10. 개인정보 보호책임자</h2>
  <ul class="tip-list">
    <li>성명: <span data-fill="officerName"></span></li>
    <li>이메일: <span data-fill="officerEmail"></span></li>
  </ul>

  <h2>11. 권익침해 구제 방법</h2>
  <p>개인정보 침해에 대한 도움이나 상담이 필요하면 아래 기관에 문의할 수 있습니다. (연락처는 변경될 수 있으니 각 기관 사이트에서 확인하세요.)</p>
  <ul class="tip-list">
    <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
    <li>개인정보침해신고센터(한국인터넷진흥원): 국번 없이 118 (privacy.kisa.or.kr)</li>
    <li>경찰청 사이버범죄 신고시스템: 국번 없이 182 (ecrm.police.go.kr)</li>
  </ul>

  <h2>12. 방침의 변경</h2>
  <p>이 방침이 변경되면 시행일 7일 전부터 이 페이지에 변경 내용을 공지합니다. 이용자의 권리에 중요한 변경은 더 일찍 알립니다.</p>
</article>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    var cfg = window.SITE_CONFIG || {};
    var alertsOn = !!(cfg.alerts && cfg.alerts.endpoint);
    var analyticsOn = !!(cfg.analytics && cfg.analytics.plausibleDomain);
    var affiliateOn = !!(window.PC && window.PC.hasAnyAffiliate());
    var state = { alerts: alertsOn, "no-alerts": !alertsOn, analytics: analyticsOn, affiliate: affiliateOn };
    document.querySelectorAll("[data-when]").forEach(function (el) { el.hidden = !state[el.dataset.when]; });
    var proc = (cfg.alerts && cfg.alerts.processor) || {};
    var values = {
      officerName: cfg.privacyOfficerName,
      officerEmail: cfg.contactEmail,
      processorName: proc.name,
      processorCountry: proc.country
    };
    var n = 0;
    document.querySelectorAll("article h2").forEach(function (h) {
      if (h.closest("[hidden]")) return;
      n += 1;
      h.textContent = n + ". " + h.textContent.replace(/^\\d+\\.\\s*/, "");
    });
    document.querySelectorAll("[data-fill]").forEach(function (el) {
      el.textContent = values[el.dataset.fill] || "(운영자 입력 필요)";
    });
  });
</script>`;
  return layout({ title: `개인정보처리방침 | ${SITE_NAME}`, description: `${SITE_NAME} 개인정보처리방침`, pathFromRoot: "privacy.html", body });
}

// ─────────────────────────── 실행 ───────────────────────────

async function main() {
  await build({
    entryPoints: [path.join(root, "src/client/entry.ts")],
    bundle: true,
    outfile: path.join(pub, "logic.bundle.js"),
    format: "iife",
    platform: "browser",
    target: "es2020",
    minify: true,
    legalComments: "none",
  });

  fs.rmSync(guideDir, { recursive: true, force: true });
  fs.mkdirSync(guideDir, { recursive: true });
  for (const page of pages) fs.writeFileSync(path.join(guideDir, `${page.slug}.html`), renderGuide(page));
  fs.writeFileSync(path.join(guideDir, "index.html"), renderGuideIndex());
  fs.writeFileSync(path.join(pub, "privacy.html"), renderPrivacy());

  const urls = ["index.html", "guide/index.html", ...pages.map((p) => `guide/${p.slug}.html`), "privacy.html"];
  if (SITE_URL) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${SITE_URL}/${u === "index.html" ? "" : u}</loc><lastmod>${CONTENT_UPDATED}</lastmod></url>`)
      .join("\n")}\n</urlset>\n`;
    fs.writeFileSync(path.join(pub, "sitemap.xml"), sitemap);
    fs.writeFileSync(path.join(pub, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  } else {
    fs.rmSync(path.join(pub, "sitemap.xml"), { force: true });
    fs.writeFileSync(path.join(pub, "robots.txt"), `User-agent: *\nAllow: /\n`);
    console.warn("⚠ SITE_URL 이 없어 canonical·sitemap.xml 을 만들지 않았어요. 배포할 때는 SITE_URL 을 지정하세요.");
  }

  console.log(`빌드 완료: 로직 번들 + 가이드 ${pages.length}개 + 개인정보처리방침${SITE_URL ? " + sitemap" : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
