/**
 * 텍스트 기반 SVG 아트 생성기 (사진 소재 0장)
 *  · heroSvg()  : 지역 페이지 히어로 박스
 *  · shopSvg()  : 업소 카드/상세 썸네일
 *  · markSvg()  : 로고 마크
 * 팔레트·기하 파라미터를 지역 시드에서 뽑으므로 페이지마다 다른 그림이 나온다.
 */
import { rng } from './rng.mjs';

export const PALETTES = [
  { id: 'plum',   from: '#2E1838', to: '#120B1A', ac: '#E9C46A', ac2: '#C79BE8' },
  { id: 'jade',   from: '#0E2A33', to: '#08161C', ac: '#7ED8C3', ac2: '#9FD0E8' },
  { id: 'wine',   from: '#36131F', to: '#190A10', ac: '#F0A6B8', ac2: '#E9C46A' },
  { id: 'forest', from: '#13291F', to: '#0A1710', ac: '#BFE3A8', ac2: '#E3D8A4' },
  { id: 'indigo', from: '#1C1A3C', to: '#0C0B1E', ac: '#BFAEF5', ac2: '#8FD6F0' },
  { id: 'amber',  from: '#32210F', to: '#1A1107', ac: '#F2C078', ac2: '#DCA7D8' },
  { id: 'teal',   from: '#0D2B2B', to: '#071817', ac: '#E8D9B5', ac2: '#8ADBD0' },
  { id: 'slate',  from: '#1A2130', to: '#0B1017', ac: '#A9CDF2', ac2: '#E7C9A6' },
];

export const paletteFor = (seed) => PALETTES[rng(`pal:${seed}`).int(0, PALETTES.length - 1)];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v, d = 1) => Number(v.toFixed(d));

/** 긴 한글 문자열을 지정 길이로 줄바꿈 */
function wrap(text, per) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > per && cur) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * 히어로 박스
 * 가로형(1200×560) / 세로형(840×840) 두 벌을 만들고 CSS 미디어쿼리로 전환한다.
 * 한 벌을 잘라 쓰면 모바일에서 제목이 잘리기 때문.
 * @param {{key:string,eyebrow:string,title:string,sub:string,note?:string,ghost?:string,portrait?:boolean}} o
 */
