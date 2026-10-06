/** 페이지 템플릿 — 홈 / 시도 / 행정구 / 행정동 / 업소 / 검색 / 가이드 / 404 */
import { site } from '../../site.config.mjs';
import { page, crumbs, esc } from './layout.mjs';
import { heroPair } from '../lib/svg.mjs';
import { proseBlock, answerBlock, faqBlock, statsBlock, shopCard, dongGrid, districtGroups, linkChips, demoNote } from './parts.mjs';
import { shortDong } from '../content/vocab.mjs';
import { STATIC_META } from '../content/meta-pools.mjs';
import * as S from '../lib/seo.mjs';

const clip = (s, n = 155) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).replace(/[,·\s]+$/, '')}…`;
};

/* ────────────────────────────── 홈 */
export function homePage(ctx) {
  const { provinces, assets, home, lastmod } = ctx;
  const totalDong = provinces.reduce((s, p) => s + p.dongCount, 0);
  const totalGu = provinces.reduce((s, p) => s + p.districts.length, 0);
  const totalShop = provinces.reduce((s, p) => s + p.shopCount, 0);

  const hero = heroPair({
    key: 'home', eyebrow: `${site.brandEn} · 수도권 지역 디렉터리`,
    title: '동네 단위로 찾는 마사지', ghost: 'MASSAGE',
    sub: '서울·경기·인천 행정동별 로드샵 · 출장 마사지 · 홈타이',
    note: `${site.ctaLabel} ${site.phoneLabel}`,
  });

  const main = `<div class="hero">${hero}</div>
<h1>서울·경기·인천 행정동별 마사지·출장 마사지·홈타이 정보</h1>
${answerBlock(home.answer, '한눈에 보기')}
${statsBlock([
    { value: `${totalGu}곳`, label: '행정구 · 시 · 군' },
    { value: `${totalDong}곳`, label: '행정동 (대표 통합 기준)' },
    { value: `${totalShop}곳`, label: '등록 업소 (가상 예시)' },
    { value: '3단계', label: '시도 → 행정구 → 행정동' },
  ])}
<form class="search-box" action="/search/" method="get" role="search">
<input name="q" type="search" placeholder="행정동·행정구 이름으로 검색 (예: 역삼동, 분당구)" aria-label="지역 검색">
<button class="btn btn-primary" type="submit">검색</button>
</form>

<section aria-labelledby="area-h">
<div class="section-head"><h2 id="area-h">지역 선택</h2><span class="section-note">시·도를 고르면 행정구와 행정동이 순서대로 나옵니다</span></div>
<div class="grid grid-3">
${provinces.map((p) => `<a class="area-card" href="${p.url}">
<b>${esc(p.name)}</b>
<span class="tagline">행정구 ${p.districts.length}곳 · 행정동 ${p.dongCount}곳</span>
<span>업소 ${p.shopCount}곳 · 90분 ${esc(p.districts[0].band.p90)}만원대</span>
</a>`).join('')}
</div>
</section>

<section aria-labelledby="pick-h">
<div class="section-head"><h2 id="pick-h">많이 찾는 지역</h2><span class="section-note">행정구 단위 바로가기</span></div>
${linkChips(ctx.featured.map((d) => ({ name: `${d.province.short} ${d.name}`, url: d.url })), '많이 찾는 행정구')}
</section>

