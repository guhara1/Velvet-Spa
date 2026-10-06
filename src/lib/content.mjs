/**
 * 지역 본문 생성기
 *  · 섹션 순서 셔플 + 슬롯별 문장 선택 + 단락 묶음 방식까지 시드로 흔들어
 *    행정동 753곳 / 행정구 77곳이 서로 다른 글이 되도록 만든다.
 *  · 공백 제외 1,500자 미달이면 예비 문단을 붙여 기준을 보장한다.
 */
import { rng } from './rng.mjs';
import { fill, unresolved } from './fill.mjs';
import { DONG_SECTIONS } from '../content/dong-pools.mjs';
import { DONG_SECTIONS_B, DONG_FAQ } from '../content/dong-pools2.mjs';
import { DONG_SECTIONS_C, RESERVE_POOL } from '../content/dong-pools3.mjs';
import { GU_SECTIONS, GU_FAQ } from '../content/gu-pools.mjs';
import { GU_SECTIONS_B } from '../content/gu-pools2.mjs';
import { GU_SECTIONS_C } from '../content/gu-pools3.mjs';
import { PROFILE_PHRASE, CORE_COURSES, shortDong } from '../content/vocab.mjs';
import { DONG_META, GU_META } from '../content/meta-pools.mjs';
import { SHOP_SECTIONS, FLOW_ROAD, FLOW_VISIT } from '../content/shop-pools.mjs';

const ALL_DONG = [...DONG_SECTIONS, ...DONG_SECTIONS_B, ...DONG_SECTIONS_C];
const ALL_GU = [...GU_SECTIONS, ...GU_SECTIONS_B, ...GU_SECTIONS_C];

/** 행정동 요약(답변 우선) — AEO 대응 / 디스크립션 키워드 2종 포함 */
const DONG_ANSWER = [
  '{p} {g} {d} 기준으로 로드샵과 출장 마사지·홈타이 {shops}곳을 정리했습니다. 참고 가격대는 60분 {p60}만원대, 90분 {p90}만원대이며, 평일 낮 시간대가 예약이 가장 수월합니다. 이동이 왕복 20분을 넘으면 홈타이가, 도보권이면 로드샵이 유리합니다.',
  '{d}에서 마사지를 찾는다면 로드샵과 출장 마사지 중 하나를 고르는 것이 순서입니다. 이 페이지에는 로드샵·홈타이 {shops}곳의 운영 정보와 60분 {p60}만원대 / 90분 {p90}만원대 참고 시세, 예약 전 확인 항목을 정리했습니다.',
  '{p} {g} {d} 마사지 정보입니다. 로드샵과 출장 마사지·홈타이 {shops}곳을 운영 형태별로 나눠 두었고, 90분 코스 기준 {p90}만원대가 체감 시세입니다. 홈타이는 2평 정도의 공간만 있으면 가능하며 전화로 당일 가능 여부를 확인할 수 있습니다.',
  '{d} 일대의 로드샵·출장 마사지·홈타이 {shops}곳을 한 페이지에 모았습니다. 60분 {p60}만원대부터 시작하며, 혼잡한 평일 저녁을 피하면 선택지가 넓어집니다. 각 카드에서 코스와 운영 시간을 바로 확인할 수 있습니다.',
  '{g} {d}은 {t1} 성격이 강한 생활권입니다. 이 페이지에서는 로드샵과 출장 마사지·홈타이 {shops}곳, 코스 선택 기준, 60분 {p60}만원대 / 90분 {p90}만원대 참고 가격, 방문 준비 방법을 순서대로 정리했습니다.',
  '{d}에서 받을 수 있는 관리 정보를 모았습니다. 업소는 {shops}곳이며 로드샵과 출장 마사지·홈타이가 함께 있습니다. 참고 시세는 90분 {p90}만원대이고, 처음이라면 60분 또는 90분으로 시작하는 쪽을 권합니다.',
];

