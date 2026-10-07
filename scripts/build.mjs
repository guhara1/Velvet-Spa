/**
 * 정적 사이트 빌드 — dist/ 생성
 *   1) data/regions.json → 모델
 *   2) 페이지 렌더 (홈 / 시도 / 행정구 / 행정동 / 업소 / 가이드 / 검색 / 404)
 *   3) sitemap 인덱스 · robots.txt · search-index.json · favicon
 *   4) 품질 검증 (1,500자 / 키워드 / 미치환 토큰 / 중복도) — 실패 시 빌드 중단
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { site } from '../site.config.mjs';
import { buildModel } from '../src/lib/model.mjs';
import { dongContent, guContent, shopContent, charCount, unresolved } from '../src/lib/content.mjs';
import { PROVINCE_CONTENT } from '../src/content/province-content.mjs';
import { HOME, GUIDE } from '../src/content/static-pages.mjs';
import { REQUIRED_KEYWORDS } from '../src/content/meta-pools.mjs';
import * as P from '../src/templates/pages.mjs';
import { markSvg } from '../src/lib/svg.mjs';
import { rssXml, atomXml, robotsTxt } from '../src/lib/feeds.mjs';

const OUT = 'dist';
const t0 = Date.now();
const lastmod = new Date().toISOString().slice(0, 10);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const write = (path, body) => {
  const file = `${OUT}${path}`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
};
/**
 * 모든 페이지 디스크립션에 '출장 마사지' + '홈타이' 가 들어갔는지 검사한다.
 * 검색엔진이 읽는 최종 결과(렌더된 HTML)를 기준으로 보기 때문에 누락이 새지 않는다.
 */
const checkMeta = (url, html) => {
  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
  if (!desc) { errors.push(`${url}: description 없음`); return; }
  const miss = REQUIRED_KEYWORDS.filter((k) => !desc.includes(k));
  if (miss.length) errors.push(`${url}: description 키워드 누락 [${miss.join(', ')}] — "${desc.slice(0, 48)}…"`);
  if (desc.length > 165) errors.push(`${url}: description ${desc.length}자 (165자 초과)`);
  if (desc.length < 60) errors.push(`${url}: description ${desc.length}자 (60자 미만)`);
};

const writePage = (url, html) => { checkMeta(url, html); write(`${url}index.html`, html); };
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);

// ── 에셋 (내용 해시 → 1년 immutable 캐시)
const css = readFileSync('src/assets/style.css', 'utf8');
const js = readFileSync('src/assets/app.js', 'utf8');
const assets = { css: `/assets/style.${hash(css)}.css`, js: `/assets/app.${hash(js)}.js` };
write(assets.css, css);
write(assets.js, js);
write('/favicon.svg', markSvg(40));

// ── 모델
const regions = JSON.parse(readFileSync('data/regions.json', 'utf8'));
const provinces = buildModel(regions, site);

// ── 검증 수집기 (선언 위치 주의: writePage 보다 먼저 쓰인다)
const errors = [];
const warn = [];
const shingleSets = [];
const urls = [];

const addUrl = (loc, priority, changefreq) => urls.push({ loc, priority, changefreq });

/** 8-gram 집합 (중복도 측정용) */
function shingles(text) {
  const t = text.replace(/\s+/g, '');
  const set = new Set();
  for (let i = 0; i + 8 <= t.length; i += 2) set.add(t.slice(i, i + 8));
  return set;
}
function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function checkDoc(kind, path, doc) {
  const body = doc.answer + doc.sections.map((s) => s.heading + s.paras.join('')).join('');
  const faq = doc.faqs.map((f) => f.q + f.a).join('');
  const n = charCount(body);
  if (n < site.minChars) errors.push(`${kind} ${path}: 본문 ${n}자 (기준 ${site.minChars}자 미달)`);
  const bad = unresolved(body + faq);
  if (bad.length) errors.push(`${kind} ${path}: 미치환 토큰 ${[...new Set(bad)].join(', ')}`);
  shingleSets.push({ path, kind, set: shingles(body) });
  return n;
}

// ── 페이지 렌더
let pages = 0;
// 홈 '많이 찾는 지역' — 검색 수요가 큰 권역 우선, 없으면 앞에서부터 채움
const FEATURED_NAMES = ['강남구', '서초구', '송파구', '마포구', '영등포구', '성남시 분당구', '수원시 영통구', '고양시 일산동구', '용인시 수지구', '부천시', '화성시', '연수구', '부평구', '서구'];
const all = provinces.flatMap((p) => p.districts);
const featured = FEATURED_NAMES.map((n) => all.find((d) => d.name === n)).filter(Boolean);
for (const d of all) { if (featured.length >= 14) break; if (!featured.includes(d)) featured.push(d); }