export function heroSvg(o) {
  const portrait = !!o.portrait;
  const r = rng(`hero:${o.key}:${portrait ? 'p' : 'l'}`);
  const p = paletteFor(o.key);
  const uid = `h${portrait ? 'p' : 'l'}${Math.abs([...o.key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36)}`;
  const W = portrait ? 840 : 1200;
  const H = portrait ? 780 : 560;
  const pad = portrait ? 48 : 60;
  const rot = r.int(-14, 14);
  const arcs = r.int(4, 7);
  const cx = portrait ? r.int(45, 80) : r.int(60, 95);
  const cy = portrait ? r.int(6, 34) : r.int(8, 46);
  const ghost = (o.ghost || o.title).replace(/\s/g, '');

  let rings = '';
  for (let i = 0; i < arcs; i++) {
    const rad = (portrait ? 120 : 150) + i * r.int(52, 76);
    rings += `<circle cx="${(cx / 100) * W}" cy="${(cy / 100) * H}" r="${rad}" fill="none" stroke="${p.ac}" stroke-opacity="${n(0.16 - i * 0.018, 3)}" stroke-width="${i % 2 ? 1 : 1.6}"/>`;
  }
  let waves = '';
  const wy = H - r.int(portrait ? 120 : 70, portrait ? 190 : 130);
  for (let i = 0; i < 3; i++) {
    const amp = r.int(14, 30), off = i * r.int(16, 26);
    waves += `<path d="M-20 ${wy + off} C ${W * 0.25} ${wy + off - amp}, ${W * 0.55} ${wy + off + amp}, ${W + 20} ${wy + off - amp / 2}" fill="none" stroke="${i ? p.ac2 : p.ac}" stroke-opacity="${n(0.3 - i * 0.08, 2)}" stroke-width="1.4"/>`;
  }

  // 제목: 글자 수에 맞춰 자동 축소 (한글 1 / 공백 0.4 로 폭 환산)
  const per = portrait ? 8 : 13;
  const titleLines = wrap(o.title, per);
  const widest = Math.max(...titleLines.map((l) => [...l].reduce((a, c) => a + (c === ' ' ? 0.4 : 1), 0)));
  const maxSize = portrait ? 96 : 108;
  const tSize = Math.max(44, Math.min(maxSize, Math.floor((W - pad * 2) / widest)));
  const subLines = wrap(o.sub, portrait ? 17 : 34).slice(0, portrait ? 3 : 2);
  const blockH = 28 + titleLines.length * (tSize + 8) + subLines.length * (portrait ? 34 : 36) + 20;
  const top = portrait ? Math.round(H * 0.34) : Math.round((H - blockH) / 2);

  return `<svg class="hero-art" data-v="${portrait ? 'tall' : 'wide'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title)} ${esc(o.sub)}"${portrait ? ' aria-hidden="true"' : ''} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="${uid}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/></linearGradient>
<radialGradient id="${uid}gl" cx="${cx}%" cy="${cy}%" r="62%"><stop offset="0" stop-color="${p.ac}" stop-opacity=".34"/><stop offset="1" stop-color="${p.ac}" stop-opacity="0"/></radialGradient>
<radialGradient id="${uid}g2" cx="${100 - cx}%" cy="${100 - cy}%" r="54%"><stop offset="0" stop-color="${p.ac2}" stop-opacity=".22"/><stop offset="1" stop-color="${p.ac2}" stop-opacity="0"/></radialGradient>
<linearGradient id="${uid}tx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".74" stop-color="${p.ac}"/></linearGradient>
<filter id="${uid}gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
<clipPath id="${uid}cp"><rect width="${W}" height="${H}"/></clipPath>
</defs>
<g clip-path="url(#${uid}cp)">
<rect width="${W}" height="${H}" fill="url(#${uid}bg)"/>
<rect width="${W}" height="${H}" fill="url(#${uid}gl)"/>
<rect width="${W}" height="${H}" fill="url(#${uid}g2)"/>
<g transform="rotate(${rot} ${(cx / 100) * W} ${(cy / 100) * H})">${rings}</g>
<text x="${W - 30}" y="${H - (portrait ? 18 : 28)}" text-anchor="end" font-family="Pretendard, system-ui, sans-serif" font-size="${portrait ? 150 : 210}" font-weight="800" fill="none" stroke="${p.ac}" stroke-opacity=".12" stroke-width="1.2" letter-spacing="-6">${esc(ghost)}</text>
${waves}
<rect width="${W}" height="${H}" filter="url(#${uid}gr)" opacity=".055"/>
<g font-family="Pretendard, system-ui, sans-serif">
<text x="${pad + 4}" y="${top}" font-size="${portrait ? 25 : 26}" font-weight="600" letter-spacing="5" fill="${p.ac}" opacity=".95">${esc(o.eyebrow)}</text>
${titleLines.map((l, i) => `<text x="${pad}" y="${top + 28 + tSize + i * (tSize + 8)}" font-size="${tSize}" font-weight="800" letter-spacing="-3" fill="url(#${uid}tx)">${esc(l)}</text>`).join('')}
${subLines.map((l, i) => `<text x="${pad + 4}" y="${top + 28 + tSize + (titleLines.length - 1) * (tSize + 8) + (portrait ? 58 : 72) + i * (portrait ? 34 : 36)}" font-size="${portrait ? 23 : 25}" font-weight="500" fill="#FFFFFF" opacity=".84">${esc(l)}</text>`).join('')}
${o.note ? `<g><rect x="${pad}" y="${H - (portrait ? 96 : 86)}" rx="18" ry="18" width="${Math.min(W - pad * 2, 26 + o.note.length * (portrait ? 14 : 15))}" height="44" fill="#000000" opacity=".34"/><text x="${pad + 22}" y="${H - (portrait ? 66 : 56)}" font-size="${portrait ? 20 : 21}" font-weight="700" fill="${p.ac}">${esc(o.note)}</text></g>` : ''}
</g>
</g></svg>`;
}