/** 행정구 요약 — 디스크립션 키워드 2종 포함 */
const GU_ANSWER = [
  '{p} {g}는 행정동 {dongCount}곳으로 나뉘고, 로드샵과 출장 마사지·홈타이 {shopCount}곳이 지역별로 정리되어 있습니다. 구 단위로 뭉뚱그려 찾기보다 생활권이 걸치는 행정동부터 좁혀 보는 쪽이 훨씬 빠릅니다. 참고 가격대는 60분 {p60}만원대, 90분 {p90}만원대입니다.',
  '{g} 전역의 로드샵·출장 마사지·홈타이 정보를 행정동 {dongCount}곳 단위로 나눠 담았습니다. 전체 업소는 {shopCount}곳이며, 60분 {p60}만원대 / 90분 {p90}만원대 범위에서 가격이 형성됩니다.',
  '{p} {g} 마사지 안내입니다. {t1} 성격이 두드러지는 권역으로, 행정동 {dongCount}곳에 로드샵과 출장 마사지·홈타이 {shopCount}곳을 배치했습니다. 평일 오전 11시~오후 3시가 예약이 가장 수월한 구간입니다.',
  '{g}는 행정동마다 업소 구성과 가격대가 다릅니다. {dongCount}개 행정동의 로드샵·출장 마사지·홈타이 {shopCount}곳을 같은 기준으로 정리했으니 거주지·직장과 가까운 지역부터 확인해 보세요. 참고 시세는 90분 {p90}만원대입니다.',
  '{p} {g}의 행정동 {dongCount}곳과 업소 {shopCount}곳을 모았습니다. 역세권은 로드샵, 단지 중심 지역은 출장 마사지·홈타이가 유리한 구조이며, 총 소요 시간을 기준으로 비교하면 선택이 쉬워집니다.',
];

const charCount = (text) => text.replace(/\s/g, '').length;

/** 섹션 배열을 시드로 재배치 (pin:first/last 유지) */
function arrange(sections, r) {
  const first = sections.filter((s) => s.pin === 'first');
  const last = sections.filter((s) => s.pin === 'last');
  const mid = r.shuffle(sections.filter((s) => !s.pin));
  return [...first, ...mid, ...last];
}

function renderSections(sections, vars, seed) {
  const r = rng(`sec:${seed}`);
  return arrange(sections, r).map((s) => {
    const sr = rng(`sec:${seed}#${s.id}`);
    const heading = fill(sr.pick(s.headings), vars);
    const a = fill(sr.pick(s.a), vars);
    const b = fill(sr.pick(s.b), vars);
    const c = fill(sr.pick(s.c), vars);
    // 단락 묶음 방식도 흔들어 글의 호흡을 바꾼다
    const paras = sr.chance(0.5) ? [a, `${b} ${c}`] : sr.chance(0.5) ? [`${a} ${b}`, c] : [a, b, c];
    return { id: s.id, heading, paras };
  });
}

function renderFaqs(pool, vars, seed, limit) {
  const r = rng(`faq:${seed}`);
  return r.shuffle(pool).slice(0, limit).map((f, i) => {
    const fr = rng(`faq:${seed}#${i}`);
    return { q: fill(fr.pick(f.q), vars), a: fill(fr.pick(f.a), vars) };
  });
}

/** 1,500자 보장 — 예비 문단도 변형 풀에서 뽑아 페이지마다 다르게 붙인다 */
function ensureLength(doc, seed, vars, min = 1500) {
  const body = () => doc.answer + doc.sections.map((s) => s.heading + s.paras.join('')).join('');
  const r = rng(`pad:${seed}`);
  const reserve = r.shuffle(RESERVE_POOL);
  let i = 0;
  while (charCount(body()) < min && i < reserve.length) {
    const x = reserve[i++];
    const xr = rng(`pad:${seed}#${i}`);
    doc.sections.splice(doc.sections.length - 1, 0, {
      id: `note-${i}`,
      heading: fill(xr.pick(x.h), vars),
      paras: xr.pick(x.p).map((t) => fill(t, vars)),
    });
  }
  doc.chars = charCount(body());
  doc.charsWithFaq = doc.chars + charCount(doc.faqs.map((f) => f.q + f.a).join(''));
  return doc;
}