<hr class="sep">
<section>${proseBlock(home, { toc: false })}</section>
${faqBlock(home.faqs)}
${demoNote()}`;

  return page({
    title: `서울·경기·인천 마사지 출장 홈타이 지역별 정보 | ${site.brand}`,
    desc: STATIC_META.home,
    keywords: '마사지, 출장 마사지, 홈타이, 서울 마사지, 경기 마사지, 인천 마사지, 로드샵, 스웨디시, 아로마 마사지',
    path: '/', nav: 'home', provinces, assets,
    main,
    jsonld: [
      S.websiteLd(), S.organizationLd(),
      S.itemListLd({ path: '/', name: '시·도 목록', items: provinces.map((p) => ({ name: p.name, url: p.url })) }),
      S.faqLd(home.faqs, '/'),
      S.articleLd({ path: '/', headline: '서울·경기·인천 행정동별 마사지 정보', desc: clip(home.answer), lastmod }),
    ],
  });
}

/* ────────────────────────────── 시 · 도 */
export function provincePage(ctx) {
  const { province, provinces, assets, doc, lastmod } = ctx;
  const c = crumbs([{ name: '전체 지역', url: '/' }, { name: province.name, url: province.url }]);
  const hero = heroPair({
    key: province.slug, eyebrow: `${province.name} 지역 정보`,
    title: `${province.short} 마사지`, ghost: province.slug.toUpperCase(),
    sub: `행정구 ${province.districts.length}곳 · 행정동 ${province.dongCount}곳 · 로드샵과 홈타이 비교`,
    note: `${site.ctaLabel} ${site.phoneLabel}`,
  });

  const main = `${c.html}
<div class="hero">${hero}</div>
<h1>${esc(province.name)} 마사지 · 출장 마사지 · 홈타이</h1>
${answerBlock(doc.answer)}
${statsBlock([
    { value: `${province.districts.length}곳`, label: province.slug === 'gyeonggi' ? '시 · 군 · 구' : '행정구' },
    { value: `${province.dongCount}곳`, label: '행정동' },
    { value: `${province.shopCount}곳`, label: '등록 업소 (가상)' },
    { value: '60~120분', label: '코스 운영 범위' },
  ])}

<section aria-labelledby="gu-h">
<div class="section-head"><h2 id="gu-h">${esc(province.short)} 행정구 선택</h2><span class="section-note">행정구를 고르면 소속 행정동 전체가 나옵니다</span></div>
${districtGroups(province)}
</section>

<hr class="sep">
<section>${proseBlock(doc)}</section>
${faqBlock(doc.faqs)}
${linkChips(provinces.filter((p) => p !== province).map((p) => ({ name: `${p.name} 보기`, url: p.url })), '다른 시·도')}
${demoNote()}`;

  return page({
    title: `${province.name} 마사지 출장 홈타이 | 행정구·행정동별 정보 | ${site.brand}`,
    desc: doc.meta,
    keywords: `${province.short} 마사지, ${province.short} 출장 마사지, ${province.short} 홈타이, ${province.short} 로드샵, ${province.short} 스웨디시`,
    path: province.url, nav: province.slug, provinces, assets,
    geo: { name: province.name, lat: province.districts[0].lat, lng: province.districts[0].lng },
    main,
    jsonld: [
      S.websiteLd(), S.organizationLd(), c.ld,
      S.placeLd({ name: province.name, path: province.url, lat: province.districts[0].lat, lng: province.districts[0].lng, desc: clip(doc.answer, 200) }),
      S.serviceLd({ name: `${province.short} 마사지·출장 마사지·홈타이 정보`, path: province.url, areaName: province.name, desc: clip(doc.answer, 200) }),
      S.itemListLd({ path: province.url, name: `${province.name} 행정구 목록`, items: province.districts.map((d) => ({ name: d.name, url: d.url })) }),
      S.faqLd(doc.faqs, province.url),
      S.articleLd({ path: province.url, headline: `${province.name} 마사지 지역 가이드`, desc: clip(doc.answer), lastmod }),
    ],
  });
}

/* ────────────────────────────── 행정구 */
export function districtPage(ctx) {
  const { district, province, provinces, assets, doc, lastmod, siblings } = ctx;
  const c = crumbs([
    { name: '전체 지역', url: '/' },
    { name: province.name, url: province.url },
    { name: district.name, url: district.url },
  ]);
  const hero = heroPair({
    key: `${province.slug}/${district.slug}`, eyebrow: `${province.name} ${district.name}`,
    title: `${district.shortName} 마사지`, ghost: shortDong(district.shortName),
    sub: `행정동 ${district.dongs.length}곳 · ${district.profile.join(' · ')}`,
    note: `${site.ctaLabel} ${site.phoneLabel}`,
  });
  const picks = district.dongs.slice(0, 3).flatMap((d) => d.shops.slice(0, 1));

  const main = `${c.html}
