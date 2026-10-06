/**
 * 사이트 데이터 모델 빌더
 * data/regions.json(행정구역) → 슬러그 / URL / 인접지역 / 가격대 / 가상 업소까지 붙인 트리
 */
import { rng } from './rng.mjs';
import { uniqueSlugger, slugify, placeSlug } from './romanize.mjs';
import { DISTRICT_PROFILE, FALLBACK_PROFILE, COURSES, CORE_COURSES, AMENITIES, NAME_HEAD, NAME_TAIL, NAME_HEAD_EN, NAME_TAIL_EN, SHOP_TYPES, shortDong } from '../content/vocab.mjs';
import { DESC_ROAD, DESC_VISIT } from '../content/shop-pools.mjs';
import { fill } from './fill.mjs';

/** 지역 성격 태그 3개 */
function profileFor(districtName, seed) {
  const base = DISTRICT_PROFILE[districtName] ?? [];
  const r = rng(`prof:${seed}`);
  const extra = r.pickN(FALLBACK_PROFILE.filter((t) => !base.includes(t)), 3);
  return [...base, ...extra].slice(0, 3);
}

/** 참고 가격대(만원) — 지역 시드 기반으로 고정 */
export function priceBand(seed) {
  const r = rng(`price:${seed}`);
  const b60 = r.int(6, 9);
  const b90 = b60 + r.int(2, 4);
  const b120 = b90 + r.int(3, 5);
  return {
    b60, b90, b120,
    p60: `${b60}~${b60 + 2}`,
    p90: `${b90}~${b90 + 3}`,
    p120: `${b120}~${b120 + 4}`,
  };
}

const HOURS_OPEN = ['10:00', '10:30', '11:00', '11:30', '12:00', '13:00'];
const HOURS_CLOSE = ['22:00', '23:00', '24:00', '익일 01:00', '익일 02:00', '익일 03:00'];

/** 행정동 하나에 가상 업소 3곳 생성 */
function makeShops(ctx) {
  const { province, district, dong, band } = ctx;
  const seed = `${province.slug}/${district.slug}/${dong.slug}`;
  const r = rng(`shops:${seed}`);
  const headIdx = r.pickN(NAME_HEAD.map((_, i) => i), 3);
  // 로드샵 2 + 출장 1 (순서는 지역마다 섞임) — 최소 1곳씩 보장
  const types = r.shuffle(['road', 'road', 'visit']);
  const slugger = uniqueSlugger();

  return types.map((typeKey, i) => {
    const sr = rng(`shop:${seed}#${i}`);
    const type = SHOP_TYPES[typeKey];
    const tailIdx = sr.int(0, NAME_TAIL.length - 1);
    const name = `${NAME_HEAD[headIdx[i]]} ${NAME_TAIL[tailIdx]} ${shortDong(dong.name)}점`;
    const slug = `${NAME_HEAD_EN[headIdx[i]]}-${NAME_TAIL_EN[tailIdx]}`;
    const courses = [...sr.pickN(CORE_COURSES, 2), ...sr.pickN(COURSES, sr.int(1, 2))]
      .filter((c, idx, arr) => arr.findIndex((o) => o.name === c.name) === idx);
    const amen = sr.pickN(
      typeKey === 'road'
        ? AMENITIES.filter((a) => !a.startsWith('홈타이'))
        : AMENITIES.filter((a) => !['주차 가능', '샤워 시설', '1인 단독룸', '2인 커플룸', '엘리베이터 있음'].includes(a)),
      sr.int(4, 6),
    );
    const open = sr.pick(HOURS_OPEN);
    const close = sr.pick(HOURS_CLOSE);
    const bump = typeKey === 'visit' ? sr.int(0, 2) : sr.int(-1, 1);
    const menu = [
      { min: 60, label: '60분', price: Math.max(5, band.b60 + bump) },
      { min: 90, label: '90분', price: Math.max(7, band.b90 + bump) },
      { min: 120, label: '120분', price: Math.max(9, band.b120 + bump) },
    ];
    const vars = {
      name, d: dong.name, ds: shortDong(dong.name), g: district.shortName, p: province.short,
      c1: courses[0].name, c2: courses[1].name, open, close,
      amen1: amen[0], amen2: amen[1],
      p60: band.p60, p90: band.p90, p120: band.p120,
      typeLabel: type.label,
    };
    const desc = fill(sr.pick(typeKey === 'road' ? DESC_ROAD : DESC_VISIT), vars);

    return {
      slug: slugger(slug, `shop-${i + 1}`),
      name, type: typeKey, typeLabel: type.label, typeShort: type.short,
      rating: (sr.int(42, 49) / 10).toFixed(1),
      reviews: sr.int(28, 416),
      open, close, amenities: amen, courses, menu, desc,
      seed: `${seed}#${i}`,
      vars,
    };
  });
}

/** 전체 모델 빌드 */
/** 노출 순서 (인구·검색량 기준) */
const PROVINCE_ORDER = ['seoul', 'gyeonggi', 'incheon'];

export function buildModel(regions, config) {
  const provinceSlugger = uniqueSlugger();
  const ordered = [...regions].sort((a, b) => PROVINCE_ORDER.indexOf(a.slug) - PROVINCE_ORDER.indexOf(b.slug));
  const model = ordered.map((p) => {
    const province = {
      code: p.code, name: p.name, short: p.short,
      slug: provinceSlugger(p.slug, p.slug),
      url: `/${p.slug}/`,
      districts: [],
    };
    const dSlugger = uniqueSlugger();
    province.districts = p.districts.map((d) => {
      const slug = d.city ? `${placeSlug(d.city)}-${placeSlug(d.shortName)}` : placeSlug(d.shortName);
      const district = {
        code: d.code, name: d.name, shortName: d.shortName, city: d.city,
        lat: d.lat, lng: d.lng,
        slug: dSlugger(slug, `gu-${d.code}`),
        province,
        dongs: [],
      };
      district.url = `${province.url}${district.slug}/`;
      district.profile = profileFor(d.name, `${province.slug}/${district.slug}`);
      district.band = priceBand(`${province.slug}/${district.slug}`);
      const dongSlugger = uniqueSlugger();
      district.dongs = d.dongs.map((x) => {
        const dong = {
          name: x.name, lat: x.lat, lng: x.lng,
          slug: dongSlugger(x.name, `dong-${x.name}`),
          province, district,
        };
        dong.url = `${district.url}${dong.slug}/`;
        dong.band = priceBand(`${province.slug}/${district.slug}/${dong.slug}`);
        dong.profile = profileFor(d.name, `${province.slug}/${district.slug}/${dong.slug}`);
        return dong;
      });
      // 인접 지역: 중심좌표 거리순 상위 4곳 (같은 구 안)
      for (const dong of district.dongs) {
        dong.neighbors = district.dongs
          .filter((o) => o !== dong)
          .map((o) => ({ o, dist: (o.lat - dong.lat) ** 2 + (o.lng - dong.lng) ** 2 }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 4)
          .map((x) => x.o);
      }
      for (const dong of district.dongs) {
        dong.shops = makeShops({ province, district, dong, band: dong.band });
        for (const s of dong.shops) { s.url = `${dong.url}${s.slug}/`; s.dong = dong; s.district = district; s.province = province; }
      }
      district.shopCount = district.dongs.reduce((s, x) => s + x.shops.length, 0);
      return district;
    });
    province.dongCount = province.districts.reduce((s, d) => s + d.dongs.length, 0);
    province.shopCount = province.districts.reduce((s, d) => s + d.shopCount, 0);
    return province;
  });
  return model;
}
