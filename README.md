# 육아 토탈케어 앱 (로컬 프로토타입)

임신부터 육아까지 부모가 검색하지 않아도 되도록, "1개월차 MVP 3종"을 홈 대시보드로 통합한
로컬 전용 웹앱입니다. 로그인·DB 없이 브라우저 `localStorage`에 프로필을 저장합니다.

## 기능

- **육아 아이템 체크리스트** — 프로필(첫째 여부, 모유/분유, 자동차·세탁기 보유, 아기침대 사용 계획)에 따라
  필수/상황별/지금은 사지 마세요로 분류하고, 예상 사용기간 기준으로 구매/렌탈/중고 중 가장 저렴한 방법을 추천
- **정부지원금 체크리스트** — 아이 나이 기준으로 받을 수 있는 대표 제도를 매칭하고, "신청완료" 체크는
  브라우저에 저장
- **나이별 자동 타임라인** — 임신~7세 표준 일정(행정/건강/구매/돌봄)을 오늘/이번 주/이번 달/나중으로 분류

## 데이터에 대한 중요한 안내

`src/data/` 아래 육아용품 시세, 정부지원금 제도, 예방접종·검진 일정은 **Claude가 큐레이션한 참고용 데이터**이며
실시간 공공 API와 연동되어 있지 않습니다. 실제 신청·구매 전 반드시 정부24(gov.kr)·복지로(bokjiro.go.kr)·
아이사랑포털(childcare.go.kr) 및 소아청소년과에서 최신 정보를 확인하세요.

## 이번 범위에서 제외된 것

AI 육아 비서, 병원 예약, 어린이집 비교, 실제 커머스/렌탈/중고 거래, 결제, 가족 공유, 계정/로그인 —
전부 다음 단계 확장 대상입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3001 접속.

## 정적 배포 (GitHub Pages) — 서버 없이 운영

계산 로직은 브라우저에서 실행되므로 서버가 필요 없습니다(월 운영비 0원). 프로필은 여전히 브라우저에만 저장돼요.

```bash
npm run build      # public/logic.bundle.js + guide/*.html(SEO 6개) + privacy.html + sitemap.xml/robots.txt 생성
npm run typecheck
npm run dev        # public/ 을 http://localhost:3001 로 서빙 (개발 확인용)
```

1. GitHub에 새 저장소를 만들고 이 폴더를 push (`main` 브랜치)
2. 저장소 **Settings → Pages → Source: GitHub Actions** 선택
3. push 하면 `.github/workflows/pages.yml` 이 빌드·배포합니다. 주소는 `https://<아이디>.github.io/<저장소>/`
4. 커스텀 도메인을 쓰면 워크플로의 `SITE_URL` 을 그 주소로 바꾸세요 (canonical/sitemap 에 사용)
5. 배포 후 Google Search Console·네이버 서치어드바이저에 `sitemap.xml` 을 등록

## 수익 설정 — `public/site-config.js` 하나만 고치면 됩니다 (빌드 불필요)

값이 빈 문자열이면 해당 기능은 화면에 아예 나타나지 않습니다.

| 설정 | 하는 일 |
|---|---|
| `affiliate.slots.rental / shopping / sample` | 제휴 링크 3종. `url` 또는 `urlTemplate`(`{q}` 자리에 품목명이 들어감) |
| `affiliate.itemSlots` | 아이템별 개별 링크 (선택) |
| `affiliate.disclosure` | 제휴 고지 문구. 링크가 보이는 화면에 자동 표시 |
| `analytics.plausibleDomain` | 방문·클릭 통계(쿠키 없음). 비우면 스크립트를 불러오지 않음 |
| `alerts.endpoint` | 알림 신청(이메일) 폼을 받아줄 주소. 채우면 홈에 신청 카드가 나타남 |
| `privacyOfficerName`, `contactEmail` | 개인정보 보호책임자 성명·이메일 (방침에 표시, 알림을 켜기 전 필수) |
| `alerts.processor` | 신청 정보를 받는 서비스 이름과 서버 국가 (방침의 처리 위탁·국외 이전 항목) |

- 제휴 성과는 슬롯마다 **서브ID가 다른 링크**를 만들어 넣으면 제휴 네트워크 리포트에서 바로 슬롯별로 보입니다.
- 추천(구매/렌탈/중고)은 항상 가격 계산만으로 정해지고 제휴 여부와 무관합니다. 이 원칙을 지켜야 신뢰가 유지돼요.
- `public/privacy.html` 은 설정에 따라 자동 전환됩니다(알림 꺼짐: '수집 안 함' / 켜짐: 항목·위탁·국외이전·광고성 전송 항목 표시). 법률 검토를 거친 문안은 아니니 알림을 켜기 전 전문가 검토를 권해요. 운영 형태가 바뀌면 `scripts/build.ts` 의 `renderPrivacy` 를 함께 고치세요.
- 콘텐츠를 검수·수정하면 `scripts/build.ts` 의 `CONTENT_UPDATED` 날짜를 올려주세요.