<div class="hero">${hero}</div>
<h1>${esc(province.short)} ${esc(district.name)} 마사지 · 출장 마사지 · 홈타이</h1>
${answerBlock(doc.answer)}
${statsBlock([
    { value: `${district.dongs.length}곳`, label: '행정동' },
    { value: `${district.shopCount}곳`, label: '등록 업소 (가상)' },
    { value: `${district.band.p90}만원`, label: '90분 참고 가격' },
    { value: `${district.band.p60}만원`, label: '60분 참고 가격' },
  ])}

<section aria-labelledby="dong-h">
<div class="section-head"><h2 id="dong-h">${esc(district.shortName)} 행정동 전체</h2><span class="section-note">1동·2동 등 분동은 대표 1곳으로 통합</span></div>
${dongGrid(district.dongs)}
</section>

<section aria-labelledby="pick-h">
<div class="section-head"><h2 id="pick-h">${esc(district.shortName)} 업소 살펴보기</h2><span class="section-note">행정동별 대표 예시</span></div>
<div class="grid grid-3">${picks.map((s) => shopCard(s)).join('')}</div>
</section>

<hr class="sep">
<section>${proseBlock(doc)}</section>
${faqBlock(doc.faqs)}
${linkChips(siblings.map((d) => ({ name: d.name, url: d.url })), `${province.short} 인접 행정구`)}
${demoNote()}`;

  return page({
    title: `${district.name} 마사지 출장 홈타이 | ${province.short} 행정동별 | ${site.brand}`,
    desc: doc.metaDesc,
    keywords: `${district.shortName} 마사지, ${district.shortName} 출장 마사지, ${district.shortName} 홈타이, ${district.shortName} 로드샵, ${province.short} ${district.shortName} 스웨디시`,
    path: district.url, nav: province.slug, provinces, assets,
    geo: { name: `${province.name} ${district.name}`, lat: district.lat, lng: district.lng },
    main,
    jsonld: [
      S.websiteLd(), S.organizationLd(), c.ld,
      S.placeLd({ name: `${province.name} ${district.name}`, path: district.url, lat: district.lat, lng: district.lng, parent: province.name, desc: clip(doc.answer, 200) }),
      S.serviceLd({ name: `${district.name} 마사지·출장 마사지·홈타이 정보`, path: district.url, areaName: `${province.name} ${district.name}`, desc: clip(doc.answer, 200) }),
      S.itemListLd({ path: district.url, name: `${district.name} 행정동 목록`, items: district.dongs.map((d) => ({ name: d.name, url: d.url })) }),
      S.faqLd(doc.faqs, district.url),
      S.articleLd({ path: district.url, headline: `${district.name} 마사지 지역 가이드`, desc: clip(doc.answer), lastmod }),
    ],
  });
}

/* ────────────────────────────── 행정동 */
export function dongPage(ctx) {
  const { dong, district, province, provinces, assets, doc, lastmod } = ctx;
  const c = crumbs([
    { name: '전체 지역', url: '/' },
    { name: province.name, url: province.url },
    { name: district.name, url: district.url },
    { name: dong.name, url: dong.url },
  ]);
  const hero = heroPair({
    key: `${province.slug}/${district.slug}/${dong.slug}`,
    eyebrow: `${province.short} ${district.shortName}`,
    title: `${dong.name} 마사지`, ghost: shortDong(dong.name),
    sub: `로드샵 · 출장 마사지 · 홈타이 ${dong.shops.length}곳 · ${dong.profile[0]}`,
    note: `${site.ctaLabel} ${site.phoneLabel}`,
  });
  const road = dong.shops.filter((s) => s.type === 'road').length;

  const main = `${c.html}
