# 수도권 행정동 마사지 디렉터리 (뼈대 플랫폼)

서울·경기·인천을 **행정구 77곳 / 행정동 753곳** 단위로 나눈 정적 사이트 생성기입니다.
의존성 0개 · Node 20+ · Netlify 배포 기준으로 만들어졌습니다.

```
npm run regions   # data/regions.json 재생성 (네트워크 필요, 최초 1회면 충분)
npm run build     # dist/ 생성 + 품질 검증
npm run qa        # 빌드 결과 점검 (메타/접근성/JSON-LD)
npm run dev       # 빌드 후 http://localhost:4321 로컬 확인
```

---

## 1. 지금 상태 / 먼저 바꿔야 할 것

| 항목 | 현재 값 | 바꾸는 곳 |
|---|---|---|
| 상호 | `벨벳스파` (가칭) | `site.config.mjs` → `brand`, `brandEn` 또는 환경변수 `SITE_BRAND` |
| 도메인 | Netlify 임시 URL | Netlify 환경변수 `SITE_URL=https://내도메인.com` |
| 대표 전화 | `0508-202-4749` | `site.config.mjs` → `phone` |
| 업소 데이터 | **가상 예시** | `data/` 연동 후 `site.config.mjs` → `demoData: false` |

### `demoData` 스위치가 하는 일

업소 정보(상호·평점·가격·운영시간)는 현재 전부 **가상 데이터**입니다.
실재하지 않는 업체를 검색엔진에 공급하지 않으려고, `demoData: true` 인 동안에는

- 업소 상세 페이지 2,259개 → `noindex, follow`
- `LocalBusiness` / `aggregateRating` 구조화 데이터 **생성하지 않음**
- 모든 업소 카드·상세·히어로에 "예시용 가상 업소" 표기

실제 업소 데이터로 교체한 뒤 `demoData: false` 로 바꾸면 색인·스키마가 한 번에 켜집니다.
**검색 노출의 주력은 행정구·행정동 페이지(830개)이며, 이 페이지들은 지금도 전부 색인 대상입니다.**

---

## 2. 구조

```
/                           홈
/guide/                     이용 가이드
/search/                    지역 검색 (noindex)
/seoul/                     시·도
/seoul/gangnam/             행정구
/seoul/gangnam/yeoksam/     행정동   ← SEO 주력 페이지
/seoul/gangnam/yeoksam/raon-relaxation/   업소 상세
```

URL 슬러그는 **국어의 로마자 표기법**(자음동화·연음 반영)으로 생성합니다.
`종로 → jongno`, `신림 → sillim`, `설악 → seorak`, `왕십리 → wangsimni`

```
data/regions.json        행정구역 + 중심좌표 (생성물, 커밋됨)
scripts/build-regions.mjs  원본 → regions.json 변환
scripts/build.mjs        사이트 빌드 + 검증
scripts/qa.mjs           빌드 결과 점검
src/lib/                 romanize / rng / fill(조사 교정) / svg / model / content / seo
src/content/             문장 풀 (행정동·행정구·업소·고정 페이지)
src/templates/           layout / parts / pages
src/assets/              style.css, app.js
```

---

## 3. 콘텐츠 생성 방식

행정동 753곳 × 1,500자를 손으로 쓸 수 없으므로, **시드 기반 조합 생성**으로 만듭니다.

- 섹션 13종 × (제목 6~8안 × 문장 슬롯 3개 × 변형 5~8안)
- 섹션 **순서**와 **단락 묶음 방식**까지 시드로 섞음
- 지역 성격 태그·인접 행정동·코스·가격대를 토큰으로 주입
- 시드는 지역 경로 고정 → **빌드를 다시 돌려도 글이 바뀌지 않음** (색인 안정)
- `src/lib/fill.mjs` 가 **조사(은/는, 을/를, 으로/로)를 자동 교정**하므로 템플릿 작성 시 조사를 신경 쓸 필요 없음

행정구와 행정동은 서술 각도를 분리했습니다 — 행정동은 *개인의 선택 가이드*, 행정구는 *권역 단위 분포*.
시·도 3개와 홈·가이드는 조합 생성이 아니라 직접 집필했습니다.

### 빌드가 강제하는 품질 기준 (실패 시 빌드 중단)