/** 가로형 + 세로형을 함께 출력 (CSS 로 전환) */
export function heroPair(o) {
  return heroSvg(o) + heroSvg({ ...o, portrait: true });
}

/**
 * 업소 썸네일 (사진 대신 타이포 아트)
 * @param {{key:string,name:string,type:string,label:string}} o
 */
export function shopSvg(o) {
  const r = rng(`shop-art:${o.key}`);
  const p = paletteFor(`${o.key}#${r.int(0, 7)}`);
  const uid = `s${Math.abs([...o.key].reduce((a, c) => (a * 37 + c.charCodeAt(0)) | 0, 11)).toString(36)}`;
  const W = 800, H = 500;
  const band = r.int(-28, 28);
  const dotR = r.int(2, 3);
  const gap = r.int(26, 38);
  const initial = [...o.name.replace(/\s/g, '')][0] ?? '•';
  const lines = wrap(o.name, 11).slice(0, 2);

  return `<svg class="shop-art" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.name)} 대표 이미지" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="${uid}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/></linearGradient>
<linearGradient id="${uid}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.ac}" stop-opacity=".9"/><stop offset="1" stop-color="${p.ac2}" stop-opacity=".25"/></linearGradient>
<pattern id="${uid}d" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse"><circle cx="${gap / 2}" cy="${gap / 2}" r="${dotR}" fill="${p.ac}" fill-opacity=".14"/></pattern>
<clipPath id="${uid}c"><rect width="${W}" height="${H}"/></clipPath>
</defs>
<g clip-path="url(#${uid}c)">
<rect width="${W}" height="${H}" fill="url(#${uid}b)"/>
<rect width="${W}" height="${H}" fill="url(#${uid}d)"/>
<g transform="rotate(${band} 400 250)"><rect x="-240" y="188" width="1280" height="${r.int(64, 104)}" fill="url(#${uid}s)" opacity=".16"/></g>
<text x="${r.int(470, 560)}" y="${r.int(300, 400)}" font-family="Pretendard, system-ui, sans-serif" font-size="380" font-weight="800" fill="none" stroke="${p.ac}" stroke-opacity=".18" stroke-width="2">${esc(initial)}</text>
<g font-family="Pretendard, system-ui, sans-serif">
<text x="48" y="92" font-size="22" font-weight="700" letter-spacing="3" fill="${p.ac}">${esc(o.type)}</text>
${lines.map((l, i) => `<text x="44" y="${196 + i * 62}" font-size="56" font-weight="800" letter-spacing="-2" fill="#FFFFFF">${esc(l)}</text>`).join('')}
<text x="48" y="${lines.length > 1 ? 318 : 256}" font-size="24" font-weight="500" fill="#FFFFFF" opacity=".72">${esc(o.label)}</text>
<rect x="44" y="${H - 86}" rx="20" width="${26 + 16 * 10}" height="42" fill="#000" opacity=".32"/>
<text x="64" y="${H - 57}" font-size="20" font-weight="700" fill="${p.ac}">예시용 가상 업소</text>
</g>
</g></svg>`;
}

/** 헤더 로고 마크 */
export function markSvg(size = 34) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9C46A"/><stop offset="1" stop-color="#C79BE8"/></linearGradient></defs>
<rect width="40" height="40" rx="12" fill="url(#mk)"/>
<path d="M11 27c0-7 4-12 9-12s9 5 9 12" fill="none" stroke="#190F22" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="20" cy="12.5" r="2.6" fill="#190F22"/>
</svg>`;
}
