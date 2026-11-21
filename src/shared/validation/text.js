/**
 * 글자 입력 공통 검사 유틸리티
 */

/**
 * 글자 단위로 자르는 도구    
 * (👨‍👩‍👧 같은 이모지를 하나의 글자로 인식하도록)
 */
const graphemeSegmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });

/**
 * 비었는지 확인합니다. 공백만 있어도 빈 값으로 봅니다
 * @param {string} value  검사할 문자열
 * @returns {boolean} 비어 있으면 true, 아니면 false
 */
export function isBlank(value) {
  // 문자열이 아니면 (undefined, null 포함) 빈 값
  return typeof value !== 'string' || value.trim() === '';
}

/**
 * 앞 뒤 공백을 제외한 문자열의 길이를 반환합니다.
 * 👨‍👩‍👧, 🙇‍♂️ 같은 2글자 이상이 결합된 이모지나 복합 문자도 한 글자로 계산합니다.
 * 
 * @example
 * countChars('👨‍👩‍👧'); // 1
 * 
 * // length로만 계산하면 아래와 같이 됩니다.
 * '👨‍👩‍👧'.length; // 8
 * 
 * @param {string} value  검사할 문자열
 * @returns {number} 앞 뒤 공백을 제외한 문자열 길이
 */
export function countChars(value) {

  return isBlank(value) ? 0 : [...graphemeSegmenter.segment(value.trim())].length;
}

/**
 * 해당 문자열이 min 과 max 사이 길이인지 확인합니다 (앞뒤 공백 제외)
 * 
 * @param {string} value  검사할 문자열
 * @param {number} min 최소 길이, 기본 값 1
 * @param {number} max 최대 길이, 기본 값 Infinity
 * @returns {boolean} 길이가 범위 안이면 true, 아니면 false
 */
export function isLengthBetween(value, min = 1, max = Infinity) {

  // 앞 뒤 공백이 제거된 문자열 길이 계산
  const length = countChars(value);

  return length >= min && length <= max;
}


/**
 * 해당 문자열이 주어진 '정규식 패턴'을 만족하는지 검사합니다.
 * 
 * @example
 * // 비밀 번호: 영문 + 숫자 + 특수문자(!@#$%^&*)가 하나이상 포함되어 있는가?
 * regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])/;
 * matchesPattern('Abc123!', regex); // true
 * matchesPattern('abc123', regex); // false
 * 
 * 
 * @param {string} value  검사할 문자열
 * @param {RegExp} pattern 검사할 정규식 패턴
 * @returns {boolean} 패턴을 만족하면 true, 아니면 false
 */
export function matchesPattern(value, pattern) {
  return !isBlank(value) && pattern.test(value);
}


//출처: [Ů̳̠̗̮̥́̉͗̍̋̔̓ͅͅI̯̰̦̰͎̾̀͑̈́͛́͋̒̐͑͐를 파괴하는 이상한 문자](https://www.youtube.com/watch?v=hpsoB1fZuRg)
/**    
* 태그 문자 : 영문을 안 보이게 숨길 때 쓰는 글자 (U+E0000 ~ U+E007F)
* 본문을 통해 이미지 생성하려 할 때 영문으로 숨은 인젝션 공격 방지용
*/
const TAG_CHARS = /[\u{E0000}-\u{E007F}]/u;

// 방향 제어 : 글자가 보이는 순서를 뒤집거나 바꾸는 글자
const DIRECTION_CONTROLS = /[\u202A-\u202E\u2066-\u2069]/;

// 결합 문자가 3개 이상 겹친 곳 (Ż̛̏̌͌a̛̍̏l҇̈́͛̌g͒̎͗̕ò͂̍̒̈́͝). ❤️, 1️⃣, 베트남어는 2개 이하라 통과
const STACKED_MARKS = /\p{M}{3,}/u;


/**
 * 안 보이게 숨긴 글자(태그 문자)가 있는지 확인합니다
 * @param {string} value
 * @returns {boolean} 있으면 true, 없으면 false
 */
export function hasTagChars(value) {
  return typeof value === 'string' && TAG_CHARS.test(value);
}

/**
 * 글자 순서를 바꾸는 방향 제어 문자가 있는지 확인합니다
 * @param {string} value
 * @returns {boolean} 있으면 true, 없으면 false
 */
export function hasDirectionControls(value) {
  return typeof value === 'string' && DIRECTION_CONTROLS.test(value);
}

/**
 * 결합 문자가 과하게 겹쳐 있는지 확인합니다 (화면을 깨는Z̴̫̘̭͉̘͕̞͕͉̀̂̆͋̃̊̒́͆͌̐ͅà̶͓̬̖͍̰͇̳̥̗̂̒͂̀̍̐̚l̶̯̦̣̳͕͈͎͕̜̲͋͛̏̊̂̐͆̍̀̂ͅg̵̲̳̤͓̈͐̎̾̅̄́͐ó̷̱̯̱̣̱̲̬̫̙̤͉̍̿͋͛̏͗̏̋ 문자)
 * @param {string} value
 * @returns {boolean} 있으면 true, 없으면 false
 */
export function hasStackedMarks(value) {
  return typeof value === 'string' && STACKED_MARKS.test(value);
}


/**
 * 입력된 문자열에 태그 문자, 방향 제어 문자, 결합 문자가 포함되어 있는지 확인합니다.
 * 
 * (위 3가지 함수 모두 하나로 합친 통합 함수 입니다.)
 * @param {string} value
 * @returns {boolean} 포함되어 있으면 true, 없으면 false
 */
export function hasInvalidChars(value) {
  return hasTagChars(value) || hasDirectionControls(value) || hasStackedMarks(value);
}

