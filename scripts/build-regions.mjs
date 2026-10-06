/**
 * data/regions.json 생성기
 *
 * 원본: KOSTAT 센서스용 행정구역경계(2013) — southkorea/southkorea-maps
 *   · 읍면동(행정동) 3,482건 + 시군구 251건
 * 가공:
 *   1) 서울(11) / 인천(23) / 경기(31) 만 추출
 *   2) "○○1동 / ○○2동 / ○○3동" 은 대표 1곳(○○동)으로 통합  ← 요구사항
 *   3) 폴리곤 평균좌표로 중심 위경도 산출 (GEO 스키마 / 지도 링크용)
 *   4) 2013 이후 신설·개칭 행정구역 보정 (PATCH / RENAME / MERGE)
 *
 * 실행: npm run regions   (네트워크 필요, 결과는 저장소에 커밋됨)
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

const BASE = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json';
const CACHE = '.cache';
const PROVINCES = {
  '11': { name: '서울특별시', short: '서울', slug: 'seoul' },
  '23': { name: '인천광역시', short: '인천', slug: 'incheon' },
  '31': { name: '경기도', short: '경기', slug: 'gyeonggi' },
};

/** 행정구역 개칭 (2013 → 현재) */
const RENAME_MUN = { '23030': '미추홀구' };

/** 부천시는 2019년 일반구(원미/소사/오정) 폐지 → 단일 시로 통합 */
const MERGE_MUN = { '31051': '31050', '31052': '31050', '31053': '31050' };
const MERGED_NAME = { '31050': '부천시' };

/** 2013 이후 신설된 행정동 보정 (시군구코드: [[행정동, 위도, 경도], ...]) */
const PATCH_DONG = {
  '31130': [['다산동', 37.6031, 127.1573]],                                   // 남양주
  '31180': [['미사동', 37.5655, 127.1931], ['감일동', 37.5128, 127.1591], ['위례동', 37.4741, 127.1452]], // 하남
  '31240': [['새솔동', 37.2069, 126.7591]],                                   // 화성
  '31014': [['망포동', 37.2423, 127.0543]],                                   // 수원 영통구
  '31260': [['옥정동', 37.8277, 127.0821]],                                   // 양주
  '31150': [['배곧동', 37.3721, 126.7262]],                                   // 시흥
  '31101': [['향동동', 37.6021, 126.8923]],                                   // 고양 덕양구
  '31070': [['고덕동', 37.0472, 127.0471]],                                   // 평택
  '31250': [['신현동', 37.3718, 127.2283], ['능평동', 37.3634, 127.2291]],      // 광주
  '31230': [['마산동', 37.6481, 126.6421], ['운양동', 37.6512, 126.6861]],      // 김포
  '31030': [['고산동', 37.7121, 127.0912]],                                   // 의정부
  '31191': [['역북동', 37.2318, 127.1872], ['삼가동', 37.2251, 127.1731]],      // 용인 처인구
};

/** 숫자 분동 → 대표 1곳 통합. 예외 케이스는 명시적으로 매핑 */
const SPECIAL_BASE = {
  '종로1·2·3·4가동': '종로1~6가',
  '종로5·6가동': '종로1~6가',
  '화수1·화평동': '화수동',
};
export function baseDongName(name) {
  if (SPECIAL_BASE[name]) return SPECIAL_BASE[name];
  if (name.endsWith('읍') || name.endsWith('면')) return name;
  const m = /^(.+?)[\d·.]+(?:가[\d·.]*)?동$/.exec(name);
  return m ? `${m[1]}동` : name;
}

async function load(file) {
  mkdirSync(CACHE, { recursive: true });
  const path = `${CACHE}/${file}`;
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  process.stdout.write(`↓ ${file} … `);
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const text = await res.text();
  writeFileSync(path, text);
  console.log(`${(text.length / 1024 / 1024).toFixed(1)}MB`);
  return JSON.parse(text);
}