const base = { provinces, assets, lastmod };

writePage('/', P.homePage({ ...base, home: HOME, featured }));
addUrl('/', '1.0', 'weekly'); pages++;

writePage('/guide/', P.guidePage({ ...base, guide: GUIDE }));
addUrl('/guide/', '0.6', 'monthly'); pages++;

writePage('/search/', P.searchPage({ ...base })); pages++;

writePage('/sitemap/', P.sitemapPage({ ...base }));
addUrl('/sitemap/', '0.7', 'weekly'); pages++;

// 피드 항목 — 사이트맵과 별개 경로로 수집을 유도한다
const feedItems = [
  { title: `${site.brand} — ${site.tagline}`, url: '/', desc: '서울·경기·인천 행정동별 로드샵·출장 마사지·홈타이 정보' },
  { title: '마사지·출장 마사지·홈타이 이용 가이드', url: '/guide/', desc: '운영 형태·시간·코스·총액·위생 확인 순서' },
  { title: '전체 지역 목록', url: '/sitemap/', desc: '행정구 77곳, 행정동 753곳 전체 목록' },
];
const notFound = P.notFoundPage({ ...base });
checkMeta('/404.html', notFound);
write('/404.html', notFound); pages++;

const searchIndex = [];

for (const province of provinces) {
  const doc = PROVINCE_CONTENT[province.slug];
  if (!doc) { errors.push(`시도 ${province.slug}: 본문 콘텐츠 없음`); continue; }
  checkDoc('시도', province.url, doc);
  writePage(province.url, P.provincePage({ ...base, province, doc }));
  addUrl(province.url, '0.9', 'weekly'); pages++;
  feedItems.push({ title: `${province.name} 마사지·출장 마사지·홈타이`, url: province.url, desc: doc.meta });

  for (const district of province.districts) {
    const gdoc = guContent(district);
    checkDoc('행정구', district.url, gdoc);
    const siblings = province.districts.filter((d) => d !== district).slice(0, 10);
    writePage(district.url, P.districtPage({ ...base, province, district, doc: gdoc, siblings }));
    addUrl(district.url, '0.8', 'weekly'); pages++;
    feedItems.push({ title: `${district.name} 마사지·출장 마사지·홈타이`, url: district.url, desc: gdoc.metaDesc });
    searchIndex.push({ n: district.name, p: province.name, s: district.slug, u: district.url });

    for (const dong of district.dongs) {
      const ddoc = dongContent(dong);
      checkDoc('행정동', dong.url, ddoc);
      writePage(dong.url, P.dongPage({ ...base, province, district, dong, doc: ddoc }));
      addUrl(dong.url, '0.7', 'weekly'); pages++;
      feedItems.push({ title: `${dong.name} 마사지·출장 마사지·홈타이`, url: dong.url, desc: ddoc.metaDesc });
      searchIndex.push({ n: dong.name, p: `${province.short} ${district.name}`, s: dong.slug, u: dong.url });

      for (const shop of dong.shops) {
        // 로드샵 디스크립션 필수 키워드 검증
        if (shop.type === 'road') {
          for (const kw of ['출장 마사지', '홈타이']) {
            if (!shop.desc.includes(kw)) errors.push(`업소 ${shop.url}: 로드샵 디스크립션에 '${kw}' 누락`);
          }
        }
        const sdoc = shopContent(shop);
        const bad = unresolved(sdoc.sections.map((s) => s.heading + s.paras.join('')).join(''));
        if (bad.length) errors.push(`업소 ${shop.url}: 미치환 토큰 ${[...new Set(bad)].join(', ')}`);
        writePage(shop.url, P.shopPage({ ...base, province, district, dong, shop, doc: sdoc }));
        if (!site.demoData) addUrl(shop.url, '0.5', 'monthly');
        pages++;
      }
    }
  }
}

write('/search-index.json', JSON.stringify(searchIndex));