export function dongContent(dong) {
  const { province, district, band, neighbors } = dong;
  const seed = `${province.slug}/${district.slug}/${dong.slug}`;
  const r = rng(`vars:${seed}`);
  const courses = r.pickN(CORE_COURSES, 2);
  const vars = {
    d: dong.name, ds: shortDong(dong.name), g: district.shortName, p: province.short,
    city: district.city ?? district.shortName,
    n1: neighbors[0]?.name ?? district.shortName, n2: neighbors[1]?.name ?? district.shortName,
    n3: neighbors[2]?.name ?? district.shortName,
    t1: dong.profile[0], t2: dong.profile[1] ?? dong.profile[0],
    pp1: PROFILE_PHRASE[dong.profile[0]] ?? '생활권 안에서 꾸준한 수요가 유지되는 지역입니다',
    pp2: PROFILE_PHRASE[dong.profile[1]] ?? PROFILE_PHRASE[dong.profile[0]] ?? '이용 시간대가 넓게 분포합니다',
    c1: courses[0].name, c2: courses[1].name,
    p60: band.p60, p90: band.p90, p120: band.p120,
    shops: dong.shops.length, dongCount: district.dongs.length, shopCount: district.shopCount,
  };
  const doc = {
    metaDesc: fill(rng(`meta:${seed}`).pick(DONG_META), vars),
    answer: fill(rng(`ans:${seed}`).pick(DONG_ANSWER), vars),
    sections: renderSections(ALL_DONG, vars, seed),
    faqs: renderFaqs(DONG_FAQ, vars, seed, 4),
    vars,
  };
  return ensureLength(doc, seed, vars);
}

export function guContent(district) {
  const { province, band } = district;
  const seed = `${province.slug}/${district.slug}`;
  const r = rng(`vars:${seed}`);
  const picks = r.pickN(district.dongs, 3);
  const vars = {
    g: district.shortName, p: province.short, city: district.city ?? district.shortName,
    dongCount: district.dongs.length, shopCount: district.shopCount,
    d: picks[0]?.name ?? district.shortName, ds: shortDong(picks[0]?.name ?? district.shortName),
    d1: picks[0]?.name ?? district.shortName, d2: picks[1]?.name ?? district.shortName,
    d3: picks[2]?.name ?? district.shortName,
    t1: district.profile[0], t2: district.profile[1] ?? district.profile[0],
    pp1: PROFILE_PHRASE[district.profile[0]] ?? '권역 전체에서 수요가 고르게 분포합니다',
    pp2: PROFILE_PHRASE[district.profile[1]] ?? PROFILE_PHRASE[district.profile[0]] ?? '시간대별 편차가 큰 편입니다',
    p60: band.p60, p90: band.p90, p120: band.p120,
  };
  const doc = {
    metaDesc: fill(rng(`meta:${seed}`).pick(GU_META), vars),
    answer: fill(rng(`ans:${seed}`).pick(GU_ANSWER), vars),
    sections: renderSections(ALL_GU, vars, seed),
    faqs: renderFaqs(GU_FAQ, vars, seed, 4),
    vars,
  };
  return ensureLength(doc, seed, vars);
}

export { charCount, unresolved };

/** 업소 상세 페이지 본문 */
export function shopContent(shop) {
  const seed = `shopdoc:${shop.seed}`;
  const r = rng(seed);
  const flow = shop.type === 'road' ? FLOW_ROAD : FLOW_VISIT;
  const vars = { ...shop.vars, roadOrVisit: r.pick(flow) };
  const sections = SHOP_SECTIONS.map((s) => {
    const sr = rng(`${seed}#${s.id}`);
    return {
      id: s.id,
      heading: fill(sr.pick(s.headings), vars),
      paras: [fill(sr.pick(s.a), vars), `${fill(sr.pick(s.b), vars)} ${fill(sr.pick(s.c), vars)}`],
    };
  });
  const body = sections.map((s) => s.heading + s.paras.join('')).join('');
  return { answer: shop.desc, sections, faqs: [], chars: charCount(body) };
}