<div class="hero">${hero}</div>
<h1>${esc(dong.name)} 마사지 · 출장 마사지 · 홈타이</h1>
${answerBlock(doc.answer)}
${statsBlock([
    { value: `${dong.shops.length}곳`, label: '등록 업소 (가상)' },
    { value: `${road}곳`, label: '로드샵' },
    { value: `${dong.shops.length - road}곳`, label: '출장 · 홈타이' },
    { value: `${dong.band.p90}만원`, label: '90분 참고 가격' },
  ])}

<section aria-labelledby="shop-h">
<div class="section-head"><h2 id="shop-h">${esc(dong.name)} 업소 ${dong.shops.length}곳</h2><span class="section-note">운영 형태 · 코스 · 참고 가격</span></div>
<div class="grid grid-3">${dong.shops.map((s) => shopCard(s)).join('')}</div>
${demoNote()}
</section>

<hr class="sep">
<section>${proseBlock(doc)}</section>
${faqBlock(doc.faqs)}

<section aria-labelledby="near-h">
<div class="section-head"><h2 id="near-h">${esc(district.shortName)} 인접 지역</h2><span class="section-note">시간이 맞지 않을 때 함께 확인</span></div>
${linkChips([...dong.neighbors.map((n) => ({ name: n.name, url: n.url })), { name: `${district.shortName} 전체 보기`, url: district.url }], '인접 행정동')}
</section>`;

  return page({
    title: `${dong.name} 마사지 출장 홈타이 | ${province.short} ${district.shortName} | ${site.brand}`,
    desc: doc.metaDesc,
    keywords: `${dong.name} 마사지, ${dong.name} 출장 마사지, ${dong.name} 홈타이, ${shortDong(dong.name)} 마사지, ${district.shortName} 마사지, ${dong.name} 로드샵, ${shortDong(dong.name)} 스웨디시`,
    path: dong.url, nav: province.slug, provinces, assets,
    geo: { name: `${province.name} ${district.name} ${dong.name}`, lat: dong.lat, lng: dong.lng },
    ctaLabel: `${dong.name} 로드샵 · 홈타이 상담`,
    main,
    jsonld: [
      S.websiteLd(), S.organizationLd(), c.ld,
      S.placeLd({ name: `${province.name} ${district.name} ${dong.name}`, path: dong.url, lat: dong.lat, lng: dong.lng, parent: district.name, desc: clip(doc.answer, 200) }),
      S.serviceLd({ name: `${dong.name} 마사지·출장 마사지·홈타이 정보`, path: dong.url, areaName: `${province.name} ${district.name} ${dong.name}`, desc: clip(doc.answer, 200) }),
      S.itemListLd({ path: dong.url, name: `${dong.name} 업소 목록`, items: dong.shops.map((s) => ({ name: s.name, url: s.url })) }),
      S.faqLd(doc.faqs, dong.url),
      S.articleLd({ path: dong.url, headline: `${dong.name} 마사지 지역 가이드`, desc: clip(doc.answer), lastmod }),
    ],
  });
}

/* ────────────────────────────── 업소 상세 */
export function shopPage(ctx) {
  const { shop, dong, district, province, provinces, assets, doc } = ctx;
  const c = crumbs([
    { name: '전체 지역', url: '/' },
    { name: province.name, url: province.url },
    { name: district.name, url: district.url },
    { name: dong.name, url: dong.url },
    { name: shop.name, url: shop.url },
  ]);
  const hero = heroPair({
    key: shop.seed, eyebrow: `${province.short} ${district.shortName} ${dong.name}`,
    title: shop.name, ghost: shop.typeShort,
    sub: `${shop.typeLabel} · ${shop.open}~${shop.close} · ${shop.courses.map((x) => x.name).slice(0, 2).join(' / ')}`,
    note: `${site.ctaLabel} ${site.phoneLabel}`,
  });

  const main = `${c.html}
