/** HTML 셸 — 헤더 / 푸터 / 모바일 전화 바 / 메타 / JSON-LD */
import { site } from '../../site.config.mjs';
import { markSvg } from '../lib/svg.mjs';

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** 모바일 하단 고정 전화 바 — 요구사항: 버튼 문구에 '출장 마사지' 포함 */
function callbar(label) {
  return `<div class="callbar" role="region" aria-label="전화 상담">
<a class="btn btn-primary" href="tel:${site.phone}" data-cta="call">
<strong>${esc(site.ctaLabel)}</strong><span>${esc(site.phoneLabel)}</span></a>
<a class="btn" href="/search/" aria-label="지역 검색">지역검색</a>
</div>`;
}

function header(nav, provinces) {
  const links = provinces.map((p) => `<a href="${p.url}"${nav === p.slug ? ' aria-current="true"' : ''}>${esc(p.short)}</a>`).join('');
  return `<header class="head">
<div class="wrap head-in">
<a class="brand" href="/">${markSvg(32)}<span>${esc(site.brand)}<small>${esc(site.brandEn)}</small></span></a>
<nav class="nav" aria-label="지역">${links}<a href="/search/"${nav === 'search' ? ' aria-current="true"' : ''}>지역검색</a></nav>
<a class="head-tel" href="tel:${site.phone}">${esc(site.ctaLabel)} ${esc(site.phoneLabel)}</a>
<button class="icon-btn" type="button" data-theme-toggle aria-label="테마 전환">☀</button>
</div>
</header>`;
}

function footer(provinces) {
  const cols = provinces.map((p) => `<div><h3>${esc(p.name)}</h3><ul>${p.districts.slice(0, 9).map((d) => `<li><a href="${d.url}">${esc(d.name)}</a></li>`).join('')}<li><a href="${p.url}"><strong>${esc(p.short)} 전체 보기 →</strong></a></li></ul></div>`).join('');
  return `<footer class="foot">
<div class="wrap">
<div class="foot-grid">
${cols}
<div><h3>이용 안내</h3><ul>
<li><a href="/">전체 지역</a></li>
<li><a href="/search/">지역 검색</a></li>
<li><a href="/guide/">이용 가이드</a></li>
<li><a href="tel:${site.phone}">${esc(site.ctaLabel)} ${esc(site.phoneLabel)}</a></li>
</ul></div>
</div>
<p class="disclaimer"><b>데이터 고지</b> · ${esc(site.demoNotice)}<br>
<b>건강 관련 고지</b> · 마사지는 의료 행위가 아니며 질병의 진단·치료를 대체하지 않습니다. 통증이 지속되거나 저림·마비 등이 있으면 의료기관 진료를 먼저 받으시기 바랍니다. 임신 중, 발열, 급성 염증, 수술 직후, 음주 후에는 이용을 피해 주세요.<br>
<b>행정구역 데이터</b> · 통계청 센서스용 행정구역경계를 기준으로 하며, 번호가 붙은 분동(1동·2동·3동 등)은 대표 지역 1곳으로 통합해 표기했습니다.<br>
© ${new Date().getFullYear()} ${esc(site.brand)} (상호 미확정 / 가칭)</p>
</div>
</footer>`;
}

/**
 * 페이지 렌더
 * @param {object} o title, desc, path, hero, crumbs, main, jsonld, nav, provinces, assets, ctaLabel, geo, keywords
 */
export function page(o) {
  const canonical = `${site.url}${o.path}`;
  const graph = (o.jsonld ?? []).filter(Boolean);
  const ldBlock = graph.length
    ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`
    : '';
  const geoMeta = o.geo
    ? `<meta name="geo.region" content="KR">
<meta name="geo.placename" content="${esc(o.geo.name)}">
<meta name="geo.position" content="${o.geo.lat};${o.geo.lng}">
<meta name="ICBM" content="${o.geo.lat}, ${o.geo.lng}">`
    : '';

  return `<!doctype html>
<html lang="ko" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
${o.keywords ? `<meta name="keywords" content="${esc(o.keywords)}">` : ''}
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${esc(o.robots ?? 'index,follow,max-image-preview:large,max-snippet:-1')}">
<meta name="format-detection" content="telephone=yes">
<meta name="author" content="${esc(site.brand)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.brand)}">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
${geoMeta}
<meta name="theme-color" content="#0B0910" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#FAF8FC" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="${o.assets.css}">
<script>try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
${ldBlock}
</head>
<body>
<a class="skip" href="#main">본문으로 바로가기</a>
${header(o.nav, o.provinces)}
<main id="main" class="wrap">
${o.crumbs ?? ''}
${o.main}
</main>
${footer(o.provinces)}
${callbar(o.ctaLabel)}
<script src="${o.assets.js}" defer></script>
</body>
</html>`;
}

/** 빵부스러기 — HTML + JSON-LD 동시 생성 */
export function crumbs(items) {
  const html = `<nav aria-label="현재 위치"><ol class="crumb">${items
    .map((it, i) => (i === items.length - 1
      ? `<li><span aria-current="page">${esc(it.name)}</span></li>`
      : `<li><a href="${it.url}">${esc(it.name)}</a></li>`))
    .join('')}</ol></nav>`;
  const ld = {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name,
      ...(i === items.length - 1 ? {} : { item: `${site.url}${it.url}` }),
    })),
  };
  return { html, ld };
}