| 검사 | 기준 | 현재 |
|---|---|---|
| 본문 분량 | 공백 제외 1,500자 이상 | 행정동 평균 1,642자 / 행정구 평균 1,788자 |
| 페이지 간 중복도 | 8-gram Jaccard 최대 45% 미만 | 행정동 최대 15.2% (평균 3.0%) / 행정구 최대 17.8% (평균 4.3%) |
| 미치환 토큰 | 0건 | 0건 |
| 로드샵 디스크립션 | `출장 마사지` + `홈타이` 필수 포함 | 1,506곳 전부 통과 |

---

## 4. SEO / GEO / AEO

- **SEO** — 페이지별 고유 title·description·canonical·OG, 사이트맵 인덱스(5,000 URL 단위 분할), `robots.txt`(네이버 Yeti·Daumoa·Googlebot·bingbot 명시 허용)
- **GEO** — 행정동마다 실제 중심좌표를 `geo.position` / `ICBM` 메타와 `Place.geo` 스키마에 주입 (통계청 센서스 경계 폴리곤 평균)
- **AEO** — 모든 지역 페이지 상단에 답변 우선(`요약`) 블록, 질문형 H2, `FAQPage` 스키마 835개
- **구조화 데이터** — `WebSite`+`SearchAction` / `Organization` / `BreadcrumbList` / `Place` / `Service` / `ItemList` / `FAQPage` / `Article`
- **네이버 C-Rank 고려** — 한 주제(지역 × 마사지)로 사이트 전체를 묶고, 시도→구→동→업소→인접동으로 내부링크를 촘촘하게 연결해 주제 집중도와 문서 깊이를 확보했습니다. 지역별 글이 같은 틀을 쓰되 표면 문장이 거의 겹치지 않도록 중복도를 빌드에서 수치로 관리합니다.

> 네이버 서치어드바이저 소유확인 메타는 `src/templates/layout.mjs` 의 `<head>` 에 한 줄 추가하면 됩니다.

---

## 5. 디자인

- 다크 기본 + 라이트 토글(`localStorage` 저장, FOUC 방지 인라인 부트스트랩), 시스템 설정 자동 감지
- 본문 대비 다크 16:1 / 라이트 14:1 — WCAG AA 상회
- 사진 소재 0장. 히어로와 업소 썸네일은 **전부 텍스트 기반 SVG 생성**이며, 8종 팔레트와 기하 파라미터를 지역 시드에서 뽑아 페이지마다 다른 그림이 나옵니다
- 히어로는 가로형(1200×560) / 세로형(840×780) 두 벌을 만들어 CSS로 전환 — 모바일에서 제목이 잘리지 않습니다
- 모바일 하단 고정 바: **`출장 마사지 전화연결` + `0508-202-4749`** (`tel:` 링크, 54px 탭 타깃, safe-area 대응)
- 접근성: 스킵 링크, `:focus-visible` 3px 아웃라인, 모든 SVG에 `role="img"`+`aria-label`, `prefers-reduced-motion` 대응

---

## 6. 행정구역 데이터

원본은 통계청 센서스용 행정구역경계(KOSTAT, `southkorea/southkorea-maps`)입니다.

- `○○1동 / ○○2동 / ○○3동` → **대표 1곳(`○○동`)으로 통합** (요구사항)
- 2013년 이후 변경분 보정: 인천 남구→미추홀구 개칭, 부천시 일반구 폐지 통합,
  신설 행정동 18곳(다산·미사·감일·위례·새솔·망포·옥정·배곧·향동·고덕·신현·능평·마산·운양·고산·역북·삼가) 추가
- 중심좌표는 경계 폴리곤 꼭짓점 평균이며, 보정 행정동은 근사값입니다

> 행정동은 수시로 신설·통합됩니다. 운영 전 행정안전부 최신 자료로 `data/regions.json` 을 한 번 검증하시길 권합니다. 구조상 이 파일만 교체하면 전 페이지가 따라옵니다.

---

## 7. 배포

Netlify에 저장소를 연결하면 `netlify.toml` 설정대로 동작합니다.

- Build command `npm run build` / Publish directory `dist`
- 에셋은 내용 해시 파일명 + 1년 `immutable` 캐시
- 보안 헤더(`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) 적용

배포 후 **Site settings → Environment variables** 에 `SITE_URL` 을 등록해야
canonical·OG·사이트맵이 실제 도메인으로 바뀝니다.

---

## 8. 법적 고지

마사지는 의료 행위가 아니며 질병의 진단·치료를 대체하지 않습니다.
모든 페이지 푸터에 건강 고지와 가상 데이터 고지를 노출하고 있습니다.
실제 운영 시에는 합법적으로 등록된 업소만 등록하시고, 통신판매업·광고 관련 표시 의무를 확인하시기 바랍니다.