<div class="hero">${hero}</div>
<h1>${esc(shop.name)} — ${esc(dong.name)} ${esc(shop.typeLabel)}</h1>
${answerBlock(shop.desc, '업소 소개')}
${demoNote()}

<section aria-labelledby="info-h">
<div class="section-head"><h2 id="info-h">기본 정보</h2></div>
<div class="grid grid-2 grid-start">
<div class="card"><div class="card-body">
<dl class="kv">
<dt>운영 형태</dt><dd>${esc(shop.typeLabel)}</dd>
<dt>지역</dt><dd><a href="${dong.url}">${esc(province.short)} ${esc(district.shortName)} ${esc(dong.name)}</a></dd>
<dt>운영 시간</dt><dd>${esc(shop.open)} ~ ${esc(shop.close)}</dd>
<dt>예약</dt><dd>전화 예약 · ${esc(site.phoneLabel)}</dd>
<dt>코스</dt><dd>${shop.courses.map((x) => esc(x.name)).join(', ')}</dd>
</dl>
</div></div>
<div class="card"><div class="card-body">
<table class="price"><caption>코스별 참고 금액 — 실제 금액은 전화 확인 기준</caption>
<thead><tr><th scope="col">시간</th><th scope="col">참고 금액</th></tr></thead>
<tbody>${shop.menu.map((m) => `<tr><th scope="row">${esc(m.label)}</th><td>${m.price}만원</td></tr>`).join('')}</tbody></table>
<div class="badges" style="margin-top:12px">${shop.amenities.map((a) => `<span class="badge">${esc(a)}</span>`).join('')}</div>
</div></div>
</div>
<p style="margin-top:14px"><a class="btn btn-primary btn-block" href="tel:${site.phone}">${esc(site.ctaLabel)} ${esc(site.phoneLabel)}</a></p>
</section>

<section aria-labelledby="course-h">
<div class="section-head"><h2 id="course-h">코스 안내</h2></div>
<div class="grid grid-3">${shop.courses.map((x) => `<div class="card"><div class="card-body"><h3 class="card-title">${esc(x.name)}</h3><p class="card-desc">${esc(x.desc)}</p></div></div>`).join('')}</div>
</section>

<hr class="sep">
<section>${proseBlock(doc, { toc: false })}</section>

<section aria-labelledby="same-h">
<div class="section-head"><h2 id="same-h">${esc(dong.name)} 다른 업소</h2></div>
<div class="grid grid-3">${dong.shops.filter((s) => s !== shop).map((s) => shopCard(s)).join('')}</div>
</section>
${linkChips([{ name: `${dong.name} 지역 정보`, url: dong.url }, { name: `${district.shortName} 전체`, url: district.url }, ...dong.neighbors.slice(0, 3).map((n) => ({ name: n.name, url: n.url }))], '관련 지역')}`;

  return page({
    title: `${shop.name} | ${dong.name} ${shop.typeLabel} · 출장 마사지 홈타이 | ${site.brand}`,
    desc: clip(shop.desc, 180),
    keywords: `${dong.name} ${shop.typeLabel}, ${dong.name} 마사지, ${dong.name} 출장 마사지, ${dong.name} 홈타이, ${district.shortName} 마사지`,
    path: shop.url, nav: province.slug, provinces, assets,
    // 가상 데이터인 동안 업소 상세는 색인에서 제외 (site.demoData)
    robots: site.demoData ? 'noindex,follow' : 'index,follow,max-image-preview:large',
    geo: { name: `${province.name} ${district.name} ${dong.name}`, lat: dong.lat, lng: dong.lng },
    ctaLabel: `${shop.typeLabel} · ${dong.name}`,
    main,
    jsonld: [S.websiteLd(), S.organizationLd(), c.ld, S.shopLd(shop)],
  });
}

/* ────────────────────────────── 가이드 */
export function guidePage(ctx) {
  const { provinces, assets, guide, lastmod } = ctx;
  const c = crumbs([{ name: '전체 지역', url: '/' }, { name: '이용 가이드', url: '/guide/' }]);
  const hero = heroPair({
    key: 'guide', eyebrow: '처음 이용하는 분을 위한 안내', title: '마사지 예약 가이드', ghost: 'GUIDE',
    sub: '운영 형태 · 시간 · 코스 · 총액 · 위생 확인 순서',
    note: `${site.ctaLabel} ${site.phoneLabel}`,
  });
  const main = `${c.html}