// ── sitemap (5,000 URL 단위 분할 + 인덱스)
const CHUNK = 5000;
const chunks = [];
for (let i = 0; i < urls.length; i += CHUNK) chunks.push(urls.slice(i, i + CHUNK));
chunks.forEach((chunk, i) => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunk.map((u) => `<url><loc>${site.url}${u.loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  write(`/sitemaps/sitemap-${i + 1}.xml`, body);
});
write('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks.map((_, i) => `<sitemap><loc>${site.url}/sitemaps/sitemap-${i + 1}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`);

// ── RSS 2.0 / Atom 1.0 (네이버 RSS 제출 + 구글 사이트맵 포맷 겸용)
const feed = feedItems.slice(0, site.feedMax);
write('/rss.xml', rssXml(feed, lastmod));
write('/atom.xml', atomXml(feed, lastmod));

// ── robots.txt
write('/robots.txt', robotsTxt());

// ── IndexNow 키 파일 (Bing·Yandex·Seznam 즉시 통보용)
write(`/${site.indexNowKey}.txt`, site.indexNowKey);

// ── 색인 요청용 URL 목록 (scripts/indexnow.mjs 가 읽는다)
write('/urllist.txt', urls.map((u) => `${site.url}${u.loc}`).join('\n') + '\n');

// ── 중복도 검사 (같은 종류끼리 표본 비교)
function dupCheck(kind, limit = 260) {
  const list = shingleSets.filter((s) => s.kind === kind);
  if (list.length < 2) return null;
  const step = Math.max(1, Math.floor(list.length / limit));
  const sample = list.filter((_, i) => i % step === 0);
  let max = 0, pair = null, sum = 0, cnt = 0;
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) {
      const v = jaccard(sample[i].set, sample[j].set);
      sum += v; cnt++;
      if (v > max) { max = v; pair = [sample[i].path, sample[j].path]; }
    }
  }
  return { kind, n: list.length, sampled: sample.length, max, avg: sum / cnt, pair };
}
const dup = [dupCheck('행정동'), dupCheck('행정구')].filter(Boolean);
for (const d of dup) {
  if (d.max > 0.45) errors.push(`${d.kind} 중복도 과다: 최대 ${(d.max * 100).toFixed(1)}% (${d.pair?.join(' ↔ ')})`);
  else if (d.max > 0.35) warn.push(`${d.kind} 중복도 주의: 최대 ${(d.max * 100).toFixed(1)}%`);
}

// ── 결과
const lens = shingleSets.length;
console.log('─'.repeat(64));
console.table(dup.map((d) => ({
  구분: d.kind, 페이지: d.n, 표본: d.sampled,
  '최대 중복도': `${(d.max * 100).toFixed(1)}%`, '평균 중복도': `${(d.avg * 100).toFixed(1)}%`,
})));
console.log(`페이지 ${pages.toLocaleString()}개 · 사이트맵 URL ${urls.length.toLocaleString()}개 · 지역 본문 ${lens.toLocaleString()}건`);
console.log(`에셋 ${assets.css} / ${assets.js}`);
console.log(`색인 파일: /sitemap.xml · /rss.xml (${feed.length}건) · /atom.xml · /robots.txt · /urllist.txt · /${site.indexNowKey}.txt`);
console.log(`canonical 기준 URL: ${site.url}`);
if (site.urlIsPlaceholder) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  ⚠  SITE_URL 이 설정되지 않았습니다                               ║');
  console.log('║                                                                  ║');
  console.log('║  sitemap.xml · rss.xml · robots.txt · canonical 이 모두          ║');
  console.log('║  example.netlify.app 으로 생성됩니다. 이 상태로는 네이버·구글     ║');
  console.log('║  어느 쪽에도 색인되지 않습니다.                                   ║');
  console.log('║                                                                  ║');
  console.log('║  Netlify → Site settings → Environment variables 에              ║');
  console.log('║    SITE_URL = https://실제도메인.com                             ║');
  console.log('║  을 등록하고 재배포하세요. (Netlify 기본 배포면 자동 주입되는     ║');
  console.log('║   URL 변수를 쓰므로 별도 설정 없이도 netlify.app 주소가 들어갑니다)║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
}
if (warn.length) console.log(`\n⚠ 경고 ${warn.length}건\n${warn.slice(0, 10).map((w) => `  · ${w}`).join('\n')}`);
if (errors.length) {
  console.error(`\n✖ 검증 실패 ${errors.length}건`);
  console.error(errors.slice(0, 25).map((e) => `  · ${e}`).join('\n'));
  if (errors.length > 25) console.error(`  … 외 ${errors.length - 25}건`);
  process.exit(1);
}
console.log(`\n✔ 빌드 완료 (${((Date.now() - t0) / 1000).toFixed(1)}s) → ${OUT}/`);
