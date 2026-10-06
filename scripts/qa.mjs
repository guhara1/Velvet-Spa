/**
 * 빌드 결과 점검 — dist/ 를 훑어 접근성·SEO·성능 관련 기본 항목을 확인한다.
 * 실행: npm run build && npm run qa
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { REQUIRED_KEYWORDS } from '../src/content/meta-pools.mjs';

const OUT = 'dist';
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f);
    else if (f.endsWith('.html')) files.push(f);
  }
})(OUT);

const fail = [];
const count = { total: files.length, noindex: 0, faq: 0, geo: 0 };
let maxSize = 0, maxFile = '', sumSize = 0;

for (const f of files) {
  const h = readFileSync(f, 'utf8');
  const size = Buffer.byteLength(h);
  sumSize += size;
  if (size > maxSize) { maxSize = size; maxFile = f; }

  const need = [
    ['<title>', '제목'],
    ['name="description"', 'description'],
    ['rel="canonical"', 'canonical'],
    ['<h1', 'h1'],
    ['lang="ko"', 'lang 속성'],
    ['application/ld+json', 'JSON-LD'],
    [`href="tel:05082024749"`, '전화 링크'],
  ];
  for (const [needle, label] of need) if (!h.includes(needle)) fail.push(`${f}: ${label} 없음`);

  const h1 = (h.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail.push(`${f}: h1 ${h1}개 (1개여야 함)`);

  const title = /<title>(.*?)<\/title>/s.exec(h)?.[1] ?? '';
  if (title.length > 90) fail.push(`${f}: title ${title.length}자 (과다)`);
  const desc = /name="description" content="(.*?)"/s.exec(h)?.[1] ?? '';
  if (desc.length < 50) fail.push(`${f}: description ${desc.length}자 (과소)`);
  if (desc.length > 165) fail.push(`${f}: description ${desc.length}자 (과다)`);
  // 디스크립션 필수 키워드
  for (const k of REQUIRED_KEYWORDS) if (!desc.includes(k)) fail.push(`${f}: description '${k}' 누락`);
  // 업소 설명(화면 노출)에도 동일 기준 적용
  for (const d of [...h.matchAll(/<article class="card shop-card">[\s\S]*?<p class="card-desc">([\s\S]*?)<\/p>/g)]
    .concat([...h.matchAll(/<div class="answer"><h2>업소 소개<\/h2><p>([\s\S]*?)<\/p>/g)])) {
    for (const k of REQUIRED_KEYWORDS) if (!d[1].includes(k)) fail.push(`${f}: 업소 설명 '${k}' 누락`);
  }

  // 이미지 대체 텍스트 (인라인 SVG는 role=img + aria-label 사용)
  const svgs = (h.match(/<svg[^>]*>/g) ?? []).filter((t) => !t.includes('aria-hidden'));
  for (const t of svgs) if (!t.includes('aria-label') && !t.includes('role="img"')) fail.push(`${f}: 대체 텍스트 없는 SVG`);

  if (h.includes('content="noindex')) count.noindex++;
  if (h.includes('"FAQPage"')) count.faq++;
  if (h.includes('name="geo.position"')) count.geo++;
  try { JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(h)[1].replace(/\\u003c/g, '<')); }
  catch { fail.push(`${f}: JSON-LD 파싱 실패`); }
}

console.log(`HTML ${count.total.toLocaleString()}개 · 평균 ${(sumSize / count.total / 1024).toFixed(1)}KB · 최대 ${(maxSize / 1024).toFixed(1)}KB (${maxFile})`);
console.log(`FAQPage ${count.faq} · geo 메타 ${count.geo} · noindex ${count.noindex}`);
console.log(`디스크립션 필수 키워드 [${REQUIRED_KEYWORDS.join(', ')}] — 전 페이지 검사 완료`);
if (fail.length) {
  console.error(`\n✖ ${fail.length}건`);
  console.error([...new Set(fail.map((x) => x.replace(/^dist\/[^:]+/, '…')))].slice(0, 20).join('\n'));
  console.error('예시:', fail.slice(0, 5).join(' | '));
  process.exit(1);
}
console.log('\n✔ QA 통과');