<div class="hero">${hero}</div>
<h1>마사지·출장 마사지·홈타이 이용 가이드</h1>
${answerBlock(guide.answer)}
<section>${proseBlock(guide)}</section>
${faqBlock(guide.faqs)}
${linkChips(provinces.map((p) => ({ name: `${p.name} 지역 보기`, url: p.url })), '지역 선택')}`;

  return page({
    title: `마사지·출장 마사지·홈타이 이용 가이드 | ${site.brand}`,
    desc: STATIC_META.guide,
    keywords: '마사지 예약 방법, 출장 마사지 이용법, 홈타이 준비, 마사지 가격, 마사지 코스 차이',
    path: '/guide/', nav: 'guide', provinces, assets, main,
    jsonld: [
      S.websiteLd(), S.organizationLd(), c.ld, S.faqLd(guide.faqs, '/guide/'),
      S.articleLd({ path: '/guide/', headline: '마사지·출장 마사지·홈타이 이용 가이드', desc: clip(guide.answer), lastmod }),
    ],
  });
}

/* ────────────────────────────── 검색 */
export function searchPage(ctx) {
  const { provinces, assets } = ctx;
  const c = crumbs([{ name: '전체 지역', url: '/' }, { name: '지역 검색', url: '/search/' }]);
  const main = `${c.html}
<h1>지역 검색</h1>
<p class="lead">행정동 또는 행정구 이름을 입력하세요. 서울·경기·인천의 행정구 ${provinces.reduce((s, p) => s + p.districts.length, 0)}곳과 행정동 ${provinces.reduce((s, p) => s + p.dongCount, 0)}곳을 바로 찾을 수 있습니다.</p>
<div class="search-box">
<input data-search type="search" placeholder="예: 역삼동, 분당구, 송도동, suwon" aria-label="지역 검색" autocomplete="off">
</div>
<ul class="search-results" data-search-results aria-live="polite"></ul>
${linkChips(provinces.map((p) => ({ name: `${p.name} 전체`, url: p.url })), '시·도 바로가기')}`;
  return page({
    title: `지역 검색 | ${site.brand}`,
    desc: STATIC_META.search,
    path: '/search/', nav: 'search', provinces, assets, main,
    robots: 'noindex,follow',
    jsonld: [S.websiteLd()],
  });
}

/* ────────────────────────────── 404 */
export function notFoundPage(ctx) {
  const { provinces, assets } = ctx;
  const main = `<h1>페이지를 찾을 수 없습니다</h1>
<p class="lead">주소가 바뀌었거나 삭제된 페이지입니다. 아래에서 지역을 다시 선택해 주세요.</p>
${linkChips([{ name: '전체 지역', url: '/' }, ...provinces.map((p) => ({ name: p.name, url: p.url })), { name: '지역 검색', url: '/search/' }], '바로가기')}`;
  return page({
    title: `페이지를 찾을 수 없습니다 | ${site.brand}`,
    desc: STATIC_META.notFound,
    path: '/404.html', nav: '', provinces, assets, main, robots: 'noindex,nofollow', jsonld: [S.websiteLd()],
  });
}
