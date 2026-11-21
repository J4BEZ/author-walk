// 글자 입력 공통 검사 (도서, 표지 생성 등 어디서나 사용)

/**
 * 비었는지 확인합니다. 공백만 있어도 빈 값으로 봅니다
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBlank(value) {
  // 문자열이 아니면 (undefined, null 포함) 빈 값
  return typeof value !== 'string' || value.trim() === '';
}

/**
 * 글자 수가 범위 안인지 검사합니다 (앞뒤 공백 제외)
 * 기본적으로 최소 1자 이상, 최대 제한은 없음
 * @param {string} value
 * @param {{ label: string, min?: number, max?: number }} rule  label 은 안내 문구에 들어갈 이름
 * @returns {string | null}  통과하면 null, 실패하면 안내 문구
 */
export function checkLength(value, { label, min = 1, max = Infinity }) {
  const length = isBlank(value) ? 0 : value.trim().length;

  if (length < min) return min === 1 ? `${label}을(를) 입력해 주세요.` : `${label}은(는) ${min}자 이상이어야 합니다.`;
  if (length > max) return `${label}은(는) ${max}자 이하로 입력해 주세요.`;
  return null;
}
