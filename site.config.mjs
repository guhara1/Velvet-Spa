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

  /** 대표 전화 (모바일 하단 바 / 업소 CTA 공통) */
  phone: '05082024749',
  phoneLabel: '0508-202-4749',
  ctaLabel: '출장 마사지 전화연결',

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
