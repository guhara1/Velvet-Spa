/**
 * 한글 → 로마자 변환 (국어의 로마자 표기법)
 * URL 슬러그는 한 번 정해지면 바꾸기 어려우므로 자음동화·연음까지 반영한다.
 *   종로 → jongno,  신림 → sillim,  설악 → seorak,  왕십리 → wangsimni
 * 외부 의존성 없음 / 유니코드 한글 음절 분해 방식.
 */
const CHO = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
/** 종성: 음절 끝에서의 표기 */
const JONG_END = ['','k','k','k','n','n','n','t','l','k','m','p','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t'];
/** 종성: 뒤에 모음(ㅇ 초성)이 올 때의 연음 표기 */
const JONG_LINK = ['','g','kk','ks','n','nj','nh','d','l','lg','lm','lb','ls','lt','lp','lh','m','b','bs','s','ss','ng','j','ch','k','t','p','h'];

/** 종성 그룹 */
const G_K = new Set([1, 2, 3, 9, 24]);          // ㄱ ㄲ ㄳ ㄺ ㅋ
const G_P = new Set([11, 14, 17, 18, 26]);      // ㄼ ㄿ ㅂ ㅄ ㅍ
const G_T = new Set([7, 19, 20, 22, 23, 25, 27]); // ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ
const G_N = new Set([4, 5, 6]);                 // ㄴ ㄵ ㄶ
const G_L = new Set([8, 12, 13, 15]);           // ㄹ ㄽ ㄾ ㅀ
const G_M = new Set([10, 16]);                  // ㄻ ㅁ
const NG = 21;

const CHO_N = 2, CHO_R = 5, CHO_M = 6, CHO_NONE = 11;

function decompose(ch) {
  const i = ch.codePointAt(0) - 0xac00;
  return { cho: Math.floor(i / 588), jung: Math.floor((i % 588) / 28), jong: i % 28 };
}
const isHangul = (ch) => {
  const c = ch.codePointAt(0);
  return c >= 0xac00 && c <= 0xd7a3;
};

/** 한글 문자열을 로마자로 */
export function romanize(str) {
  const chars = [...String(str)];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!isHangul(ch)) {
      out += /[a-zA-Z0-9]/.test(ch) ? ch.toLowerCase() : /[\s·~\-_./]/.test(ch) ? '-' : '';
      continue;
    }
    const cur = decompose(ch);
    const nextCh = chars[i + 1];
    const next = nextCh && isHangul(nextCh) ? decompose(nextCh) : null;

    let cho = CHO[cur.cho];
    // ── 앞 음절 종성의 영향으로 현재 초성이 바뀌는 경우
    if (i > 0 && isHangul(chars[i - 1])) {
      const prev = decompose(chars[i - 1]);
      if (cur.cho === CHO_R) {
        if (G_N.has(prev.jong) || G_L.has(prev.jong)) cho = 'l';                 // 신림 → sillim
        else if (prev.jong === NG || G_M.has(prev.jong) || G_K.has(prev.jong) || G_P.has(prev.jong) || G_T.has(prev.jong)) cho = 'n'; // 종로 → jongno
      } else if (cur.cho === CHO_N && G_L.has(prev.jong)) {
        cho = 'l';                                                                // 설날 → seollal
      }
    }

    let jong = '';
    if (cur.jong) {
      const nextCho = next ? next.cho : -1;
      const beforeVowel = nextCho === CHO_NONE;
      const nasalFollows = nextCho === CHO_N || nextCho === CHO_M || nextCho === CHO_R;
      if (beforeVowel) {
        jong = JONG_LINK[cur.jong];                                               // 설악 → seorak
        if (cur.jong === 8) jong = 'r';
      } else if (nasalFollows) {
        if (G_K.has(cur.jong)) jong = 'ng';                                        // 독립 → dongnip
        else if (G_P.has(cur.jong)) jong = 'm';                                    // 왕십리 → wangsimni
        else if (G_T.has(cur.jong)) jong = 'n';
        else if (G_N.has(cur.jong) && nextCho === CHO_R) jong = 'l';               // 신림 → sillim
        else jong = JONG_END[cur.jong];
      } else {
        jong = JONG_END[cur.jong];
      }
    }
    out += cho + JUNG[cur.jung] + jong;
  }
  return out;
}

/** 로마자 결과를 URL 안전 슬러그로 */
export function slugify(str) {
  return romanize(str).replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

/**
 * 장소명 → 슬러그
 *  · 동/구/시/군 접미사는 생략해 URL을 짧게 (역삼동 → yeoksam)
 *  · 읍/면은 동명과 겹칠 수 있어 유지 (가평읍 → gapyeong-eup)
 */
export function placeSlug(name) {
  const trimmed = String(name)
    .replace(/(특별시|광역시|특별자치시|특별자치도)$/, '')
    .replace(/([0-9~·]+)가$/, '-$1-ga')
    .replace(/[0-9]+$/, '');
  if (/(읍|면)$/.test(trimmed)) return slugify(trimmed.replace(/(읍|면)$/, (m) => `-${m}`));
  return slugify(trimmed.replace(/(동|구|시|군)$/, ''));
}

/** 같은 목록 안에서 슬러그 충돌 시 -2, -3 … 부여 */
export function uniqueSlugger() {
  const seen = new Map();
  return (name, fallback = 'area') => {
    const base = placeSlug(name) || slugify(name) || fallback;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}