/** 폴리곤 전체 꼭짓점 평균 → 대표 좌표 */
function centroid(geometry) {
  let sx = 0, sy = 0, n = 0;
  const walk = (a) => {
    if (typeof a[0] === 'number') { sx += a[0]; sy += a[1]; n++; return; }
    for (const b of a) walk(b);
  };
  walk(geometry.coordinates);
  return n ? [sx / n, sy / n] : [0, 0];
}

const round = (v) => Math.round(v * 1e5) / 1e5;

/** "수원시장안구" → { city:'수원시', district:'장안구' } */
function splitMunicipality(name) {
  const m = /^(.+?시)(.+구)$/.exec(name);
  if (m) return { city: m[1], district: m[2] };
  return { city: null, district: name };
}

const [munGeo, subGeo] = await Promise.all([
  load('skorea_municipalities_geo_simple.json'),
  load('skorea_submunicipalities_geo_simple.json'),
]);

// ── 시군구
const municipalities = new Map();
for (const f of munGeo.features) {
  let code = f.properties.code;
  if (!PROVINCES[code.slice(0, 2)]) continue;
  const target = MERGE_MUN[code] ?? code;
  const name = MERGED_NAME[target] ?? RENAME_MUN[target] ?? f.properties.name;
  const [lng, lat] = centroid(f.geometry);
  const prev = municipalities.get(target);
  if (prev) { prev.acc.push([lng, lat]); continue; }
  municipalities.set(target, { code: target, rawName: name, acc: [[lng, lat]], dongs: new Map() });
}

// ── 행정동 (숫자 분동 통합)
let rawDongCount = 0;
for (const f of subGeo.features) {
  const code = f.properties.code;
  if (!PROVINCES[code.slice(0, 2)]) continue;
  const munCode = MERGE_MUN[code.slice(0, 5)] ?? code.slice(0, 5);
  const mun = municipalities.get(munCode);
  if (!mun) continue;
  rawDongCount++;
  const name = baseDongName(f.properties.name);
  const [lng, lat] = centroid(f.geometry);
  const slot = mun.dongs.get(name) ?? { name, acc: [], parts: 0 };
  slot.acc.push([lng, lat]);
  slot.parts++;
  mun.dongs.set(name, slot);
}

// ── 보정 데이터 주입
for (const [munCode, list] of Object.entries(PATCH_DONG)) {
  const mun = municipalities.get(munCode);
  if (!mun) { console.warn(`! PATCH 대상 시군구 없음: ${munCode}`); continue; }
  for (const [name, lat, lng] of list) {
    if (mun.dongs.has(name)) continue;
    mun.dongs.set(name, { name, acc: [[lng, lat]], parts: 1, patched: true });
  }
}

const avg = (acc) => {
  const lng = acc.reduce((s, p) => s + p[0], 0) / acc.length;
  const lat = acc.reduce((s, p) => s + p[1], 0) / acc.length;
  return { lat: round(lat), lng: round(lng) };
};

const out = Object.entries(PROVINCES).map(([pc, p]) => {
  const districts = [...municipalities.values()]
    .filter((m) => m.code.startsWith(pc))
    .map((m) => {
      const { city, district } = splitMunicipality(m.rawName);
      const dongs = [...m.dongs.values()]
        .map((d) => ({ name: d.name, ...avg(d.acc), ...(d.patched ? { patched: true } : {}) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      return {
        code: m.code,
        name: city ? `${city} ${district}` : district,
        shortName: district,
        city,
        ...avg(m.acc),
        dongs,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
  return { code: pc, name: p.name, short: p.short, slug: p.slug, districts };
});

const stats = out.map((p) => ({
  province: p.name,
  districts: p.districts.length,
  dongs: p.districts.reduce((s, d) => s + d.dongs.length, 0),
}));

mkdirSync('data', { recursive: true });
writeFileSync('data/regions.json', JSON.stringify(out, null, 1) + '\n');
console.table(stats);
console.log(`원본 행정동 ${rawDongCount}건 → 대표 통합 후 ${stats.reduce((s, r) => s + r.dongs, 0)}건`);
console.log('✔ data/regions.json');
