/**
 * 구조화 데이터 (JSON-LD) 빌더
 *  · 지역 페이지: WebSite / Place / Service / FAQPage / ItemList / BreadcrumbList
 *  · 업소 페이지: LocalBusiness — 단, 가상 데이터(site.demoData)일 때는 생성하지 않는다.
 *    검색엔진에 실재하지 않는 업체 정보를 공급하지 않기 위한 안전장치.
 */
import { site } from '../../site.config.mjs';

const abs = (p) => `${site.url}${p}`;

export function websiteLd() {
  return {
    '@type': 'WebSite',
    '@id': abs('/#website'),
    url: abs('/'),
    name: site.brand,
    inLanguage: 'ko-KR',
    description: site.tagline,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: abs('/search/?q={search_term_string}') },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationLd() {
  return {
    '@type': 'Organization',
    '@id': abs('/#org'),
    name: site.brand,
    url: abs('/'),
    telephone: `+82-${site.phone.replace(/^0/, '')}`,
    areaServed: ['서울특별시', '경기도', '인천광역시'].map((n) => ({ '@type': 'AdministrativeArea', name: n })),
  };
}

/** 지역 페이지용 Place + 그 지역에서 제공되는 Service */
export function placeLd({ name, path, lat, lng, parent, desc }) {
  return {
    '@type': 'Place',
    '@id': abs(`${path}#place`),
    name,
    description: desc,
    url: abs(path),
    ...(lat ? { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } } : {}),
    ...(parent ? { containedInPlace: { '@type': 'AdministrativeArea', name: parent } } : {}),
  };
}

export function serviceLd({ name, path, areaName, desc }) {
  return {
    '@type': 'Service',
    '@id': abs(`${path}#service`),
    name,
    serviceType: '마사지·출장 마사지·홈타이 정보 제공',
    description: desc,
    provider: { '@id': abs('/#org') },
    areaServed: { '@type': 'AdministrativeArea', name: areaName },
    audience: { '@type': 'Audience', geographicArea: { '@type': 'AdministrativeArea', name: areaName } },
  };
}

export function faqLd(faqs, path) {
  if (!faqs?.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': abs(`${path}#faq`),
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function itemListLd({ path, items, name }) {
  return {
    '@type': 'ItemList',
    '@id': abs(`${path}#list`),
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, url: abs(it.url),
    })),
  };
}

export function articleLd({ path, headline, desc, lastmod }) {
  return {
    '@type': 'Article',
    '@id': abs(`${path}#article`),
    headline,
    description: desc,
    inLanguage: 'ko-KR',
    isPartOf: { '@id': abs('/#website') },
    publisher: { '@id': abs('/#org') },
    datePublished: lastmod,
    dateModified: lastmod,
    mainEntityOfPage: abs(path),
  };
}

/** 업소 LocalBusiness — 실데이터 전환(site.demoData=false) 후에만 생성 */
export function shopLd(shop) {
  if (site.demoData) return null;
  return {
    '@type': shop.type === 'road' ? ['DaySpa', 'HealthAndBeautyBusiness'] : 'HealthAndBeautyBusiness',
    '@id': abs(`${shop.url}#business`),
    name: shop.name,
    description: shop.desc,
    url: abs(shop.url),
    telephone: `+82-${site.phone.replace(/^0/, '')}`,
    priceRange: `₩${shop.menu[0].price}0,000~₩${shop.menu[shop.menu.length - 1].price}0,000`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressRegion: shop.province.name,
      addressLocality: shop.district.name,
      streetAddress: `${shop.dong.name} 일대`,
    },
    geo: { '@type': 'GeoCoordinates', latitude: shop.dong.lat, longitude: shop.dong.lng },
    areaServed: { '@type': 'AdministrativeArea', name: `${shop.province.short} ${shop.district.shortName}` },
    openingHours: `Mo-Su ${shop.open}-${shop.close}`,
    makesOffer: shop.menu.map((m) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: `${m.label} 관리` },
      price: m.price * 10000, priceCurrency: 'KRW',
    })),
  };
}

export { abs };
