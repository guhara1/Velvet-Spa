/**
 * IndexNow 일괄 제출 — Bing · Yandex · Seznam 에 URL 변경을 즉시 통보한다.
 *   실행: SITE_URL=https://내도메인.com node scripts/indexnow.mjs
 *   옵션: --dry (전송 없이 미리보기)  --limit=100 (상위 N개만)
 *
 * 전제: 빌드가 만든 dist/<key>.txt 가 실제 도메인에서 열려야 한다.
 *       (검색엔진이 키 소유를 그 파일로 확인한다)
 *
 * 구글·네이버는 IndexNow 를 지원하지 않는다.
 *   · 구글  → Search Console 사이트맵 제출 + URL 검사 → 색인 생성 요청
 *   · 네이버 → 서치어드바이저 사이트맵/RSS 제출 + 웹페이지 수집 요청
 *   (구글 Indexing API 는 채용공고·방송이벤트 전용이라 이 사이트엔 쓸 수 없다)
 */
import { readFileSync, existsSync } from 'node:fs';
import { site } from '../site.config.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

if (site.urlIsPlaceholder) {
  console.error('✖ SITE_URL 이 설정되지 않았습니다. 실제 도메인으로 빌드한 뒤 실행하세요.');
  console.error('  예) SITE_URL=https://내도메인.com npm run build && SITE_URL=https://내도메인.com node scripts/indexnow.mjs');
  process.exit(1);
}
if (!existsSync('dist/urllist.txt')) {
  console.error('✖ dist/urllist.txt 가 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
}

const host = new URL(site.url).host;
const all = readFileSync('dist/urllist.txt', 'utf8').split('\n').filter(Boolean);

// 빌드 때와 다른 도메인으로 실행하면 전부 거부당하므로 먼저 막는다
const mismatched = all.filter((u) => !u.startsWith(`${site.url}/`) && u !== `${site.url}/`);
if (mismatched.length) {
  console.error(`✖ dist/urllist.txt 가 다른 도메인으로 생성되어 있습니다 (예: ${mismatched[0]}).`);
  console.error(`  같은 SITE_URL 로 다시 빌드하세요:  SITE_URL=${site.url} npm run build`);
  process.exit(1);
}
const urlList = all.slice(0, limit);

const ENDPOINTS = [
  { name: 'Bing',   url: 'https://www.bing.com/indexnow' },
  { name: 'Yandex', url: 'https://yandex.com/indexnow' },
  { name: 'Seznam', url: 'https://search.seznam.cz/indexnow' },
];

console.log(`호스트 ${host} · URL ${urlList.length.toLocaleString()}건 · 키 ${site.indexNowKey}`);
console.log(`키 확인 파일: ${site.url}/${site.indexNowKey}.txt`);
if (dry) {
  console.log('\n--dry 모드 — 전송하지 않습니다. 앞 5건:');
  urlList.slice(0, 5).forEach((u) => console.log('  ' + u));
  process.exit(0);
}

// IndexNow 는 1회 요청당 1만 건까지 허용
const CHUNK = 10000;
for (const ep of ENDPOINTS) {
  for (let i = 0; i < urlList.length; i += CHUNK) {
    const body = {
      host,
      key: site.indexNowKey,
      keyLocation: `${site.url}/${site.indexNowKey}.txt`,
      urlList: urlList.slice(i, i + CHUNK),
    };
    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      const label = `${ep.name} (${body.urlList.length}건)`;
      // 200 OK / 202 Accepted 가 정상. 422 는 키 확인 실패.
      console.log(`${res.ok ? '✔' : '✖'} ${label} → HTTP ${res.status} ${res.statusText}`);
      if (res.status === 403) console.log('   키 파일이 열리지 않습니다. 배포 후 다시 실행하세요.');
      if (res.status === 422) console.log('   URL 이 host 와 일치하지 않거나 키가 맞지 않습니다.');
    } catch (e) {
      console.log(`✖ ${ep.name} → 전송 실패: ${e.message}`);
    }
  }
}
