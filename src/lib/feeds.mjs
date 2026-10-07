/**
 * RSS 2.0 / Atom 1.0 피드 + robots.txt 생성기
 *
 * 왜 피드를 만드는가
 *  · 네이버 서치어드바이저는 '요청 → RSS 제출' 창구가 따로 있고, 사이트맵과
 *    별개 경로로 수집 대상을 받는다. 두 경로를 다 열어 두면 발견이 빨라진다.
 *  · 구글은 RSS 2.0 / Atom 1.0 을 사이트맵 포맷으로 인정하므로 robots.txt 의
 *    Sitemap 지시어에 그대로 넣을 수 있다.
 */
import { site } from '../../site.config.mjs';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const abs = (p) => `${site.url}${p}`;

/** RSS 2.0 */
export function rssXml(items, buildDate) {
  const pub = new Date(buildDate).toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(site.brand)} — ${esc(site.tagline)}</title>
<link>${abs('/')}</link>
<description>${esc(site.tagline)}. 행정구·행정동별 로드샵, 출장 마사지, 홈타이 정보를 같은 기준으로 정리합니다.</description>
<language>ko</language>
<lastBuildDate>${pub}</lastBuildDate>
<pubDate>${pub}</pubDate>
<generator>${esc(site.brandEn)} static builder</generator>
<atom:link href="${abs('/rss.xml')}" rel="self" type="application/rss+xml"/>
${items.map((it) => `<item>
<title>${esc(it.title)}</title>
<link>${abs(it.url)}</link>
<guid isPermaLink="true">${abs(it.url)}</guid>
<description>${esc(it.desc)}</description>
<pubDate>${pub}</pubDate>
</item>`).join('\n')}
</channel>
</rss>`;
}

/** Atom 1.0 */
export function atomXml(items, buildDate) {
  const iso = new Date(buildDate).toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ko">
<title>${esc(site.brand)} — ${esc(site.tagline)}</title>
<subtitle>${esc(site.tagline)}</subtitle>
<id>${abs('/')}</id>
<link href="${abs('/')}"/>
<link href="${abs('/atom.xml')}" rel="self" type="application/atom+xml"/>
<updated>${iso}</updated>
<author><name>${esc(site.brand)}</name></author>
${items.map((it) => `<entry>
<title>${esc(it.title)}</title>
<link href="${abs(it.url)}"/>
<id>${abs(it.url)}</id>
<updated>${iso}</updated>
<summary>${esc(it.desc)}</summary>
</entry>`).join('\n')}
</feed>`;
}

/**
 * robots.txt
 * 네이버 Yeti / 다음 Daumoa / 구글 / 빙을 명시 허용하고,
 * 사이트맵·RSS·Atom 세 경로를 모두 알린다.
 */
export function robotsTxt() {
  return `# ${site.brand} — ${site.tagline}
# 전체 공개. 검색 색인을 환영합니다.

User-agent: Yeti
Allow: /

User-agent: NaverBot
Allow: /

User-agent: Daumoa
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Disallow: /search/

# 사이트맵 (구글은 RSS/Atom 도 사이트맵 포맷으로 인정)
Sitemap: ${abs('/sitemap.xml')}
Sitemap: ${abs('/rss.xml')}
Sitemap: ${abs('/atom.xml')}
`;
}
