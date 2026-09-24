/**
 * 운영자가 직접 채우는 설정 파일입니다. 이 파일만 고치고 다시 배포하면 되고, 빌드는 필요 없어요.
 * 값을 비워두면(빈 문자열) 해당 기능은 화면에 아예 나타나지 않습니다. (죽은 링크가 노출되지 않도록)
 */
window.SITE_CONFIG = {
  siteName: "육아 토탈케어",

  /** 개인정보 보호책임자 성명·이메일. 개인정보처리방침에 그대로 표시됩니다. 알림 수집(alerts.endpoint)을 켜기 전에 꼭 채우세요. */
  privacyOfficerName: "",
  contactEmail: "",

  affiliate: {
    /**
     * 제휴 고지 문구. 제휴 프로그램(예: 쿠팡 파트너스)이 요구하는 정확한 문구가 있으면 그대로 붙여 넣으세요.
     * 링크가 하나라도 보이는 화면에는 이 문구가 자동으로 함께 표시됩니다.
     */
    disclosure:
      "일부 링크는 제휴 링크예요. 링크를 통해 구매·신청하시면 이용자 부담 추가 없이 운영자가 소정의 수수료를 받을 수 있어요. 구매/렌탈/중고 추천과 가격 비교는 수수료와 무관하게 계산됩니다.",

    /**
     * true면 링크 끝에 utm_source/medium/campaign/content 를 붙입니다.
     * 일부 단축 링크(link.coupang.com 등)는 추가 파라미터를 싫어할 수 있어 기본은 false예요.
     * 권장 방법: 제휴 네트워크 대시보드에서 슬롯마다 다른 서브ID로 링크를 따로 만들면 보고서에서 슬롯별 성과가 바로 보입니다.
     */
    appendUtm: false,

    /**
     * 슬롯 = 화면에 노출되는 제휴 링크 자리. url(고정 링크) 또는 urlTemplate({q} 자리에 검색어가 들어감) 중 하나를 채우세요.
     * - rental   : 체크리스트에서 "렌탈 추천"인 아이템, 렌탈이 유리한 육아템 안내 하단
     * - shopping : "구매 추천"인 아이템, 카시트·출산가방 등 쇼핑 관련 할 일 하단
     * - sample   : 분유·기저귀 샘플/체험팩 신청 안내 하단
     */
    slots: {
      rental: { label: "육아용품 렌탈 가격 확인", url: "", urlTemplate: "" },
      shopping: { label: "최저가 확인", url: "", urlTemplate: "" },
      sample: { label: "무료 샘플·체험팩 신청", url: "", urlTemplate: "" },
    },

    /** (선택) 아이템별로 다른 링크를 쓰고 싶을 때. 예: { stroller: { rental: "https://...", shopping: "https://..." } } */
    itemSlots: {},
  },

  /**
   * 방문·클릭 통계. Plausible(쿠키 없는 통계)을 쓰면 도메인만 넣으세요. 예: "myname.github.io"
   * 비워두면 통계 스크립트를 아예 불러오지 않습니다. (제휴 클릭 수는 제휴 네트워크 리포트에서도 확인 가능)
   */
  analytics: {
    plausibleDomain: "",
    plausibleScript: "https://plausible.io/js/script.js",
  },

  /**
   * 알림 신청(이메일 수집) 폼. endpoint에 Formspree·Google Forms formResponse 등 "POST를 받아주는 주소"를 넣으면 활성화됩니다.
   * fields는 그 서비스에서 요구하는 입력 이름으로 바꿔 주세요. (Google Forms는 entry.123456 형태)
   */
  alerts: {
    endpoint: "",
    /** 신청 정보를 받아주는 서비스의 이름과 서버 소재 국가. 방침의 '처리 위탁·국외 이전' 항목에 표시됩니다. 예: { name: "Formspree", country: "미국" } */
    processor: { name: "", country: "" },
    fields: { email: "email", dueMonth: "dueMonth", consent: "consent", marketing: "marketing", consentText: "consentText", source: "source" },
  },
};
