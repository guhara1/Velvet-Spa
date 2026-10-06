/**
 * {토큰} 치환 + 한국어 조사 자동 교정
 *   "{c2}로" → 받침 유무에 따라 "…으로" / "…로"
 *   "{c2}를" → "…을" / "…를"
 * 템플릿을 쓰는 사람이 조사를 신경 쓰지 않아도 문장이 깨지지 않게 한다.
 */
const PAIRS = {
  '을': ['을', '를'], '를': ['을', '를'],
  '은': ['은', '는'], '는': ['은', '는'],
  '이': ['이', '가'], '가': ['이', '가'],
  '과': ['과', '와'], '와': ['과', '와'],
  '으로': ['으로', '로'], '로': ['으로', '로'],
  '이라': ['이라', '라'], '라': ['이라', '라'],
  '이란': ['이란', '란'], '란': ['이란', '란'],
  '이며': ['이며', '며'], '며': ['이며', '며'],
};
const PARTICLE_RE = /(으로|이라|이란|이며|을|를|은|는|이|가|과|와|로|라|란|며)/;
const TOKEN_RE = new RegExp(`\\{(\\w+)\\}(${PARTICLE_RE.source})?`, 'g');

/** 마지막 글자의 종성 코드 (0 = 받침 없음, 8 = ㄹ) */
function finalJamo(str) {
  const last = [...String(str)].pop();
  if (!last) return -1;
  const c = last.codePointAt(0);
  if (c < 0xac00 || c > 0xd7a3) return -1; // 한글 음절이 아니면 판단 보류
  return (c - 0xac00) % 28;
}

function conjugate(value, particle) {
  const pair = PAIRS[particle];
  if (!pair) return particle;
  const jong = finalJamo(value);
  if (jong < 0) return particle;                       // 숫자/영문 끝 → 원문 유지
  if (particle === '으로' || particle === '로') return jong === 0 || jong === 8 ? '로' : '으로';
  return jong === 0 ? pair[1] : pair[0];
}

export function fill(template, vars) {
  return String(template).replace(TOKEN_RE, (m, key, particle) => {
    if (!(key in vars)) return m;
    const value = String(vars[key]);
    return particle ? value + conjugate(value, particle) : value;
  });
}

/** 미치환 토큰 검출 */
export const unresolved = (text) => text.match(/\{\w+\}/g) ?? [];
