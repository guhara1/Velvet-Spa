/** 재사용 UI 조각 */
import { esc } from './layout.mjs';
import { site } from '../../site.config.mjs';
import { shopSvg } from '../lib/svg.mjs';
import { shortDong } from '../content/vocab.mjs';

const sectionId = (i, id) => `s-${i + 1}-${id}`;

/** 본문 섹션 + 목차 */
export function proseBlock(doc, { toc = true } = {}) {
  const secs = doc.sections.map((s, i) => ({ ...s, hid: sectionId(i, s.id) }));
  const tocHtml = toc && secs.length > 4
    ? `<nav class="toc" aria-label="목차"><ul class="toc-list">${secs.map((s) => `<li><a href="#${s.hid}">${esc(s.heading)}</a></li>`).join('')}</ul></nav>`
    : '';
  const body = secs.map((s) => `<h2 id="${s.hid}">${esc(s.heading)}</h2>${s.paras.map((p) => `<p>${esc(p)}</p>`).join('')}`).join('\n');
  return `${tocHtml}<div class="prose">${body}</div>`;
}

export function answerBlock(text, label = '요약') {
  return `<div class="answer"><h2>${esc(label)}</h2><p>${esc(text)}</p></div>`;
}

export function faqBlock(faqs, title = '자주 묻는 질문') {
  if (!faqs?.length) return '';
  return `<section aria-labelledby="faq-h">
<div class="section-head"><h2 id="faq-h">${esc(title)}</h2></div>
<div class="faq">${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><div class="faq-a">${esc(f.a)}</div></details>`).join('')}</div>
</section>`;
}

export function statsBlock(items) {
  return `<ul class="stats">${items.map((i) => `<li><b>${esc(i.value)}</b><span>${esc(i.label)}</span></li>`).join('')}</ul>`;
}

/** 업소 카드 */
export function shopCard(shop, { heading = 'h3' } = {}) {
  const badge = shop.type === 'road' ? 'badge-road' : 'badge-visit';
  return `<article class="card shop-card">
<a href="${shop.url}" aria-label="${esc(shop.name)} 상세 보기" tabindex="-1">${shopSvg({ key: shop.seed, name: shop.name, type: shop.typeLabel, label: `${shop.menu[0].label}~${shop.menu[shop.menu.length - 1].label} 코스` })}</a>
<div class="card-body">
<div class="badges"><span class="badge ${badge}">${esc(shop.typeLabel)}</span>${shop.amenities.slice(0, 2).map((a) => `<span class="badge badge-tag">${esc(a)}</span>`).join('')}</div>
<${heading} class="card-title"><a href="${shop.url}">${esc(shop.name)}</a></${heading}>
<p class="card-sub">${esc(shop.province.short)} ${esc(shop.district.shortName)} ${esc(shop.dong.name)} · ${esc(shop.open)}~${esc(shop.close)}</p>
<p class="card-desc">${esc(shop.desc)}</p>
<table class="price"><caption>참고 가격 (실제 금액은 전화 확인 기준)</caption>
<thead><tr><th scope="col">코스 시간</th><th scope="col">참고 금액</th></tr></thead>
<tbody>${shop.menu.map((m) => `<tr><th scope="row">${esc(m.label)}</th><td>${m.price}만원</td></tr>`).join('')}</tbody></table>
<p class="demo-flag">예시용 가상 업소 데이터</p>
<div class="card-foot">
<a class="btn btn-sm btn-ghost" href="${shop.url}">상세 보기</a>
<a class="btn btn-sm btn-primary" href="tel:${site.phone}">${esc(site.ctaLabel)}</a>
</div>
</div>
</article>`;
}

/** 행정동 칩 목록 */
export function dongGrid(dongs) {
  return `<ul class="dong-grid">${dongs.map((d) => `<li><a href="${d.url}"><span>${esc(d.name)}</span><em>${d.shops.length}곳</em></a></li>`).join('')}</ul>`;
}

/** 행정구 카드 — 시 단위로 묶어서 표시 (경기도 대응) */
export function districtGroups(province) {
  const groups = new Map();
  for (const d of province.districts) {
    const key = d.city ?? '__flat__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }
  const flat = groups.get('__flat__') ?? [];
  groups.delete('__flat__');
  const cards = (list) => `<div class="grid grid-3">${list.map((d) => `<a class="area-card" href="${d.url}">
<b>${esc(d.city ? d.shortName : d.name)}</b>
<span class="tagline">${esc(d.profile.slice(0, 2).join(' · '))}</span>
<span>행정동 ${d.dongs.length}곳 · 업소 ${d.shopCount}곳 · 90분 ${esc(d.band.p90)}만원</span>
</a>`).join('')}</div>`;

  const cityBlocks = [...groups.entries()].map(([city, list]) => `<div class="city-block"><h3>${esc(city)} <small style="font-weight:600;color:var(--muted);font-size:13px">일반구 ${list.length}곳</small></h3>${cards(list)}</div>`).join('');
  return `${flat.length ? cards(flat) : ''}${cityBlocks ? `<div style="display:grid;gap:26px;margin-top:${flat.length ? '26px' : '0'}">${cityBlocks}</div>` : ''}`;
}

/** 인접 지역 링크 */
export function linkChips(items, label) {
  if (!items?.length) return '';
  return `<nav aria-label="${esc(label)}"><ul class="inline-links">${items.map((i) => `<li><a href="${i.url}">${esc(i.name)}</a></li>`).join('')}</ul></nav>`;
}

/** 가상 데이터 고지 */
export function demoNote() {
  return `<p class="note"><b>가상 예시 데이터</b> · ${esc(site.demoNotice)}</p>`;
}

export { shortDong };
