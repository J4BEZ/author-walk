
/**
 * 텍스트 처리 관련 함수 모음
 */



// '복사 붙여넣기'로 따라오는 안 보이는 공백 : 폭 없는 공백, 단어 연결자, BOM
const ZERO_WIDTH_CHARS = /[\u200B\u2060\uFEFF]/g;

/**
 * 폭 없는 공백을 지웁니다
 * @param {string} value
 * @returns {string}
 */
export function removeZeroWidthChars(value) {
  return value.replace(ZERO_WIDTH_CHARS, '');
}
