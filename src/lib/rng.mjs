/**
 * 시드 기반 결정론적 난수 — 같은 지역/같은 섹션이면 항상 같은 결과.
 * 빌드를 몇 번 돌려도 콘텐츠가 흔들리지 않아야 색인이 안정된다.
 */
export function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function rng(seedStr) {
  let a = hashSeed(seedStr)();
  const next = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const api = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length) % arr.length],
    chance: (p) => next() < p,
    shuffle: (arr) => {
      const a2 = [...arr];
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    },
    pickN: (arr, n) => api.shuffle(arr).slice(0, n),
    /** 가중치 선택: [[값, 가중치], ...] */
    weighted: (pairs) => {
      const total = pairs.reduce((s, p) => s + p[1], 0);
      let r = next() * total;
      for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; }
      return pairs[pairs.length - 1][0];
    },
  };
  return api;
}
