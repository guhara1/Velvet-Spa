/**
 * 사이트 전역 설정
 * 도메인과 상호가 확정되면 이 파일(또는 환경변수)만 바꾸면 전체에 반영된다.
 */
export const site = {
  /** 상호 — 미확정. 확정 후 이 값만 교체하면 전 페이지 반영 */
  brand: process.env.SITE_BRAND || '벨벳스파',
  brandEn: process.env.SITE_BRAND_EN || 'VELVET SPA',
  tagline: '서울·경기·인천 행정동별 마사지·출장 마사지·홈타이 정보',

  /** 도메인 — 미확정. Netlify 배포 URL(process.env.URL)을 우선 사용 */
  url: (process.env.SITE_URL || process.env.URL || 'https://example.netlify.app').replace(/\/$/, ''),

  /** 실제 도메인이 주입되지 않은 상태인지 (사이트맵·canonical·색인 제출의 전제 조건) */
  urlIsPlaceholder: !(process.env.SITE_URL || process.env.URL),

  /** 대표 전화 (모바일 하단 바 / 업소 CTA 공통) */
  phone: '05082024749',
  phoneLabel: '0508-202-4749',
  ctaLabel: '출장 마사지 전화연결',

  /**
   * 검색엔진 사이트 소유확인 메타 태그.
   * 값이 비어 있으면 해당 메타를 아예 출력하지 않는다.
   *   네이버  : 서치어드바이저 → 사이트 등록 → HTML 태그 방식
   *   구글    : Search Console → 소유권 확인 → HTML 태그
   *   빙/네이트: 각 웹마스터 도구
   */
  verification: {
    naver: process.env.NAVER_VERIFICATION || 'fbb133767a87d0c16b74337a0c43d974891e6d9d',
    google: process.env.GOOGLE_VERIFICATION || '',
    bing: process.env.BING_VERIFICATION || '',
  },

  /**
   * IndexNow 키 — Bing·Yandex·Seznam 에 변경 URL 을 즉시 통보하는 표준.
   * 빌드 시 /<key>.txt 파일이 생성되고, scripts/indexnow.mjs 가 이 키로 제출한다.
   * (구글과 네이버는 IndexNow 미지원 — 각 웹마스터 도구를 사용한다)
   */
  indexNowKey: process.env.INDEXNOW_KEY || '6f959dbf4b9a92fc52db4290984d7b7b',

  /** RSS/Atom 피드에 담을 최대 항목 수 */
  feedMax: 300,

  /** 업소 데이터 성격 고지 — 가상 데이터임을 모든 페이지에 노출 */
  demoNotice: '본 사이트에 표시된 업소 정보(상호·평점·가격·운영시간)는 플랫폼 구조 검증을 위한 가상 예시 데이터입니다. 실제 영업 중인 업소가 아니며, 실데이터 연동 시 전부 교체됩니다.',

  /**
   * 가상(데모) 데이터 모드.
   *   true  → 업소 상세 페이지 noindex, LocalBusiness 스키마 미생성, 가상 데이터 고지 노출
   *   false → 실제 업소 데이터로 교체한 뒤 전환. 색인 + 구조화 데이터가 활성화된다.
   * 실재하지 않는 업체 정보를 검색엔진에 공급하지 않기 위한 스위치.
   */
  demoData: true,

  shopsPerDong: 3,
  minChars: 1500,
};
